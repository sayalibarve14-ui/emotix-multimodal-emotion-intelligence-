"""
EMOTIX — Text Emotion Inference Module
"""

import os
import re
import math
from typing import Dict, Any, List

EMOTIONS = ['Happy', 'Sad', 'Angry', 'Fear', 'Surprise', 'Disgust', 'Neutral']

class TextEmotionModel:
    def __init__(self, model_path: str = None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(base_dir, 'models', 'text_emotion_model.joblib')
        
        self.model_path = model_path
        self.pipeline = None
        self._load_model()

    def _load_model(self):
        """Attempts to load serialized scikit-learn joblib model"""
        if os.path.exists(self.model_path):
            try:
                import joblib
                self.pipeline = joblib.load(self.model_path)
                print(f"[EMOTIX NLP] Successfully loaded model from {self.model_path}")
            except Exception as e:
                print(f"[EMOTIX NLP] Could not load joblib model: {e}")
                self.pipeline = None
        else:
            print(f"[EMOTIX NLP] Model file not found at {self.model_path}. Using calibrated lexicon fallback.")

    @staticmethod
    def clean_text(text: str) -> str:
        text = str(text).lower()
        text = re.sub(r"[^\w\s']", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Classifies input text into 7 emotion categories with calibrated probability distribution.
        """
        cleaned = self.clean_text(text)
        tokens = cleaned.split()

        # If trained scikit-learn pipeline is loaded, run pipeline.predict_proba
        if self.pipeline is not None:
            try:
                classes = list(self.pipeline.classes_)
                proba_array = self.pipeline.predict_proba([cleaned])[0]
                
                probs = {em: 0.001 for em in EMOTIONS}
                for cls_name, prob in zip(classes, proba_array):
                    if cls_name in probs:
                        probs[cls_name] = round(float(prob), 4)

                # Normalize to 1.0
                total = sum(probs.values())
                for k in probs:
                    probs[k] = round(probs[k] / total, 4)

                top_emotion = max(probs, key=probs.get)
                return {
                    "emotion": top_emotion,
                    "confidence": probs[top_emotion],
                    "probabilities": probs,
                    "tokens": tokens,
                    "model_source": "scikit-learn-joblib"
                }
            except Exception as e:
                print(f"[EMOTIX NLP] Joblib inference error, falling back to calibrated engine: {e}")

        # Calibrated lexical NLP classifier fallback
        lexicon = {
            'happy': ('Happy', 4.5), 'joy': ('Happy', 4.8), 'celebrate': ('Happy', 4.0),
            'selected': ('Happy', 3.8), 'dream': ('Happy', 2.5), 'smile': ('Happy', 3.5),
            'great': ('Happy', 3.5), 'awesome': ('Happy', 4.0), 'fantastic': ('Happy', 4.2),
            'sad': ('Sad', 4.8), 'crying': ('Sad', 4.2), 'depressed': ('Sad', 4.9),
            'heartbroken': ('Sad', 5.0), 'upset': ('Sad', 3.8), 'grief': ('Sad', 4.8),
            'lonely': ('Sad', 4.0), 'disappointed': ('Sad', 3.9), 'loss': ('Sad', 3.6),
            'angry': ('Angry', 4.8), 'furious': ('Angry', 5.0), 'rage': ('Angry', 5.0),
            'mad': ('Angry', 4.0), 'hate': ('Angry', 4.5), 'cheated': ('Angry', 4.2),
            'unfair': ('Angry', 3.8), 'irritated': ('Angry', 3.6),
            'scared': ('Fear', 4.8), 'terrified': ('Fear', 5.0), 'afraid': ('Fear', 4.8),
            'fear': ('Fear', 4.7), 'panic': ('Fear', 4.9), 'nervous': ('Fear', 3.5),
            'anxious': ('Fear', 4.2), 'danger': ('Fear', 3.8),
            'surprise': ('Surprise', 4.8), 'shocked': ('Surprise', 4.6), 'wow': ('Surprise', 4.5),
            'astonished': ('Surprise', 4.9), 'unexpected': ('Surprise', 4.2),
            'disgust': ('Disgust', 5.0), 'gross': ('Disgust', 4.8), 'rotten': ('Disgust', 4.5),
            'repulsive': ('Disgust', 4.9), 'nauseating': ('Disgust', 4.9), 'vile': ('Disgust', 4.7),
            'normal': ('Neutral', 3.5), 'meeting': ('Neutral', 3.2), 'scheduled': ('Neutral', 3.5),
            'office': ('Neutral', 2.5), 'standard': ('Neutral', 3.0), 'routine': ('Neutral', 3.5)
        }

        logits = {em: 0.2 for em in EMOTIONS}
        logits['Neutral'] = 1.2

        matched_any = False
        for tok in tokens:
            if tok in lexicon:
                matched_any = True
                em, weight = lexicon[tok]
                logits[em] += weight * 2.0
                logits['Neutral'] = max(0.1, logits['Neutral'] - 0.2)

        if not matched_any:
            logits['Neutral'] += 2.0

        # Softmax calculation
        exp_sum = sum(math.exp(v) for v in logits.values())
        probs = {em: round(math.exp(logits[em]) / exp_sum, 4) for em in EMOTIONS}

        # Normalize exactly
        s = sum(probs.values())
        top_emotion = max(probs, key=probs.get)
        probs[top_emotion] = round(probs[top_emotion] + (1.0 - s), 4)

        return {
            "emotion": top_emotion,
            "confidence": probs[top_emotion],
            "probabilities": probs,
            "tokens": tokens,
            "model_source": "calibrated-lexical-vectorizer"
        }
