"""
EMOTIX — SQLite Database Interface (Python)
Matches the exact schema used across the full-stack system.
"""

import sqlite3
import json
import os
from typing import Dict, Any, List, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'database', 'emotix.sqlite')

def get_connection():
    db_path = os.path.abspath(DB_FILE)
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
      CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        input_type TEXT NOT NULL,
        text_input TEXT,
        image_filename TEXT,
        emotion TEXT NOT NULL,
        confidence REAL NOT NULL,
        probabilities TEXT NOT NULL,
        face_count INTEGER DEFAULT 0,
        faces_data TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
      );
    """)
    conn.commit()
    conn.close()

def insert_analysis(input_type: str, emotion: str, confidence: float,
                    probabilities: Dict[str, float], text_input: str = None,
                    image_filename: str = None, face_count: int = 0,
                    faces_data: Any = None, notes: str = None, created_at: str = None) -> int:
    import datetime
    if not created_at:
        created_at = datetime.datetime.utcnow().isoformat() + "Z"

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
      INSERT INTO analyses (input_type, text_input, image_filename, emotion, confidence, probabilities, face_count, faces_data, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        input_type,
        text_input,
        image_filename,
        emotion,
        confidence,
        json.dumps(probabilities),
        face_count,
        json.dumps(faces_data) if faces_data else None,
        notes,
        created_at
    ))
    conn.commit()
    inserted_id = cursor.lastrowid
    conn.close()
    return inserted_id

def get_history(limit: int = 100) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        try:
            d['probabilities'] = json.loads(d['probabilities'])
        except Exception:
            d['probabilities'] = {}
        if d.get('faces_data'):
            try:
                d['faces_data'] = json.loads(d['faces_data'])
            except Exception:
                pass
        results.append(d)
    return results

def get_by_id(analysis_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    try:
        d['probabilities'] = json.loads(d['probabilities'])
    except Exception:
        d['probabilities'] = {}
    return d

def delete_by_id(analysis_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0
