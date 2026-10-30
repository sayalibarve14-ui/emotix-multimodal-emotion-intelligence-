import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  X,
  Clock,
  Database,
  ArrowUpDown,
  AlertTriangle
} from 'lucide-react';
import { EmotionBadge } from '../components/EmotionBadge.js';
import { ProbabilityBar } from '../components/ProbabilityBar.js';
import { ApiService } from '../services/api.js';
import { ReportGenerator } from '../utils/pdfGenerator.js';
import { AnalysisRecord, EmotionType } from '../types/index.js';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emotionFilter, setEmotionFilter] = useState<string>('All');
  const [modalityFilter, setModalityFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete analysis record #${id} from SQLite database?`)) return;

    setDeletingId(id);
    try {
      await ApiService.deleteHistoryItem(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear ALL analysis records from SQLite?')) return;
    try {
      await ApiService.clearAllHistory();
      setHistory([]);
      setSelectedRecord(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPdf = (record: AnalysisRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    ReportGenerator.generatePdf({
      title: 'EMOTIX — Analysis History Record',
      analysisType:
        record.input_type === 'multimodal'
          ? 'Multimodal Analysis'
          : record.input_type === 'image'
          ? 'Image Analysis'
          : 'Text Analysis',
      createdAt: record.created_at,
      detectedEmotion: record.emotion,
      confidence: record.confidence,
      probabilities: record.probabilities,
      textInput: record.text_input || undefined,
      imageFilename: record.image_filename || undefined,
      faceCount: record.face_count
    });
  };

  const emotions: EmotionType[] = [
    'Happy',
    'Sad',
    'Angry',
    'Fear',
    'Surprise',
    'Disgust',
    'Neutral'
  ];

  // Filtering & Sorting
  const filtered = history
    .filter(item => {
      const matchesEmotion = emotionFilter === 'All' || item.emotion === emotionFilter;
      const matchesModality = modalityFilter === 'All' || item.input_type === modalityFilter;
      const matchesSearch =
        search === '' ||
        String(item.id).includes(search) ||
        (item.text_input && item.text_input.toLowerCase().includes(search.toLowerCase())) ||
        (item.image_filename && item.image_filename.toLowerCase().includes(search.toLowerCase())) ||
        item.emotion.toLowerCase().includes(search.toLowerCase());

      return matchesEmotion && matchesModality && matchesSearch;
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-1">
            <span>SQLITE AUDIT TRAIL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Analysis History
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review, search, filter, and audit past text, facial expression, and multimodal analyses.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, keyword, or emotion..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Emotion Filter */}
          <select
            value={emotionFilter}
            onChange={e => setEmotionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Emotions</option>
            {emotions.map(em => (
              <option key={em} value={em}>
                {em}
              </option>
            ))}
          </select>

          {/* Modality Filter */}
          <select
            value={modalityFilter}
            onChange={e => setModalityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Modalities</option>
            <option value="text">Text (NLP)</option>
            <option value="image">Image (CV)</option>
            <option value="multimodal">Multimodal</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            Loading SQLite records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Database className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500">No analyses matched the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">DATE & TIME</th>
                  <th className="pb-3 font-semibold">INPUT TYPE</th>
                  <th className="pb-3 font-semibold">SUMMARY / INPUT</th>
                  <th className="pb-3 font-semibold">EMOTION</th>
                  <th className="pb-3 font-semibold text-right">CONFIDENCE</th>
                  <th className="pb-3 font-semibold text-center">FACES</th>
                  <th className="pb-3 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filtered.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 font-mono text-slate-400 font-bold">#{item.id}</td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                          item.input_type === 'multimodal'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : item.input_type === 'text'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {item.input_type}
                      </span>
                    </td>
                    <td className="py-3.5 max-w-[200px] truncate text-slate-700 dark:text-slate-300">
                      {item.text_input ? `"${item.text_input}"` : item.image_filename || 'Image file'}
                    </td>
                    <td className="py-3.5">
                      <EmotionBadge emotion={item.emotion} size="sm" showConfidence={false} />
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {(item.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 text-center font-mono text-slate-600 dark:text-slate-400">
                      {item.face_count > 0 ? item.face_count : '—'}
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedRecord(item);
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleDownloadPdf(item, e)}
                          className="p-1.5 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleDelete(item.id, e)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete from SQLite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analysis Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  RECORD #{selectedRecord.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                  {selectedRecord.input_type} Analysis Audit
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block mb-1">Primary Prediction</span>
                  <EmotionBadge emotion={selectedRecord.emotion} confidence={selectedRecord.confidence} size="lg" />
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block mb-0.5">Recorded At</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                    {new Date(selectedRecord.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Input details */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                  Input Data:
                </span>
                {selectedRecord.text_input && (
                  <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 leading-relaxed font-sans text-xs">
                    &ldquo;{selectedRecord.text_input}&rdquo;
                  </p>
                )}
                {selectedRecord.image_filename && (
                  <p className="font-mono text-[11px] text-slate-500">
                    Image: {selectedRecord.image_filename} (Faces detected: {selectedRecord.face_count})
                  </p>
                )}
              </div>

              {/* Probability Vector */}
              <div>
                <span className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] block mb-2">
                  Full 7-Class Emotion Probability Vector:
                </span>
                <ProbabilityBar probabilities={selectedRecord.probabilities} highlightedEmotion={selectedRecord.emotion} />
              </div>

              {selectedRecord.notes && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Notes: </span>
                  {selectedRecord.notes}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <button
                onClick={() => handleDownloadPdf(selectedRecord)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Report</span>
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
