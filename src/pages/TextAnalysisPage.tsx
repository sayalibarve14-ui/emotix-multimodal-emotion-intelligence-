import React, { useState } from 'react';
import {
  Send,
  Trash2,
  Download,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Hash,
  Copy,
  Check,
  BarChart2,
  Compass,
  Radar
} from 'lucide-react';
import { EmotionBadge } from '../components/EmotionBadge.js';
import { ProbabilityBar } from '../components/ProbabilityBar.js';
import { RadarChart } from '../components/RadarChart.js';
import { CircumplexPlot } from '../components/CircumplexPlot.js';
import { ApiService } from '../services/api.js';
import { ReportGenerator } from '../utils/pdfGenerator.js';
import { soundManager } from '../utils/audioFeedback.js';
import { TextAnalysisResult } from '../types/index.js';

export const TextAnalysisPage: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TextAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeVisualizer, setActiveVisualizer] = useState<'bars' | 'radar' | 'circumplex'>('bars');

  const sampleTexts = [
    { label: 'Happy', text: 'I finally got selected for my dream software engineering job!' },
    { label: 'Sad', text: 'I am really upset and heartbroken about what happened today.' },
    { label: 'Fear', text: 'I am so scared and dreading tomorrow morning presentation.' },
    { label: 'Surprise', text: "Wow! I wasn't expecting this incredible unexpected achievement!" },
    { label: 'Disgust', text: 'This spoiled rotten food smells absolutely foul and revolting.' },
    { label: 'Neutral', text: 'The project status meeting is scheduled for 3 PM on Thursday.' }
  ];

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter text to analyze.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.analyzeText(text.trim());
      setResult(res);
      // Play pleasant audio chime when result arrives!
      soundManager.playResultChime();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to the NLP text analysis API.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleClear = () => {
    soundManager.playBlip(320, 0.04);
    setText('');
    setResult(null);
    setError(null);
  };

  const handleCopyInput = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    ReportGenerator.generatePdf({
      title: 'EMOTIX — Text Emotion Analysis Report',
      analysisType: 'Text Analysis',
      createdAt: result.created_at,
      detectedEmotion: result.emotion,
      confidence: result.confidence,
      probabilities: result.probabilities,
      textInput: result.text
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-1 font-semibold">
          <span>MODULE 01 · NATURAL LANGUAGE PROCESSING</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Text Emotion Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Tokenization, negation parsing, and TF-IDF feature extraction with Softmax probability normalization.
        </p>
      </div>

      {/* Main Input Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Input Text Passage
            </label>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <button
                type="button"
                onClick={handleCopyInput}
                disabled={!text}
                className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 disabled:opacity-40"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <span>{text.length} / 5,000</span>
            </div>
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type or paste any English sentence here (Press Ctrl+Enter to analyze)..."
            rows={4}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed transition-all resize-y"
          />
        </div>

        {/* Academic Presets */}
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2 font-medium">
            Quick Academic Test Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleTexts.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  soundManager.playBlip(480, 0.03);
                  setText(sample.text);
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-slate-700/60 text-left"
              >
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 mr-1.5">{sample.label}:</span>
                <span className="truncate max-w-[200px] inline-block align-bottom">{sample.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            disabled={!text && !result}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
              Shortcut: Ctrl+Enter
            </span>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-50 transition-all shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing NLP Vector...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Analyze Emotion</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-xs text-red-800 dark:text-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Analysis Notice: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Analysis Results View */}
      {result && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          {/* Top Result Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Dominant Linguistic Prediction
              </span>
              <div className="flex items-center gap-3">
                <EmotionBadge emotion={result.emotion} confidence={result.confidence} size="lg" />
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Report</span>
            </button>
          </div>

          {/* Interactive Graph & Chart Visualizer Selector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Probability Visualizations &amp; Psychometric Coordinates
              </span>

              {/* Chart Mode Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={() => {
                    soundManager.playBlip(440, 0.02);
                    setActiveVisualizer('bars');
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeVisualizer === 'bars'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Probability Bars</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playBlip(440, 0.02);
                    setActiveVisualizer('radar');
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeVisualizer === 'radar'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Radar className="w-3.5 h-3.5" />
                  <span>7D Radar Chart</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playBlip(440, 0.02);
                    setActiveVisualizer('circumplex');
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeVisualizer === 'circumplex'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Circumplex 2D Plot</span>
                </button>
              </div>
            </div>

            {/* Active Visualizer Panel */}
            <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 min-h-[260px] flex items-center justify-center">
              {activeVisualizer === 'bars' && (
                <div className="w-full max-w-xl">
                  <ProbabilityBar probabilities={result.probabilities} highlightedEmotion={result.emotion} />
                </div>
              )}

              {activeVisualizer === 'radar' && (
                <RadarChart probabilities={result.probabilities} highlightedEmotion={result.emotion} size={260} />
              )}

              {activeVisualizer === 'circumplex' && (
                <CircumplexPlot probabilities={result.probabilities} dominantEmotion={result.emotion} />
              )}
            </div>
          </div>

          {/* Model Telemetry Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Hash className="w-3.5 h-3.5" /> Modality
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">Text / Natural Language</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5" /> Evaluated Timestamp
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {new Date(result.created_at).toLocaleString()}
              </span>
            </div>

            {result.processed_tokens && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block mb-1">Parsed Syntactic Tokens:</span>
                <div className="flex flex-wrap gap-1">
                  {result.processed_tokens.map((token: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700"
                    >
                      {token}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Analysis committed to persistent SQLite database. Ready for viva audit.</span>
          </div>
        </div>
      )}
    </div>
  );
};
