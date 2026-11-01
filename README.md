# SignConnect AI — AI-Based Indian Sign Language Recognition and Communication Assistance System

Final-Year B.Tech Major Project in Computer Science and Engineering.

---

## Overview

SignConnect AI is a web-based assistive system that translates supported Indian Sign Language (ISL) hand signs (A–Z) into text and synthesized speech in real time. It uses Google MediaPipe for skeletal hand landmark estimation (63 3D features) and a trained Random Forest classifier.

### Key Features
- **Live Sign Recognition**: Real-time webcam frame processing with MediaPipe HandLandmarker.
- **Sentence Builder**: Accumulate letters into words, space, backspace, clear, and manual editing.
- **Text-to-Speech (TTS)**: Instant audio speech generation via browser SpeechSynthesis.
- **Personalized Dashboard & History**: Real SQLite session metrics, signs count, and timestamped history.
- **Model Evaluation**: Displays actual test accuracy, precision, recall, F1, per-class metrics, and confusion matrix.
- **User Authentication**: PBKDF2 password hashing, secure sessions, and CSRF protection.

---

## Project Structure

```
SignConnect-AI/
├── frontend/             # HTML5, CSS3, Vanilla JS UI (All client code)
│   ├── index.html        # Landing page
│   ├── login.html        # User login
│   ├── register.html     # Registration
│   ├── dashboard.html    # User statistics & recent history
│   ├── recognize.html    # Live webcam recognition & sentence builder
│   ├── history.html      # Saved user history
│   ├── evaluation.html   # Empirical ML evaluation dashboard
│   ├── about.html        # Project details, limitations & feedback
│   └── assets/           # CSS, JS, logos and icons
│
├── backend/              # Flask application, ML pipeline & database
│   ├── app.py            # Main application server
│   ├── config.py         # Configuration parameters
│   ├── requirements.txt  # Dependencies list
│   ├── database/         # SQLite schema and DB access
│   ├── routes/           # Blueprints for auth, prediction, history, etc.
│   ├── services/         # Business logic layer
│   ├── ml/               # MediaPipe feature extraction & training scripts
│   ├── models/           # Trained Random Forest & evaluation output
│   └── tests/            # Automated test suite
│
├── docs/                 # Academic documentation & diagrams
│   ├── architecture.md   # Architectural breakdown
│   ├── api_documentation.md # API endpoints specification
│   └── project_report.md # Comprehensive final-year project report
│
└── README.md
```

---

## Quickstart Instructions

### 1. Install Dependencies
```bash
py -3.13 -m pip install -r backend/requirements.txt
```

### 2. Run Automated Tests
```bash
py -3.13 -m unittest discover -s backend/tests
```

### 3. Start the Server
```bash
py -3.13 backend/app.py
```
Open **`http://127.0.0.1:5000`** in Google Chrome or Microsoft Edge.
All frontend pages are served directly by the backend!
