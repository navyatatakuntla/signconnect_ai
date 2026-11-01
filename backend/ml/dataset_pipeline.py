import os
import json
import zipfile
from pathlib import Path
import cv2
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    confusion_matrix, classification_report
)

from feature_extraction import HandLandmarkExtractor

DATASET_DIR = Path(__file__).resolve().parent.parent / "dataset" / "raw" / "isl_repo"
RAW_ZIP_PATH = DATASET_DIR / "dataset_ISL.zip"
PROCESSED_DIR = Path(__file__).resolve().parent.parent / "dataset" / "processed"
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

def get_class_image_files(cls_char: str):
    """
    Find image files for a class, checking both extracted directory and fallback zip.
    """
    cls_lower = cls_char.lower()
    cls_upper = cls_char.upper()
    
    # 1. Check extracted folder first
    candidate_folders = [DATASET_DIR / cls_lower, DATASET_DIR / cls_upper]
    for folder in candidate_folders:
        if folder.exists() and folder.is_dir():
            files = sorted(list(folder.glob("*.jpg")) + list(folder.glob("*.jpeg")) + list(folder.glob("*.png")))
            if files:
                return [("path", f) for f in files]
                
    # 2. Fallback to zip archive if folder not found
    if RAW_ZIP_PATH.exists():
        z = zipfile.ZipFile(RAW_ZIP_PATH)
        all_z_files = z.namelist()
        cls_files = [f for f in all_z_files if (f.startswith(f"{cls_lower}/") or f.startswith(f"{cls_upper}/")) and f.endswith(".jpg")]
        if cls_files:
            return [("zip", f) for f in cls_files]
            
    return []

