import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Database,
  BarChart3,
  TrendingUp,
  Download,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { ApiService } from '../services/api.js';
import { EmotionBadge } from '../components/EmotionBadge.js';
import { AdminStats, User, AnalysisRecord, EmotionType } from '../types/index.js';

interface AdminPageProps {
  navigate: (route: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ navigate }) => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allHistory, setAllHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit'>('overview');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [adminStats, historyData] = await Promise.all([
        ApiService.getAdminStats(),
        ApiService.getHistory(true) // all=true for admin
      ]);
      setStats(adminStats);
      setAllHistory(historyData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Access Restricted: Administrator Privileges Required
        </h2>
        <p className="text-xs text-slate-500">
          This section contains system-wide user telemetry, raw database audit logs, and global model metrics. You must be signed in with an ADMIN account.
        </p>
        <button
          onClick={() => navigate('home')}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const handleExportAllCsv = () => {
    ApiService.exportToCsv(allHistory, `emotix_system_audit_${Date.now()}.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-1 font-semibold">
            <span>ADMINISTRATIVE SYSTEM CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            System Administration &amp; Global Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Global SQLite audit records, registered users oversight, and cross-modality model performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh Admin Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportAllCsv}
            disabled={allHistory.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Global Audit (CSV)</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 px-1 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Global Overview &amp; Telemetry
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 px-1 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          User Accounts Directory ({stats?.total_users || 0})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 px-1 ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All System Analyses Logs ({allHistory.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Users</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {stats?.total_users || 0}
              </div>
              <span className="text-[10px] text-slate-500">{stats?.user_roles.admin || 0} Admins · {stats?.user_roles.user || 0} Users</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Analyses</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {stats?.total_analyses || 0}
              </div>
              <span className="text-[10px] text-slate-500">Across entire system</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Voice Recordings</span>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                {stats?.voice_analyses || 0}
              </div>
              <span className="text-[10px] text-slate-500">Acoustic transcripts</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Multimodal Fusions</span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {stats?.multimodal_analyses || 0}
              </div>
              <span className="text-[10px] text-slate-500">Convex combinations</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Faces Detected</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {stats?.total_faces_analyzed || 0}
              </div>
              <span className="text-[10px] text-slate-500">Via pixel CV scanner</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Global Confidence</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {stats?.average_confidence ? `${(stats.average_confidence * 100).toFixed(1)}%` : '0%'}
              </div>
              <span className="text-[10px] text-slate-500">System mean</span>
            </div>
          </div>

          {/* System Modality Distribution */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              System-Wide Modality Share
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500">Text NLP</span>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                  {stats?.text_analyses || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500">Vision Faces</span>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                  {stats?.image_analyses || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500">Voice Transcripts</span>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                  {stats?.voice_analyses || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500">Multimodal AI</span>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                  {stats?.multimodal_analyses || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Directory */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                  <th className="pb-3 font-semibold">USER ID</th>
                  <th className="pb-3 font-semibold">RESEARCHER NAME</th>
                  <th className="pb-3 font-semibold">EMAIL</th>
                  <th className="pb-3 font-semibold">ROLE</th>
                  <th className="pb-3 font-semibold text-right">REGISTERED ON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {stats?.users_list.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono text-slate-400 font-bold">#{u.id}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          u.role === 'ADMIN'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Analyses Audit */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">SUBMITTER</th>
                  <th className="pb-3 font-semibold">MODALITY</th>
                  <th className="pb-3 font-semibold">CONTENT / TRANSCRIPT</th>
                  <th className="pb-3 font-semibold">PREDICTED EMOTION</th>
                  <th className="pb-3 font-semibold text-right">CONFIDENCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {allHistory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono text-slate-400">#{item.id}</td>
                    <td className="py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {item.user_name || 'Guest / Anonymous'}
                    </td>
                    <td className="py-3">
                      <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                        {item.input_type}
                      </span>
                    </td>
                    <td className="py-3 max-w-[200px] truncate text-slate-600 dark:text-slate-400">
                      {item.text_input || item.transcript || item.image_filename || 'Analysis Input'}
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
      )}
    </div>
  );
};
