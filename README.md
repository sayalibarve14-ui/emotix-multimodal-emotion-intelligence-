# EMOTIX — Multimodal Emotion Intelligence

> **Project Title**: Emotion Detection in Text & Images Using Natural Language Processing and Artificial Intelligence  
> **Course / Degree**: BSc Computer Science Final Year Project  
> **Main Tagline**: *"Understand emotions. Connect the signals."*

---

## 1. Project Overview
EMOTIX is a full-stack multimodal emotion intelligence system engineered to analyze human affective states from:
1. **Natural Language Text**: Linguistic syntactic tokens analyzed via TF-IDF vectorization and multiclass emotion classification.
2. **Facial Expression Images**: Computer Vision facial landmark localization, ROI cropping, and expression recognition across 7 core emotion categories.
3. **Multimodal Late Fusion**: Algorithmic decision-level linear combination integrating text probabilities and facial expression probabilities into a unified affective assessment.

### Core 7 Emotion Categories:
- 😊 **Happy**
- 😢 **Sad**
- 😠 **Angry**
- 😨 **Fear**
- 😲 **Surprise**
- 🤢 **Disgust**
- 😐 **Neutral**

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **PDF Reporting**: jsPDF
- **Routing & State**: Interactive single-page application with responsive layouts, dark/light themes, and real-time visualization

### Backend & API
- **Full-Stack Node/Express Engine**: Running concurrently with Vite on port 3000 (`tsx server.ts`)
- **Python / Flask Service**: Complete alternate backend in `/backend` using Flask + Flask-CORS (`http://127.0.0.1:5000`)
- **Database**: SQLite 3 (`database/emotix.sqlite`) with automatic schema bootstrapping and JSON serialization
- **Machine Learning & NLP**:
  - Tokenization, stop word filtering, and negation logic
  - TF-IDF vectorizer + Softmax multiclass classification
  - OpenCV Haar Cascade face detection pipeline
  - Late Decision Fusion with user-configurable modality weights ($W_{text} + W_{image} = 1.0$)

---

## 3. Directory Structure

```
EMOTIX/
├── backend/                       # Python Flask alternate backend
│   ├── app.py                     # Flask REST API endpoints
│   ├── requirements.txt           # Python dependencies
│   ├── database/
│   │   └── database.py            # SQLite helper matching schema
│   ├── ml/
│   │   ├── text_emotion.py        # TF-IDF + Classifier inference
│   │   ├── image_emotion.py       # OpenCV face detection & expression
│   │   ├── multimodal.py          # Multimodal linear fusion algorithm
│   │   ├── train_text_model.py    # Training script on CSV dataset
│   │   └── data/
│   │       └── sample_emotion_dataset.csv
│   └── README.md
│
├── database/
│   └── emotix.sqlite              # Persistent SQLite database file
│
├── server/                        # Full-stack Node/Express ML & DB engine
│   ├── database/database.ts       # WebAssembly SQLite manager
│   ├── ml/
│   │   ├── textEmotion.ts         # Text NLP classifier & lexicons
│   │   ├── imageEmotion.ts        # Face detection & emotion engine
│   │   └── multimodal.ts          # Decision fusion logic
│   └── types.ts                   # Shared TypeScript models
│
├── src/                           # React Frontend
│   ├── assets/images/             # High-fidelity sample test assets
│   ├── components/                # Reusable UI components
│   │   ├── Navbar.tsx             # Strict 3-zone top bar
│   │   ├── Footer.tsx             # Academic notice & links
│   │   ├── EmotionBadge.tsx       # Standard emotion indicator
│   │   ├── ProbabilityBar.tsx     # 7-class probability chart
│   │   └── VivaModal.tsx          # College viva defense guide
│   ├── pages/                     # Complete application pages
│   │   ├── HomePage.tsx           # Modern project landing page
│   │   ├── TextAnalysisPage.tsx   # Text analysis interface
│   │   ├── ImageAnalysisPage.tsx  # Image upload & face analysis
│   │   ├── MultimodalPage.tsx     # Combined text+face fusion
│   │   ├── DashboardPage.tsx      # Real-time SQLite analytics
│   │   ├── HistoryPage.tsx        # Searchable record history
│   │   └── DocsPage.tsx           # Technical report & viva notes
│   ├── services/api.ts            # Client API abstraction
│   ├── utils/pdfGenerator.ts      # PDF export report generator
│   ├── App.tsx                    # Main navigation shell
│   ├── main.tsx                   # Client entry point
│   └── index.css                  # Global styles & Tailwind
│
├── uploads/                       # Secure user image upload store
├── server.ts                      # Express + Vite server entry point
├── package.json
└── README.md
```

---

## 4. Running the Application

### Option A: Standard Full-Stack Application (Recommended for AI Studio Preview)
The application is pre-configured with a full-stack Express server that serves both the API routes (`/api/*`) and the React client on port 3000:

```bash
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

### Option B: Running the Python Flask Backend
If you want to run the Python backend separately for viva demonstration:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or on Windows: venv\Scripts\activate
pip install -r requirements.txt
python ml/train_text_model.py  # Train text model
python app.py                  # Runs on http://127.0.0.1:5000
```

---

## 5. College Viva Defense Key Points

1. **Why Late Decision Fusion instead of Early Feature Fusion?**
   - Early fusion concatenates raw text embeddings and image feature maps into one dense vector. This requires synchronized pairs during training and fails if one modality is missing.
   - Late decision fusion computes probability vectors $P_{text}(e)$ and $P_{image}(e)$ independently and combines them:
     $$P_{fused}(e) = \frac{W_t \cdot P_{text}(e) + W_i \cdot P_{image}(e)}{W_t + W_i}$$
   - This allows asynchronous processing, modular model swapping (e.g. upgrading to BERT or Vision Transformers), and graceful single-modality fallbacks.

2. **How does Face Detection work?**
   - Uses OpenCV's Viola-Jones Haar-Cascade algorithm running multi-scale sliding windows across grayscale luminance integrals, followed by non-maximum suppression (NMS) to isolate bounding boxes.

3. **Privacy & Ethical Safeguards**:
   - EMOTIX never identifies people, generates biometrics, or infers personal identity.
   - Predictions are strictly educational estimates of visible facial expressions and linguistic semantics.
