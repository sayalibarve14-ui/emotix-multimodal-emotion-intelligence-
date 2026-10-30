"""
EMOTIX — Text Emotion Model Training Pipeline
BSc Computer Science Final Year Project

This script trains a TF-IDF + Logistic Regression multiclass emotion
classifier across 7 emotion categories:
  - Happy, Sad, Angry, Fear, Surprise, Disgust, Neutral
"""

import os
import re
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

EMOTIONS = ['Happy', 'Sad', 'Angry', 'Fear', 'Surprise', 'Disgust', 'Neutral']

def clean_text(text: str) -> str:
    """Lowercase and clean punctuation from input text"""
    text = str(text).lower()
    text = re.sub(r"[^\w\s']", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def train_model(csv_path: str, output_model_path: str):
    print("=" * 60)
    print("EMOTIX: Training Multiclass Text Emotion Classifier")
    print("=" * 60)

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Training dataset not found at {csv_path}")

    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} sample records from {csv_path}")
    print("Class Distribution:")
    print(df['emotion'].value_counts())

    df['cleaned_text'] = df['text'].apply(clean_text)

    X = df['cleaned_text']
    y = df['emotion']

    # Build Pipeline: TF-IDF Vectorizer + Multinomial Logistic Regression
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            token_pattern=r"(?u)\b\w+\b"
        )),
        ('clf', LogisticRegression(
            C=1.5,
            max_iter=1000,
            multi_class='multinomial',
            solver='lbfgs',
            class_weight='balanced'
        ))
    ])

    print("\nFitting TF-IDF Vectorizer and Logistic Regression...")
    pipeline.fit(X, y)

    # Evaluate on training data
    y_pred = pipeline.predict(X)
    acc = accuracy_score(y, y_pred)
    print(f"\nTraining Accuracy: {acc * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y, y_pred, zero_division=0))

    # Save trained model artifact
    os.makedirs(os.path.dirname(output_model_path), exist_ok=True)
    joblib.dump(pipeline, output_model_path)
    print(f"Model successfully serialized and saved to: {output_model_path}")
    print("=" * 60)

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_file = os.path.join(base_dir, 'data', 'sample_emotion_dataset.csv')
    model_file = os.path.join(base_dir, 'models', 'text_emotion_model.joblib')
    train_model(dataset_file, model_file)
