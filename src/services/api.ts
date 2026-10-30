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

const API_BASE = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('emotix_auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export class ApiService {
  /**
   * Analyze raw text for emotions
   */
  public static async analyzeText(text: string): Promise<TextAnalysisResult> {
    const res = await fetch(`${API_BASE}/analyze/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to analyze text emotion.');
    }
    return data;
  }

  /**
   * Analyze image for face emotions
   */
  public static async analyzeImage(file?: File, sampleName?: string, webcamDataUrl?: string): Promise<ImageAnalysisResult> {
    const formData = new FormData();
    if (file) {
      formData.append('image', file);
    } else if (webcamDataUrl) {
      formData.append('webcam_image', webcamDataUrl);
    } else if (sampleName) {
      formData.append('sample_image', sampleName);
    } else {
      throw new Error('Please select an image file or capture via webcam.');
    }

    const res = await fetch(`${API_BASE}/analyze/image`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to analyze image emotion.');
    }
    return data;
  }

  /**
   * Analyze voice-to-text transcript
   */
  public static async analyzeVoice(transcript: string, audioFile?: File): Promise<VoiceAnalysisResult> {
    const formData = new FormData();
    formData.append('transcript', transcript);
    if (audioFile) {
      formData.append('audio', audioFile);
    }

    const res = await fetch(`${API_BASE}/analyze/voice`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to analyze voice recording.');
    }
    return data;
  }

  /**
   * Multimodal late fusion analysis (text + face + voice)
   */
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
    if (params.text) formData.append('text', params.text);
    if (params.voiceTranscript) formData.append('voice_transcript', params.voiceTranscript);
    if (params.file) formData.append('image', params.file);
    else if (params.sampleName) formData.append('sample_image', params.sampleName);
    if (params.voiceFile) formData.append('audio', params.voiceFile);

    formData.append('text_weight', String(params.textWeight ?? 0.4));
    formData.append('image_weight', String(params.imageWeight ?? 0.4));
    formData.append('voice_weight', String(params.voiceWeight ?? 0.2));

    const res = await fetch(`${API_BASE}/analyze/multimodal`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to process multimodal analysis.');
    }
    return data;
  }

  /**
   * Retrieve user-specific history (or all if admin)
   */
  public static async getHistory(all = false): Promise<AnalysisRecord[]> {
    const url = all ? `${API_BASE}/history?all=true` : `${API_BASE}/history`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch analysis history.');
    }
    return data.history || [];
  }

  /**
   * Retrieve single record by ID
   */
  public static async getHistoryItem(id: number): Promise<AnalysisRecord> {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch history item.');
    }
    return data.record;
  }

  /**
   * Delete single record
   */
  public static async deleteHistoryItem(id: number): Promise<boolean> {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.success ?? false;
  }

  /**
   * Clear all history records for current user
   */
  public static async clearAllHistory(): Promise<boolean> {
    const res = await fetch(`${API_BASE}/history`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.success ?? false;
  }

  /**
   * Get dashboard statistics
   */
  public static async getDashboardStats(all = false): Promise<DashboardStats> {
    const url = all ? `${API_BASE}/dashboard?all=true` : `${API_BASE}/dashboard`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to retrieve dashboard stats.');
    }
    return data.stats;
  }

  /**
   * Get admin system statistics
   */
  public static async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to retrieve admin stats.');
    }
    return data.stats;
  }

  /**
   * Get admin users list
   */
  public static async getAdminUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to retrieve users.');
    }
    return data.users || [];
  }

  /**
   * Load sample viva records
   */
  public static async loadDemoData(): Promise<void> {
    const res = await fetch(`${API_BASE}/demo-data`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to load demo data.');
    }
  }

  /**
   * Export records to CSV format
   */
  public static exportToCsv(records: AnalysisRecord[], filename = 'emotix_analyses.csv'): void {
    if (records.length === 0) return;

    const headers = ['ID', 'Date', 'Input Type', 'Predicted Emotion', 'Confidence', 'Faces Detected', 'Input/Transcript', 'Notes'];
    const rows = records.map(r => [
      r.id,
      r.created_at,
      r.input_type,
      r.emotion,
      (r.confidence * 100).toFixed(1) + '%',
      r.face_count || 0,
      `"${(r.text_input || r.transcript || r.image_filename || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
