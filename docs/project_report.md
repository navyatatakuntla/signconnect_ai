# SignConnect AI: Final-Year B.Tech Major Project Report

**Project Title**: AI-Based Indian Sign Language Recognition and Communication Assistance System  
**Academic Domain**: Computer Vision, Machine Learning, Assistive Technology, Human-Computer Interaction  

---

## 1. Abstract
Communication between speech-and-hearing-impaired individuals and people unfamiliar with sign language presents significant accessibility hurdles in daily education, healthcare, and public services. SignConnect AI develops an end-to-end web-based assistive platform utilizing computer vision and machine learning. Using standard consumer webcams, hand landmarks are detected via Google MediaPipe HandLandmarker, transformed into a 63-dimensional coordinate space invariant to wrist position and hand size, and classified using an ensemble Random Forest model trained across all 26 alphabets (A–Z) of the Indian Sign Language (ISL). An interactive frontend features a Sentence Builder and Text-to-Speech synthesizer via the browser SpeechSynthesis API, integrated with SQLite database session management.

---

## 2. Problem Statement & Objectives
### Problem Statement
Indian Sign Language (ISL) is the primary mode of visual communication for millions across India, yet automated real-time digital translation systems remain scarce, fragmented, or dependent on expensive wearable hardware like sensor gloves.

### Objectives
1. Build a web application using standard browser cameras requiring zero sensor hardware.
2. Extract 21 3D hand landmarks in real time with MediaPipe.
3. Train and compare supervised machine learning models (Random Forest, SVM, KNN) on authentic ISL benchmark data.
4. Implement sentence building, temporal multi-frame smoothing, and speech synthesis.
5. Provide secure SQLite user authentication, dashboard analytics, and history tracking.

---

## 3. Existing Systems vs. Proposed System

| Feature | Existing Systems | Proposed SignConnect AI |
|---|---|---|
| Hardware | Sensor data gloves or depth cameras | Standard RGB webcams |
| Processing | Heavy end-to-end CNNs with high latency | MediaPipe landmark extraction (63 features) + Fast RF inference |
| Invariance | Vulnerable to background/skin lighting | Wrist-centered relative coordinate normalization |
| Integration | Isolated scripts or desktop GUI | Complete web app (Dashboard, Sentence Builder, TTS, History) |

---

## 4. System Architecture & Diagrams

### Data Flow Diagram (DFD Level 1)
```
User (Webcam) ──> Video Frame ──> MediaPipe Landmarker ──> (21 x 3) Coords
                                                                 │
                                                                 ▼
Prediction Text <── History & DB <── Random Forest Model <── Normalized Vector
      │
      ▼
Browser TTS (Audio)
```

### Entity Relationship (ER) Diagram
- **`users`**: `(id PK, full_name, email UNIQUE, password_hash, created_at)`
- **`recognition_history`**: `(id PK, user_id FK -> users.id, recognized_text, duration, status, created_at)`
- **`feedback`**: `(id PK, name, email, message, created_at)`

---

## 5. Machine Learning Methodology

### Feature Representation
Given 21 landmarks $P_i = (x_i, y_i, z_i)$ where $P_0$ is the wrist:
$$\Delta P_i = P_i - P_0, \quad \forall i \in \{0, \dots, 20\}$$
$$s = \max_{i} \|\Delta P_i\|_2, \quad \hat{P}_i = \frac{\Delta P_i}{s}$$
Feature vector $X \in \mathbb{R}^{63}$.

### Model Comparison & Results
- **Random Forest (Baseline)**: Accuracy = 59.32%, Precision = 54.41%, F1-Score = 54.25%
- **Support Vector Machine (RBF)**: Accuracy = 55.93%
- **K-Nearest Neighbors**: Accuracy = 59.32%

---

## 6. Project Limitations & Ethical Disclosures
1. **Alphabet Recognition vs. Real ISL**: This system recognizes static 26 ISL alphabet gestures (A–Z). Real-world ISL involves dynamic continuous movements, two-handed gestures, facial expressions, and spatial grammar.
2. **Lighting and Angles**: Occluded fingers or extreme oblique angles can cause landmark degradation.
3. **Privacy**: Frames are processed purely in-memory; no video is retained.

---

## 7. Viva Preparation (Top Questions & Answers)
1. **Q: Why use MediaPipe instead of raw CNN on pixels?**  
   *A:* MediaPipe abstracts raw pixels into 63 skeletal coordinate features. This dramatically reduces model size, inference latency, and makes the model robust against diverse skin tones and complex backgrounds.
2. **Q: How is scale invariance achieved?**  
   *A:* By dividing relative coordinates by the maximum Euclidean distance across all landmarks from the wrist.
3. **Q: How does the sentence builder prevent repeating the same letter?**  
   *A:* Using temporal stability thresholds and auto-add debouncing so a held sign is only added once until shifted.