def run_extraction_and_training(samples_per_class: int = 70):
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("  STAGE 6: MediaPipe Hand Landmark Feature Extraction")
    print("  Target Dataset: backend/dataset/raw/isl_repo/ (Hannure ISL Dataset)")
    print("=" * 60)
    
    extractor = HandLandmarkExtractor()
    classes = [chr(i) for i in range(ord('A'), ord('Z') + 1)] # A through Z
    print(f"Target classes ({len(classes)}): {classes}")
    
    features_list = []
    labels_list = []
    skipped_count = 0
    total_processed = 0
    per_class_detected = {}
    
    zip_obj = None
    if RAW_ZIP_PATH.exists():
        zip_obj = zipfile.ZipFile(RAW_ZIP_PATH)
    
    for cls in classes:
        image_entries = get_class_image_files(cls)
        selected_entries = image_entries[:samples_per_class]
        detected_for_cls = 0
        
        for entry_type, entry_ref in selected_entries:
            total_processed += 1
            try:
                if entry_type == "path":
                    img = cv2.imread(str(entry_ref))
                    feats, has_hand = extractor.extract_from_bgr(img)
                else:
                    data = zip_obj.read(entry_ref)
                    feats, has_hand = extractor.extract_from_bytes(data)
                    
                if has_hand and feats is not None:
                    features_list.append(feats)
                    labels_list.append(cls)
                    detected_for_cls += 1
                    
                    # Horizontal mirror augmentation (supports both left/right hands & mirrored webcam)
                    flipped_feats = feats.copy()
                    flipped_feats[0::3] = -flipped_feats[0::3]
                    features_list.append(flipped_feats)
                    labels_list.append(cls)
                else:
                    skipped_count += 1
            except Exception:
                skipped_count += 1
                
        # If class detection count was low due to high crop variations, extract from subsequent images
        if detected_for_cls < 15 and len(image_entries) > samples_per_class:
            extra_entries = image_entries[samples_per_class:samples_per_class * 2]
            for entry_type, entry_ref in extra_entries:
                if detected_for_cls >= 25:
                    break
                try:
                    if entry_type == "path":
                        img = cv2.imread(str(entry_ref))
                        feats, has_hand = extractor.extract_from_bgr(img)
                    else:
                        data = zip_obj.read(entry_ref)
                        feats, has_hand = extractor.extract_from_bytes(data)
                    if has_hand and feats is not None:
                        features_list.append(feats)
                        labels_list.append(cls)
                        flipped_feats = feats.copy()
                        flipped_feats[0::3] = -flipped_feats[0::3]
                        features_list.append(flipped_feats)
                        labels_list.append(cls)
                        detected_for_cls += 1
                except Exception:
                    pass
                    
        per_class_detected[cls] = detected_for_cls
        print(f"Class {cls}: {detected_for_cls} hands detected from {len(selected_entries)} images (with flip: {detected_for_cls * 2} samples)")

    X = np.array(features_list)
    y = np.array(labels_list)
    
    print("\n" + "=" * 60)
    print("  EXTRACTION SUMMARY")
    print(f"  Total images inspected: {total_processed}")
    print(f"  Total feature vectors generated (with mirror augmentation): {len(X)}")
    print(f"  Skipped images (unclear hand / crop edge): {skipped_count}")
    print("=" * 60)
    
    # Save processed features CSV (21 landmarks * 3 coords = 63 features)
    columns = [f"lm_{i}_{axis}" for i in range(21) for axis in ["x", "y", "z"]]
    df = pd.DataFrame(X, columns=columns)
    df["label"] = y
    csv_path = PROCESSED_DIR / "isl_landmarks.csv"
    df.to_csv(csv_path, index=False)
    print(f"Saved processed features to: {csv_path}")
    
    print("\n" + "=" * 60)
    print("  STAGE 7 & 8: Model Training (70% Train, 15% Val, 15% Test)")
    print("=" * 60)
    
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )
    
    print(f"Train samples: {len(X_train)}")
    print(f"Validation samples: {len(X_val)}")
    print(f"Test samples: {len(X_test)}")
    
    # 1. Random Forest (Baseline)
    print("\nTraining Random Forest Classifier (Baseline Model)...")
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train)
    rf_val_acc = rf_model.score(X_val, y_val)
    rf_test_pred = rf_model.predict(X_test)
    rf_test_acc = accuracy_score(y_test, rf_test_pred)
    print(f"Random Forest Validation Accuracy: {rf_val_acc * 100:.2f}% | Test Accuracy: {rf_test_acc * 100:.2f}%")
    
    # 2. Support Vector Machine (Comparison)
    print("\nTraining Support Vector Machine (Comparison Model)...")
    svm_model = SVC(kernel="rbf", C=10.0, random_state=42)
    svm_model.fit(X_train, y_train)
    svm_test_pred = svm_model.predict(X_test)
    svm_test_acc = accuracy_score(y_test, svm_test_pred)
    print(f"SVM Test Accuracy: {svm_test_acc * 100:.2f}%")
    
    # 3. K-Nearest Neighbors (Comparison)
    print("\nTraining K-Nearest Neighbors (Comparison Model)...")
    knn_model = KNeighborsClassifier(n_neighbors=5, weights="distance")
    knn_model.fit(X_train, y_train)
    knn_test_pred = knn_model.predict(X_test)
    knn_test_acc = accuracy_score(y_test, knn_test_pred)
    print(f"KNN Test Accuracy: {knn_test_acc * 100:.2f}%")
    
    selected_model = rf_model
    y_pred = rf_test_pred
    
    print("\n" + "=" * 60)
    print("  STAGE 9: Model Evaluation Metrics")
    print("=" * 60)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test, y_pred, average="weighted", zero_division=0
    )
    
    unique_labels = sorted(list(np.unique(y)))
    p_per, r_per, f_per, support = precision_recall_fscore_support(
        y_test, y_pred, labels=unique_labels, zero_division=0
    )
    
    per_class_list = []
    for i, lbl in enumerate(unique_labels):
        per_class_list.append({
            "class": lbl,
            "label": lbl,
            "precision": round(float(p_per[i]), 4),
            "recall": round(float(r_per[i]), 4),
            "f1": round(float(f_per[i]), 4),
            "support": int(support[i])
        })
        
    cm = confusion_matrix(y_test, y_pred, labels=unique_labels)
    
    eval_metrics = {
        "available": True,
        "dataset": {
            "name": "Indian Sign Language (Hannure et al.)",
            "source_directory": "backend/dataset/raw/isl_repo/",
            "total_samples": int(len(X)),
            "train": int(len(X_train)),
            "validation": int(len(X_val)),
            "test": int(len(X_test)),
            "skipped_images": int(skipped_count)
        },
        "classes": unique_labels,
        "metrics": {
            "accuracy": round(float(rf_test_acc), 4),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1": round(float(f1), 4)
        },
        "model_comparison": {
            "Random Forest": round(float(rf_test_acc), 4),
            "Support Vector Machine": round(float(svm_test_acc), 4),
            "K-Nearest Neighbors": round(float(knn_test_acc), 4)
        },
        "per_class": per_class_list,
        "confusion_matrix": {
            "labels": unique_labels,
            "matrix": cm.tolist()
        },
        "model": {
            "algorithm": "Random Forest Classifier",
            "feature_representation": "21 x 3 = 63 wrist-relative normalized MediaPipe landmarks",
            "n_estimators": 100,
            "max_depth": 16,
            "classes_count": len(unique_labels)
        }
    }
    
    # Save model and metrics
    model_save_path = MODELS_DIR / "isl_model.joblib"
    joblib.dump(selected_model, model_save_path)
    print(f"\nSaved trained model to: {model_save_path}")
    
    metrics_save_path = MODELS_DIR / "evaluation_metrics.json"
    with open(metrics_save_path, "w", encoding="utf-8") as f:
        json.dump(eval_metrics, f, indent=2)
    print(f"Saved evaluation metrics to: {metrics_save_path}")
    
    return eval_metrics

if __name__ == "__main__":
    run_extraction_and_training(samples_per_class=60)
