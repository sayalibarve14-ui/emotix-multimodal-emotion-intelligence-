import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Download,
  LogOut,
  Edit2,
  Check,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { ApiService } from '../services/api.js';
import { ReportGenerator } from '../utils/pdfGenerator.js';
import { EmotionBadge } from '../components/EmotionBadge.js';
import { soundManager } from '../utils/audioFeedback.js';
import { DashboardStats, AnalysisRecord, EmotionType } from '../types/index.js';

interface ProfilePageProps {
  navigate: (route: string) => void;
  openAuthModal: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ navigate, openAuthModal }) => {
  const { user, logout, updateProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setNameInput(user.name);
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [dashData, histData] = await Promise.all([
        ApiService.getDashboardStats(),
        ApiService.getHistory()
      ]);
      setStats(dashData);
      setHistory(histData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    try {
      await updateProfile(nameInput.trim());
      setEditingName(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      soundManager.playResultChime();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    ApiService.exportToCsv(history, `emotix_history_${user?.name.replace(/\s+/g, '_')}.csv`);
  };

  const handleDownloadFullPdf = () => {
    if (history.length === 0) return;
    const latest = history[0];
    ReportGenerator.generatePdf({
      title: 'EMOTIX — Personal Affective Computing Portfolio Report',
      analysisType:
        latest.input_type === 'multimodal'
          ? 'Multimodal Analysis'
          : latest.input_type === 'image'
          ? 'Image Analysis'
          : 'Text Analysis',
      createdAt: latest.created_at,
      detectedEmotion: latest.emotion,
      confidence: latest.confidence,
      probabilities: latest.probabilities,
      textInput: latest.text_input || latest.transcript || undefined,
      imageFilename: latest.image_filename || undefined,
      faceCount: latest.face_count
    });
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Sign In to Access Your Researcher Profile
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Authenticate to track your individual session analyses, examine personalized affective statistics, and export your thesis logs.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-1 font-semibold">
          <span>ACCOUNT &amp; TELEMETRY PROFILE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Researcher Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Manage your researcher identity, view personal emotion distribution metrics, and export data.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center text-xl font-bold font-mono shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="px-3 py-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h2>
                <button
                  onClick={() => setEditingName(true)}
                  className="p-1 rounded text-slate-400 hover:text-indigo-600"
                  title="Edit Name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{user.role}</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-mono">
              Member Since: {new Date(user.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {user.role === 'ADMIN' && (
            <button
              onClick={() => navigate('admin')}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
            >
              Open Admin Console
            </button>
          )}

          <button
            onClick={() => {
              logout();
              navigate('home');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Profile updated successfully.</span>
        </div>
      )}

      {/* Personal Usage Statistics */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Personal Affective Research Statistics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">My Total Analyses</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats?.total_analyses ?? 0}
            </div>
            <span className="text-[10px] text-slate-500">Across all modalities</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Average Confidence</span>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              {stats?.average_confidence ? `${(stats.average_confidence * 100).toFixed(1)}%` : '0%'}
            </div>
            <span className="text-[10px] text-slate-500">Model certainty</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Dominant Affect</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white pt-1">
              {stats?.most_detected_emotion && stats.most_detected_emotion !== 'N/A' ? (
                <EmotionBadge emotion={stats.most_detected_emotion as EmotionType} size="sm" showConfidence={false} />
              ) : (
                <span className="text-slate-400 text-xs">No records</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Multimodal Ratio</span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats?.total_analyses
                ? `${Math.round(((stats.multimodal_analyses || 0) / stats.total_analyses) * 100)}%`
                : '0%'}
            </div>
            <span className="text-[10px] text-slate-500">Fused decisions</span>
          </div>
        </div>
      </div>

      {/* Export Portfolio Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Data Export &amp; Reporting Options
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Download your personal analyses as an audit CSV spreadsheet or generate a formal PDF academic evaluation report.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={history.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-semibold text-xs disabled:opacity-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Personal Data (CSV)</span>
          </button>

          <button
            onClick={handleDownloadFullPdf}
            disabled={history.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Portfolio Summary PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
