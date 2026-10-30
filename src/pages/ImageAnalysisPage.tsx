import React, { useState, useRef } from 'react';
import {
  Upload,
  Trash2,
  Download,
  AlertCircle,
  Camera,
  CheckCircle2,
  Users,
  Video,
  BarChart2,
  Compass,
  Radar
} from 'lucide-react';
import { EmotionBadge } from '../components/EmotionBadge.js';
import { ProbabilityBar } from '../components/ProbabilityBar.js';
import { RadarChart } from '../components/RadarChart.js';
import { CircumplexPlot } from '../components/CircumplexPlot.js';
import { WebcamModal } from '../components/WebcamModal.js';
import { ApiService } from '../services/api.js';
import { ReportGenerator } from '../utils/pdfGenerator.js';
import { soundManager } from '../utils/audioFeedback.js';
import { ImageAnalysisResult } from '../types/index.js';

export const ImageAnalysisPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [activeVisualizer, setActiveVisualizer] = useState<'bars' | 'radar' | 'circumplex'>('bars');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean, professional vector-styled expression test presets (NO AI-GENERATED STOCK PHOTOS)
  const vectorPresets = [
    {
      id: 'happy',
      label: 'Happy (Smile AU12)',
      filename: 'sample_face_happy_1790876453955.jpg',
      emoji: '😊',
      cue: 'Lip corners elevated + cheek raise'
    },
    {
      id: 'neutral',
      label: 'Neutral (Resting)',
      filename: 'sample_face_neutral_1790876466640.jpg',
      emoji: '😐',
      cue: 'Relaxed facial geometry'
    },
    {
      id: 'surprise',
      label: 'Surprise (AU01+02)',
      filename: 'sample_face_surprise_1790876479271.jpg',
      emoji: '😲',
      cue: 'Raised brows + eye widening'
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setSelectedPreset(null);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
      soundManager.playBlip(480, 0.03);
    }
  };

  const handleSelectPreset = (preset: typeof vectorPresets[0]) => {
    soundManager.playBlip(500, 0.03);
    setFile(null);
    setSelectedPreset(preset.filename);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const handleWebcamCapture = (capturedFile: File) => {
    setFile(capturedFile);
    setSelectedPreset(null);
    setPreviewUrl(URL.createObjectURL(capturedFile));
    setResult(null);
    setError(null);
    soundManager.playBlip(600, 0.04);
  };

  const handleClear = () => {
    soundManager.playBlip(320, 0.04);
    setFile(null);
    setPreviewUrl(null);
    setSelectedPreset(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!file && !selectedPreset) {
      setError('Please upload an image, capture using webcam, or pick a test preset.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.analyzeImage(file || undefined, selectedPreset || undefined);
      setResult(res);
      // Play audio chime!
      soundManager.playResultChime();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while detecting and analyzing facial expressions.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    ReportGenerator.generatePdf({
      title: 'EMOTIX — Facial Expression Emotion Report',
      analysisType: 'Image Analysis',
      createdAt: result.created_at,
      detectedEmotion: result.emotion,
      confidence: result.confidence,
      probabilities: result.probabilities,
      imageFilename: result.image_filename,
      faceCount: result.face_count,
      faces: result.faces
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-1 font-semibold">
          <span>MODULE 02 · COMPUTER VISION FACIAL RECOGNITION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Facial Expression Recognition
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          OpenCV Haar-Cascade face localization with action unit expression modeling. Capture live via webcam or upload.
        </p>
      </div>

      {/* Main Upload / Camera Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Upload / Camera Drop Zone */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Image Input Source
              </label>
              <button
                type="button"
                onClick={() => setIsWebcamOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Use Live Webcam</span>
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Drag and drop image here or click to browse
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                JPG, PNG, WEBP (Max 15MB)
              </p>
            </div>
          </div>

          {/* Clean Academic Expression Test Presets */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
              Academic Expression Presets
            </label>
            <div className="space-y-2">
              {vectorPresets.map(preset => {
                const isSelected = selectedPreset === preset.filename;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl" role="img" aria-label={preset.label}>
                        {preset.emoji}
                      </span>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">
                          {preset.label}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {preset.cue}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Image Preview Area */}
        {(previewUrl || selectedPreset) && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-black shrink-0 border border-slate-300 dark:border-slate-600">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-2xl border border-indigo-200 dark:border-indigo-800">
                  {selectedPreset?.includes('happy') ? '😊' : selectedPreset?.includes('surprise') ? '😲' : '😐'}
                </div>
              )}
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {file ? file.name : `Standard Benchmark Portrait (${selectedPreset})`}
                </span>
                <span className="text-[11px] text-slate-500 font-mono block">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Pre-calibrated facial expression baseline'}
                </span>
              </div>
            </div>

            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            disabled={!previewUrl && !selectedPreset && !result}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || (!file && !selectedPreset)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Face Cascade & FER Model...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Detect Faces & Analyze Emotion</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>Faces Detected in Frame: {result.face_count}</span>
              </div>
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

          {result.face_count === 0 ? (
            <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold">No human faces detected.</span> Ensure adequate front lighting and unobstructed facial features.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Detailed Detected Faces Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.faces.map(face => (
                  <div
                    key={face.face_id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs font-bold font-mono flex items-center justify-center">
                          {face.face_id}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Subject #{face.face_id}
                        </span>
                      </div>
                      <EmotionBadge emotion={face.emotion} confidence={face.confidence} size="sm" />
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                      Haar Coordinates: [x:{face.box.x}, y:{face.box.y}, w:{face.box.width}, h:{face.box.height}]
                    </div>

                    <ProbabilityBar probabilities={face.probabilities} highlightedEmotion={face.emotion} compact />
                  </div>
                ))}
              </div>

              {/* Chart Visualizer Tabs for Vision Modality */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Facial Expression Geometry Visualizations
                  </span>

                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => setActiveVisualizer('bars')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        activeVisualizer === 'bars'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Probability Bars</span>
                    </button>

                    <button
                      onClick={() => setActiveVisualizer('radar')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        activeVisualizer === 'radar'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Radar className="w-3.5 h-3.5" />
                      <span>7D Radar Footprint</span>
                    </button>

                    <button
                      onClick={() => setActiveVisualizer('circumplex')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        activeVisualizer === 'circumplex'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Circumplex 2D Plot</span>
                    </button>
                  </div>
                </div>

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

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Facial expression vector stored to SQLite database. Privacy preserved (zero biometrics indexed).</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Webcam Modal */}
      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={handleWebcamCapture}
      />
    </div>
  );
};
