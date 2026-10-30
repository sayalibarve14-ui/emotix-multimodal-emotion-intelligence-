import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Camera,
  Sparkles,
  Database,
  Users,
  Percent,
  RefreshCw,
  PlusCircle,
  Eye,
  Trash2
} from 'lucide-react';
import { EmotionBadge, EMOTION_META } from '../components/EmotionBadge.js';
import { ApiService } from '../services/api.js';
import { DashboardStats, AnalysisRecord, EmotionType } from '../types/index.js';

interface DashboardPageProps {
  navigate: (route: string) => void;
  onViewRecord?: (record: AnalysisRecord) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate, onViewRecord }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLoadDemoData = async () => {
    setLoadingDemo(true);
    try {
      await ApiService.loadDemoData();
      await fetchStats();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load demo dataset.');
    } finally {
      setLoadingDemo(false);
    }
  };

  const emotionsList: EmotionType[] = [
    'Happy',
    'Sad',
    'Angry',
    'Fear',
    'Surprise',
    'Disgust',
    'Neutral'
  ];

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Querying SQLite analyses telemetry...</p>
      </div>
    );
  }

  const hasAnalyses = stats && stats.total_analyses > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-1">
            <span>SQLITE DATABASE ANALYTICS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time statistical evaluation and distribution metrics queried directly from the SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {!hasAnalyses && (
            <button
              onClick={handleLoadDemoData}
              disabled={loadingDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loadingDemo ? 'Loading Demo...' : 'Load Sample Viva Data'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Analyses
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats?.total_analyses ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">All modalities</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Text Analyses
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats?.text_analyses ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">NLP pipeline</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Image Analyses
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats?.image_analyses ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">Computer vision</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Multimodal
          </span>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
            {stats?.multimodal_analyses ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">Decision fusion</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Most Detected
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5 pt-0.5">
            {stats?.most_detected_emotion && stats.most_detected_emotion !== 'N/A' ? (
              <EmotionBadge emotion={stats.most_detected_emotion as EmotionType} size="sm" showConfidence={false} />
            ) : (
              <span className="text-slate-400 text-sm font-mono">None</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400">Top frequency</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Avg Confidence
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats?.average_confidence ? `${(stats.average_confidence * 100).toFixed(1)}%` : '0%'}
          </div>
          <span className="text-[10px] text-slate-400">Calibrated mean</span>
        </div>
      </div>

      {!hasAnalyses ? (
        /* Empty State */
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No analyses recorded in database yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Run text, image, or multimodal emotion analyses to populate live analytics telemetry, or load sample records for viva evaluation.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('multimodal')}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Start Multimodal Analysis
            </button>
            <button
              onClick={handleLoadDemoData}
              disabled={loadingDemo}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            >
              {loadingDemo ? 'Seeding Database...' : 'Load Sample Viva Data'}
            </button>
          </div>
        </div>
      ) : (
        /* Charts & Distribution Section */
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Emotion Frequency Distribution Chart */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Emotion Class Frequency Distribution
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  N = {stats?.total_analyses}
                </span>
              </div>

              <div className="space-y-3">
                {emotionsList.map(em => {
                  const count = stats?.emotion_distribution[em] || 0;
                  const total = stats?.total_analyses || 1;
                  const pct = ((count / total) * 100).toFixed(1);
                  const meta = EMOTION_META[em];

                  return (
                    <div key={em} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <span>{meta.emoji}</span>
                          <span>{em}</span>
                        </span>
                        <span className="font-mono text-slate-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                          style={{ width: `${Math.max(Number(pct), count > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modality & Confidence Overview */}
            <div className="lg:col-span-5 space-y-6">
              {/* Modality Breakdown */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Analysis Modality Proportion
                </h3>

                <div className="space-y-3">
                  {[
                    { label: 'Multimodal AI', count: stats?.modality_distribution.multimodal || 0, color: 'bg-indigo-600' },
                    { label: 'Text NLP', count: stats?.modality_distribution.text || 0, color: 'bg-amber-500' },
                    { label: 'Vision CV', count: stats?.modality_distribution.image || 0, color: 'bg-emerald-500' }
                  ].map(m => {
                    const total = stats?.total_analyses || 1;
                    const pct = ((m.count / total) * 100).toFixed(1);

                    return (
                      <div key={m.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{m.label}</span>
                          <span className="font-mono text-slate-500">
                            {m.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${m.color}`}
                            style={{ width: `${Math.max(Number(pct), m.count > 0 ? 3 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Confidence Levels */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Confidence Tier Distribution
                </h3>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">
                      HIGH (&gt;85%)
                    </span>
                    <span className="text-lg font-mono font-bold text-emerald-800 dark:text-emerald-200">
                      {stats?.confidence_distribution.high || 0}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block">
                      MED (60-85%)
                    </span>
                    <span className="text-lg font-mono font-bold text-amber-800 dark:text-amber-200">
                      {stats?.confidence_distribution.medium || 0}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold block">
                      LOW (&lt;60%)
                    </span>
                    <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200">
                      {stats?.confidence_distribution.low || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recent Analysis Activity (SQLite Telemetry)
              </h3>
              <button
                onClick={() => navigate('history')}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                View Full History →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                    <th className="pb-3 font-semibold">ID</th>
                    <th className="pb-3 font-semibold">DATE</th>
                    <th className="pb-3 font-semibold">INPUT TYPE</th>
                    <th className="pb-3 font-semibold">DETECTED EMOTION</th>
                    <th className="pb-3 font-semibold text-right">CONFIDENCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {stats?.recent_analyses.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 font-mono text-slate-400">#{item.id}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3">
                        <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                          {item.input_type}
                        </span>
                      </td>
                      <td className="py-3">
                        <EmotionBadge emotion={item.emotion} size="sm" showConfidence={false} />
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {(item.confidence * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
