"""
EMOTIX — Flask Backend Application
Multimodal Emotion Intelligence API Service
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

from database.database import init_db, insert_analysis, get_history, get_by_id, delete_by_id
from ml.text_emotion import TextEmotionModel
from ml.image_emotion import ImageEmotionModel
from ml.multimodal import fuse_multimodal

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

# Initialize ML Models
text_model = TextEmotionModel()
image_model = ImageEmotionModel()

# Initialize Database
init_db()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "service": "EMOTIX Flask Backend",
        "version": "1.0.0",
        "framework": "Flask + scikit-learn + OpenCV"
    })

@app.route('/api/analyze/text', methods=['POST'])
def analyze_text():
    try:
        data = request.get_json(force=True, silent=True) or {}
        text = data.get('text', '').strip()
        if not text:
            return jsonify({"success": False, "error": "Text is required"}), 400

        result = text_model.predict(text)
        new_id = insert_analysis(
            input_type='text',
            text_input=text,
            emotion=result['emotion'],
            confidence=result['confidence'],
            probabilities=result['probabilities']
        )

        return jsonify({
            "success": True,
            "id": new_id,
            "input_type": "text",
            "text": text,
            "emotion": result['emotion'],
            "confidence": result['confidence'],
            "probabilities": result['probabilities']
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/analyze/image', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.files:
            return jsonify({"success": False, "error": "No image part in request"}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({"success": False, "error": "No selected image file"}), 400

        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)

        result = image_model.detect_and_analyze(save_path)

        new_id = insert_analysis(
            input_type='image',
            image_filename=filename,
            emotion=result['emotion'],
            confidence=result['confidence'],
            probabilities=result['probabilities'],
            face_count=result['face_count'],
            faces_data=result['faces']
        )

        return jsonify({
            "success": True,
            "id": new_id,
            "input_type": "image",
            "image_filename": filename,
            "face_count": result['face_count'],
            "emotion": result['emotion'],
            "confidence": result['confidence'],
            "probabilities": result['probabilities'],
            "faces": result['faces']
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/analyze/multimodal', methods=['POST'])
def analyze_multimodal():
    try:
        text = request.form.get('text', '').strip()
        text_weight = float(request.form.get('text_weight', 0.5))
        image_weight = float(request.form.get('image_weight', 0.5))

        image_file = request.files.get('image')
        filename = None

        if not text and not image_file:
            return jsonify({"success": False, "error": "Provide text, image, or both."}), 400

        text_result = text_model.predict(text) if text else {
            "emotion": "Neutral", "confidence": 0.0, "probabilities": {}
        }

        if image_file and image_file.filename:
            filename = secure_filename(image_file.filename)
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(save_path)
            image_result = image_model.detect_and_analyze(save_path)
        else:
            image_result = {
                "face_count": 0, "emotion": "Neutral", "confidence": 0.0,
                "probabilities": {}, "faces": []
            }

        fused = fuse_multimodal(text_result, image_result, text_weight, image_weight)

        new_id = insert_analysis(
            input_type='multimodal',
            text_input=text or None,
            image_filename=filename,
            emotion=fused['emotion'],
            confidence=fused['confidence'],
            probabilities=fused['probabilities'],
            face_count=image_result.get('face_count', 0),
            faces_data=image_result.get('faces')
        )

        fused['success'] = True
        fused['id'] = new_id
        fused['input_type'] = 'multimodal'
        return jsonify(fused)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/history', methods=['GET'])
def history():
    analyses = get_history(100)
    return jsonify({"success": True, "total": len(analyses), "history": analyses})

@app.route('/api/history/<int:analysis_id>', methods=['GET', 'DELETE'])
def history_item(analysis_id):
    if request.method == 'GET':
        rec = get_by_id(analysis_id)
        if not rec:
            return jsonify({"success": False, "error": "Not found"}), 404
        return jsonify({"success": True, "record": rec})
    elif request.method == 'DELETE':
        deleted = delete_by_id(analysis_id)
        return jsonify({"success": deleted})

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    analyses = get_history(500)
    emotions = ['Happy', 'Sad', 'Angry', 'Fear', 'Surprise', 'Disgust', 'Neutral']
    dist = {e: 0 for e in emotions}
    modalities = {'text': 0, 'image': 0, 'multimodal': 0}
    conf_dist = {'high': 0, 'medium': 0, 'low': 0}
    total_conf = 0.0
    total_faces = 0

    for a in analyses:
        em = a.get('emotion')
        if em in dist:
            dist[em] += 1
        it = a.get('input_type')
        if it in modalities:
            modalities[it] += 1
        c = a.get('confidence', 0)
        total_conf += c
        total_faces += a.get('face_count', 0) or 0
        if c >= 0.85:
            conf_dist['high'] += 1
        elif c >= 0.60:
            conf_dist['medium'] += 1
        else:
            conf_dist['low'] += 1

    most_detected = max(dist, key=dist.get) if analyses else 'N/A'
    avg_conf = round(total_conf / len(analyses), 4) if analyses else 0.0

    return jsonify({
        "success": True,
        "stats": {
            "total_analyses": len(analyses),
            "text_analyses": modalities['text'],
            "image_analyses": modalities['image'],
            "multimodal_analyses": modalities['multimodal'],
            "most_detected_emotion": most_detected,
            "average_confidence": avg_conf,
            "total_faces_analyzed": total_faces,
            "emotion_distribution": dist,
            "modality_distribution": modalities,
            "confidence_distribution": conf_dist,
            "recent_analyses": analyses[:10]
        }
    })

if __name__ == '__main__':
    print("[EMOTIX] Starting Flask API Server on http://127.0.0.1:5000 ...")
    app.run(host='0.0.0.0', port=5000, debug=False)
