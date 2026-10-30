"""
EMOTIX — Multimodal Emotion Decision Fusion
Combines text NLP probabilities and computer vision facial expression probabilities.
"""

from typing import Dict, Any

# Configurable global weights
TEXT_WEIGHT = 0.5
IMAGE_WEIGHT = 0.5

EMOTIONS = ['Happy', 'Sad', 'Angry', 'Fear', 'Surprise', 'Disgust', 'Neutral']

def fuse_multimodal(text_res: Dict[str, Any], image_res: Dict[str, Any],
                    text_weight: float = TEXT_WEIGHT, image_weight: float = IMAGE_WEIGHT) -> Dict[str, Any]:
    """
    Performs late decision-level multimodal fusion using weighted linear probability combination.
    """
    total_w = text_weight + image_weight
    w_t = text_weight / total_w if total_w > 0 else 0.5
    w_i = image_weight / total_w if total_w > 0 else 0.5

    text_probs = text_res.get('probabilities', {})
    image_probs = image_res.get('probabilities', {})

    fused_probs = {}
    for em in EMOTIONS:
        pt = text_probs.get(em, 0.0)
        pi = image_probs.get(em, 0.0)
        fused_probs[em] = round(w_t * pt + w_i * pi, 4)

    # Normalize to 1.0
    total = sum(fused_probs.values())
    top_emotion = max(fused_probs, key=fused_probs.get)
    if total > 0:
        fused_probs[top_emotion] = round(fused_probs[top_emotion] + (1.0 - total), 4)

    text_em = text_res.get('emotion', 'Neutral')
    image_em = image_res.get('emotion', 'Neutral')
    consistent = (text_em == image_em)

    explanation = (
        f"Text NLP classified '{text_em}' ({(text_res.get('confidence', 0)*100):.1f}%) and "
        f"Facial Vision classified '{image_em}' ({(image_res.get('confidence', 0)*100):.1f}%). "
        f"Applying late fusion weights (Text {w_t*100:.0f}%, Vision {w_i*100:.0f}%) yields final "
        f"multimodal prediction '{top_emotion}' at {(fused_probs[top_emotion]*100):.1f}% confidence."
    )

    return {
        "text_result": text_res,
        "image_result": image_res,
        "fusion": {
            "text_weight": w_t,
            "image_weight": w_i,
            "algorithm": "Late Linear Probability Fusion",
            "concordance": "consistent" if consistent else "differ",
            "explanation": explanation
        },
        "emotion": top_emotion,
        "confidence": fused_probs[top_emotion],
        "probabilities": fused_probs
    }
