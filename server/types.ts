export type EmotionType = 'Happy' | 'Sad' | 'Angry' | 'Fear' | 'Surprise' | 'Disgust' | 'Neutral';

export interface EmotionProbabilities {
  [key: string]: number;
  Happy: number;
  Sad: number;
  Angry: number;
  Fear: number;
  Surprise: number;
  Disgust: number;
  Neutral: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatar_url?: string;
  created_at: string;
}

export interface DetectedFace {
  face_id: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  emotion: EmotionType;
  confidence: number;
  probabilities: EmotionProbabilities;
}

export interface TextStatistics {
  char_count: number;
  word_count: number;
  sentence_count: number;
  reading_time_seconds: number;
  salient_tokens: string[];
}

export interface TextAnalysisResponse {
  success: boolean;
  input_type: 'text';
  text: string;
  emotion: EmotionType;
  confidence: number;
  probabilities: EmotionProbabilities;
  text_statistics: TextStatistics;
  created_at: string;
  id?: number;
  user_id?: number | null;
}

export interface ImageAnalysisResponse {
  success: boolean;
  input_type: 'image';
  image_filename: string;
  face_count: number;
  emotion: EmotionType;
  confidence: number;
  probabilities: EmotionProbabilities;
  faces: DetectedFace[];
  created_at: string;
  id?: number;
  user_id?: number | null;
}

export interface VoiceAnalysisResponse {
  success: boolean;
  input_type: 'voice';
  transcript: string;
  voice_filename?: string;
  duration_seconds?: number;
  emotion: EmotionType;
  confidence: number;
  probabilities: EmotionProbabilities;
  text_statistics: TextStatistics;
  created_at: string;
  id?: number;
  user_id?: number | null;
}

export interface MultimodalAnalysisResponse {
  success: boolean;
  input_type: 'multimodal';
  text_input?: string;
  image_filename?: string;
  voice_filename?: string;
  transcript?: string;
  modalities_used: ('text' | 'image' | 'voice')[];
  text_result?: {
    emotion: EmotionType;
    confidence: number;
    probabilities: EmotionProbabilities;
  };
  image_result?: {
    emotion: EmotionType;
    confidence: number;
    probabilities: EmotionProbabilities;
    face_count: number;
    faces: DetectedFace[];
  };
  voice_result?: {
    emotion: EmotionType;
    confidence: number;
    probabilities: EmotionProbabilities;
    transcript: string;
  };
  fusion: {
    weights: {
      text: number;
      image: number;
      voice: number;
    };
    algorithm: string;
    concordance: 'consistent' | 'differ';
    explanation: string;
  };
  emotion: EmotionType;
  confidence: number;
  probabilities: EmotionProbabilities;
  created_at: string;
  id?: number;
  user_id?: number | null;
}

export interface AnalysisRecord {
  id: number;
  user_id: number | null;
  input_type: 'text' | 'image' | 'voice' | 'multimodal';
  text_input: string | null;
  image_filename: string | null;
  voice_filename: string | null;
  transcript: string | null;
  emotion: EmotionType;
  confidence: number;
  probabilities: EmotionProbabilities;
  face_count: number;
  faces_data: string | null;
  notes: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface ActivityTrend {
  date: string;
  count: number;
}

export interface DashboardStats {
  total_analyses: number;
  text_analyses: number;
  image_analyses: number;
  voice_analyses: number;
  multimodal_analyses: number;
  most_detected_emotion: EmotionType | 'N/A';
  average_confidence: number;
  total_faces_analyzed: number;
  emotion_distribution: Record<EmotionType, number>;
  modality_distribution: {
    text: number;
    image: number;
    voice: number;
    multimodal: number;
  };
  confidence_distribution: {
    high: number;    // > 85%
    medium: number;  // 60-85%
    low: number;     // < 60%
  };
  activity_trends: ActivityTrend[];
  recent_analyses: AnalysisRecord[];
}

export interface AdminStats extends DashboardStats {
  total_users: number;
  user_roles: {
    admin: number;
    user: number;
  };
  users_list: User[];
}
