# EMOTIX — Backend API & Machine Learning Service

BSc Computer Science Final Year Project: **Multimodal Emotion Intelligence**
*Emotion Detection in Text & Images Using Natural Language Processing and Artificial Intelligence*

## Architecture Overview
The backend provides a RESTful Flask API supporting three modalities:
1. **Text Emotion Analysis (NLP)**: TF-IDF feature extraction with Multinomial Logistic Regression trained across 7 emotional states (`Happy`, `Sad`, `Angry`, `Fear`, `Surprise`, `Disgust`, `Neutral`).
2. **Image Emotion Recognition (Computer Vision)**: OpenCV Haar-Cascade face detection, facial region of interest (ROI) cropping, and Action Unit (AU) expression feature classification.
3. **Multimodal Emotion Fusion**: Late decision fusion using weighted linear probability combination with configurable modality weights (`TEXT_WEIGHT = 0.5`, `IMAGE_WEIGHT = 0.5`).

---

## Installation & Setup

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv

# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Train or Update the Text Emotion Model
A sample dataset is provided in `ml/data/sample_emotion_dataset.csv`. You can add more rows or replace with the ISEAR or GoEmotions dataset:
```bash
python ml/train_text_model.py
```
This evaluates the pipeline, outputs the classification report, and saves `ml/models/text_emotion_model.joblib`.

### 4. Running the Flask Backend Server
```bash
python app.py
```
The server will bind to `http://127.0.0.1:5000`.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and model status |
| `POST` | `/api/analyze/text` | Classifies raw text JSON `{"text": "..."}` |
| `POST` | `/api/analyze/image` | Multipart form with `image` file; returns detected faces and emotions |
| `POST` | `/api/analyze/multimodal` | Accepts text + image file; performs late probability fusion |
| `GET` | `/api/history` | Fetches SQLite historical analyses |
| `GET` | `/api/history/<id>` | Fetches single record by ID |
| `DELETE` | `/api/history/<id>` | Deletes an analysis record |
| `GET` | `/api/dashboard` | Computes statistical metrics across all analyses |

---

## Upgrading to Deep Learning (BERT & CNN)
- **Text (BERT/RoBERTa)**: Replace `ml/text_emotion.py` with HuggingFace `AutoModelForSequenceClassification.from_pretrained("bhadresh-psavani/bert-base-uncased-emotion")`.
- **Image (FER-2013 ResNet/VGG)**: Place the `.h5` or `.pth` weights into `ml/models/fer2013_cnn.h5` and load in `ml/image_emotion.py`.
