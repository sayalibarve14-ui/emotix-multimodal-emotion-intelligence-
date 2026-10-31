
import {
  TextAnalysisResult,
  ImageAnalysisResult,
  VoiceAnalysisResult,
  MultimodalResult,
  AnalysisRecord,
  DashboardStats,
  AdminStats,
  User
} from '../types/index.js';

// ==========================================
// API CONFIGURATION
// ==========================================

// Set VITE_API_BASE_URL to your deployed backend URL.
// Example: https://emotix-backend.onrender.com
// Local development automatically uses /api.

const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();

const API_BASE = configuredBase
  ? `${configuredBase.replace(/\/+$/, '').replace(/\/api$/i, '')}/api`
  : '/api';

// ==========================================
// AUTHENTICATION HEADERS
// ==========================================

const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('emotix_auth_token')
      : null;

  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==========================================
// COMMON API RESPONSE HANDLER
// ==========================================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error(
      'Cannot connect to EMOTIX backend. Please check your internet connection or backend server.'
    );
  }

  const responseText = await response.text();

  let data: any;

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      `Backend returned an invalid response (${response.status}). Check the API URL and backend deployment.`
    );
  }

  if (!response.ok || data.success === false) {
    throw new Error(
      data.error || `API request failed with status ${response.status}.`
    );
  }

  return data as T;
}

// ==========================================
// EMOTIX API SERVICE
// ==========================================

export class ApiService {

  // 1. TEXT EMOTION ANALYSIS

  public static async analyzeText(
    text: string
  ): Promise<TextAnalysisResult> {
    return apiRequest<TextAnalysisResult>('/analyze/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
  }

  // 2. IMAGE EMOTION ANALYSIS

  public static async analyzeImage(
    file?: File,
    sampleName?: string,
    webcamDataUrl?: string
  ): Promise<ImageAnalysisResult> {
    const formData = new FormData();

    if (file) {
      formData.append('image', file);
    } else if (webcamDataUrl) {
      formData.append('webcam_image', webcamDataUrl);
    } else if (sampleName) {
      formData.append('sample_image', sampleName);
    } else {
      throw new Error(
        'Please select an image file or capture via webcam.'
      );
    }

    return apiRequest<ImageAnalysisResult>('/analyze/image', {
      method: 'POST',
      body: formData
    });
  }

  // 3. VOICE EMOTION ANALYSIS

  public static async analyzeVoice(
    transcript: string,
    audioFile?: File
  ): Promise<VoiceAnalysisResult> {
    const formData = new FormData();

    formData.append('transcript', transcript);

    if (audioFile) {
      formData.append('audio', audioFile);
    }

    return apiRequest<VoiceAnalysisResult>('/analyze/voice', {
      method: 'POST',
      body: formData
    });
  }

  // 4. MULTIMODAL EMOTION ANALYSIS

  public static async analyzeMultimodal(params: {
    text?: string;
    file?: File;
    sampleName?: string;
    voiceTranscript?: string;
    voiceFile?: File;
    textWeight?: number;
    imageWeight?: number;
    voiceWeight?: number;
  }): Promise<MultimodalResult> {
    const formData = new FormData();

    if (params.text) {
      formData.append('text', params.text);
    }

    if (params.voiceTranscript) {
      formData.append('voice_transcript', params.voiceTranscript);
    }

    if (params.file) {
      formData.append('image', params.file);
    } else if (params.sampleName) {
      formData.append('sample_image', params.sampleName);
    }

    if (params.voiceFile) {
      formData.append('audio', params.voiceFile);
    }

    formData.append(
      'text_weight',
      String(params.textWeight ?? 0.4)
    );

    formData.append(
      'image_weight',
      String(params.imageWeight ?? 0.4)
    );

    formData.append(
      'voice_weight',
      String(params.voiceWeight ?? 0.2)
    );

    return apiRequest<MultimodalResult>('/analyze/multimodal', {
      method: 'POST',
      body: formData
    });
  }

  // 5. ANALYSIS HISTORY

  public static async getHistory(
    all = false
  ): Promise<AnalysisRecord[]> {
    const endpoint = all
      ? '/history?all=true'
      : '/history';

    const data = await apiRequest<{
      success: boolean;
      history: AnalysisRecord[];
    }>(endpoint);

    return data.history || [];
  }

  // 6. GET SINGLE HISTORY RECORD

  public static async getHistoryItem(
    id: number
  ): Promise<AnalysisRecord> {
    const data = await apiRequest<{
      success: boolean;
      record: AnalysisRecord;
    }>(`/history/${id}`);

    return data.record;
  }

  // 7. DELETE HISTORY RECORD

  public static async deleteHistoryItem(
    id: number
  ): Promise<boolean> {
    const data = await apiRequest<{
      success: boolean;
    }>(`/history/${id}`, {
      method: 'DELETE'
    });

    return data.success ?? false;
  }

  // 8. CLEAR ALL HISTORY

  public static async clearAllHistory(): Promise<boolean> {
    const data = await apiRequest<{
      success: boolean;
    }>('/history', {
      method: 'DELETE'
    });

    return data.success ?? false;
  }

  // 9. DASHBOARD STATISTICS

  public static async getDashboardStats(
    all = false
  ): Promise<DashboardStats> {
    const endpoint = all
      ? '/dashboard?all=true'
      : '/dashboard';

    const data = await apiRequest<{
      success: boolean;
      stats: DashboardStats;
    }>(endpoint);

    return data.stats;
  }

  // 10. ADMIN STATISTICS

  public static async getAdminStats(): Promise<AdminStats> {
    const data = await apiRequest<{
      success: boolean;
      stats: AdminStats;
    }>('/admin/stats');

    return data.stats;
  }

  // 11. ADMIN USERS

  public static async getAdminUsers(): Promise<User[]> {
    const data = await apiRequest<{
      success: boolean;
      users: User[];
    }>('/admin/users');

    return data.users || [];
  }

  // 12. LOAD DEMO DATA

  public static async loadDemoData(): Promise<void> {
    await apiRequest('/demo-data', {
      method: 'POST'
    });
  }

  // 13. EXPORT HISTORY TO CSV

  public static exportToCsv(
    records: AnalysisRecord[],
    filename = 'emotix_analyses.csv'
  ): void {
    if (records.length === 0) return;

    const headers = [
      'ID',
      'Date',
      'Input Type',
      'Predicted Emotion',
      'Confidence',
      'Faces Detected',
      'Input/Transcript',
      'Notes'
    ];

    const rows = records.map(record => [
      record.id,
      record.created_at,
      record.input_type,
      record.emotion,
      (record.confidence * 100).toFixed(1) + '%',
      record.face_count || 0,
      `"${(
        record.text_input ||
        record.transcript ||
        record.image_filename ||
        ''
      ).replace(/"/g, '""')}"`,
      `"${(record.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(
      [csvContent],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
