import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Video,
  BarChart2,
  Compass,
  Radar,
  Mic,
  Square,
  Volume2,
  Layers,
  FileText,
  RotateCcw
} from 'lucide-react';
import { EmotionBadge } from '../components/EmotionBadge.js';
import { ProbabilityBar } from '../components/ProbabilityBar.js';
import { RadarChart } from '../components/RadarChart.js';
import { CircumplexPlot } from '../components/CircumplexPlot.js';
import { MultimodalComparisonChart } from '../components/MultimodalComparisonChart.js';
import { WebcamModal } from '../components/WebcamModal.js';
import { ApiService } from '../services/api.js';
import { ReportGenerator } from '../utils/pdfGenerator.js';
import { soundManager } from '../utils/audioFeedback.js';
import { MultimodalResult } from '../types/index.js';

type MultimodalMode = 'text_image' | 'tri_modal' | 'text_voice';

export const MultimodalPage: React.FC = () => {
  const [mode, setMode] = useState<MultimodalMode>('text_image');

  // Modality Inputs
  const [text, setText] = useState('I am extremely happy and excited today!');
  const [file, setFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('sample_face_happy_1790876453955.jpg');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);

  // Voice Modality Inputs
  const [voiceTranscript, setVoiceTranscript] = useState('I am so glad our software project was completed successfully!');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Weights (normalized dynamically)
  const [textWeight, setTextWeight] = useState<number>(0.5);
  const [imageWeight, setImageWeight] = useState<number>(0.5);
  const [voiceWeight, setVoiceWeight] = useState<number>(0.2);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MultimodalResult | null>(null);
  const [activeVisualizer, setActiveVisualizer] = useState<'comparison' | 'radar' | 'circumplex'>('comparison');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setVoiceTranscript(currentTranscript.trim());
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update default weights on mode change
  const handleModeChange = (newMode: MultimodalMode) => {
    soundManager.playBlip(480, 0.03);
    setMode(newMode);
    setResult(null);
    if (newMode === 'text_image') {
      setTextWeight(0.5);
      setImageWeight(0.5);
      setVoiceWeight(0.0);
    } else if (newMode === 'tri_modal') {
      setTextWeight(0.4);
      setImageWeight(0.4);
      setVoiceWeight(0.2);
    } else if (newMode === 'text_voice') {
      setTextWeight(0.5);
      setImageWeight(0.0);
      setVoiceWeight(0.5);
    }
  };

  // Preset Academic Scenarios
  const evaluationScenarios = [
    {
      title: 'High Concordance (Joyful Text + Smile Face + Cheerful Voice)',
      text: 'I am so excited and proud of our final project presentation!',
      preset: 'sample_face_happy_1790876453955.jpg',
      voice: 'We successfully completed the entire project and got the highest marks!',
      emoji: '😊'
    },
    {
      title: 'Discordant Contrast (Grieving Text + Neutral Face)',
      text: 'I feel deeply heartbroken and sorrowful after the news.',
      preset: 'sample_face_neutral_1790876466640.jpg',
      voice: 'Everything is fine and nothing unusual happened today.',
      emoji: '😐'
    },
    {
      title: 'Sudden Shock (Amazed Text + Astonished Face)',
      text: "Wow! I wasn't expecting this unexpected revelation at all!",
      preset: 'sample_face_surprise_1790876479271.jpg',
      voice: 'Oh my goodness, this is truly unbelievable!',
      emoji: '😲'
    }
  ];

  const handleApplyScenario = (scenario: typeof evaluationScenarios[0]) => {
    soundManager.playBlip(520, 0.04);
    setText(scenario.text);
    setFile(null);
    setPreviewUrl(null);
    setSelectedPreset(scenario.preset);
    setVoiceTranscript(scenario.voice);
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setSelectedPreset('');
      setPreviewUrl(URL.createObjectURL(selected));
      soundManager.playBlip(480, 0.03);
    }
  };

  const handleWebcamCapture = (capturedFile: File) => {
    setFile(capturedFile);
    setSelectedPreset('');
    setPreviewUrl(URL.createObjectURL(capturedFile));
    soundManager.playBlip(540, 0.04);
  };

  const startVoiceRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setVoiceSeconds(0);
      timerRef.current = setInterval(() => setVoiceSeconds(s => s + 1), 1000);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
      soundManager.playBlip(540, 0.05);
    } catch {
      setError('Microphone access is unavailable. You can enter or select voice transcripts directly.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      soundManager.playBlip(440, 0.05);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      let activeText: string | undefined;
      let activeFile: File | undefined;
      let activePreset: string | undefined;
      let activeVoice: string | undefined;

      if (mode === 'text_image' || mode === 'tri_modal') {
        activeText = text.trim() || undefined;
        activeFile = file || undefined;
        activePreset = selectedPreset || undefined;
      }
      if (mode === 'tri_modal' || mode === 'text_voice') {
        activeVoice = voiceTranscript.trim() || undefined;
      }
      if (mode === 'text_voice') {
        activeText = text.trim() || undefined;
      }

      let voiceFile: File | undefined;
      if (audioBlob && activeVoice) {
        voiceFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      }

      const res = await ApiService.analyzeMultimodal({
        text: activeText,
        file: activeFile,
        sampleName: activePreset,
        voiceTranscript: activeVoice,
        voiceFile,
        textWeight: mode === 'text_voice' ? textWeight : mode === 'text_image' ? textWeight : textWeight,
        imageWeight: mode === 'text_voice' ? 0 : imageWeight,
        voiceWeight: mode === 'text_image' ? 0 : voiceWeight
      });

      setResult(res);
      soundManager.playResultChime();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred during multimodal emotion fusion.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    ReportGenerator.generatePdf({
      title: 'EMOTIX — Multimodal AI Analysis Report',
      analysisType: 'Multimodal Analysis',
      createdAt: result.created_at,
      detectedEmotion: result.emotion,
      confidence: result.confidence,
      probabilities: result.probabilities,
      textInput: result.text_input,
      imageFilename: result.image_filename,
      textResult: result.text_result,
      imageResult: result.image_result,
      fusion: result.fusion
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-1 font-semibold">
          <span>MODULE 03 · MULTIMODAL LATE DECISION FUSION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Multimodal Emotion Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Perform algorithmic decision-level fusion by combining independent linguistic, facial expression, and vocal affective streams.
        </p>
      </div>

      {/* Modality Mode Selector */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 w-fit">
        <button
          type="button"
          onClick={() => handleModeChange('text_image')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'text_image'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Dual Modality: Text + Image
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('tri_modal')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'tri_modal'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Tri-Modal: Text + Image + Voice
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('text_voice')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'text_voice'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Audio-Linguistic: Text + Voice
        </button>
      </div>

      {/* Preset Academic Viva Test Scenarios */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
          Preset Academic Viva Test Pairs:
        </span>
        <div className="flex flex-wrap gap-2">
          {evaluationScenarios.map((sc, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyScenario(sc)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-800 dark:text-slate-200 font-medium transition-colors"
            >
              <span>{sc.emoji}</span>
              <span>{sc.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Multimodal Input Streams Grid */}
      <div
        className={`grid gap-6 items-stretch ${
          mode === 'tri_modal' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
        }`}
      >
        {/* Stream A: Text */}
        {(mode === 'text_image' || mode === 'tri_modal' || mode === 'text_voice') && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Stream A: Linguistic Text
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  Weight: {(textWeight * 100).toFixed(0)}%
                </span>
              </div>

              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Enter written phrase or sentence..."
                rows={mode === 'tri_modal' ? 5 : 4}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
              />
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Pipeline: Lexical Tokenizer → Negation Logic → TF-IDF Softmax
            </div>
          </div>
        )}

        {/* Stream B: Image / Webcam */}
        {(mode === 'text_image' || mode === 'tri_modal') && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Stream B: Facial Expression
                </label>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Weight: {(imageWeight * 100).toFixed(0)}%
                </span>
              </div>

              <div className="space-y-3">
                {/* Presets and Webcam Buttons */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playBlip(480, 0.03);
                        setSelectedPreset('sample_face_happy_1790876453955.jpg');
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className={`px-2 py-1 text-xs rounded-lg border font-medium ${
                        selectedPreset.includes('happy')
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      😊 Smile
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playBlip(480, 0.03);
                        setSelectedPreset('sample_face_neutral_1790876466640.jpg');
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className={`px-2 py-1 text-xs rounded-lg border font-medium ${
                        selectedPreset.includes('neutral')
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      😐 Neutral
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playBlip(480, 0.03);
                        setSelectedPreset('sample_face_surprise_1790876479271.jpg');
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className={`px-2 py-1 text-xs rounded-lg border font-medium ${
                        selectedPreset.includes('surprise')
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      😲 Shock
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsWebcamOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Camera</span>
                  </button>
                </div>

                {/* Status readout */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  {previewUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-lg shrink-0">
                      {selectedPreset.includes('happy') ? '😊' : selectedPreset.includes('surprise') ? '😲' : '😐'}
                    </div>
                  )}
                  <div className="space-y-0.5 text-xs overflow-hidden">
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {file ? file.name : `Preset: ${selectedPreset.replace('sample_face_', '').replace(/\.jpg$/, '')}`}
                    </span>
                    <label className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer block">
                      Upload image
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Pipeline: Chrominance Mesh → Face Localization → Action Unit Ratios
            </div>
          </div>
        )}

        {/* Stream C: Voice (Speech-to-Text) */}
        {(mode === 'tri_modal' || mode === 'text_voice') && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Stream C: Vocal Acoustic
                </label>
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                  Weight: {(voiceWeight * 100).toFixed(0)}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Record Mic</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white animate-pulse"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop ({voiceSeconds}s)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playBlip(400, 0.03);
                      setVoiceTranscript('I am delighted and overjoyed with this wonderful result!');
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-400"
                  >
                    Quick Vocal Sample
                  </button>
                </div>

                <textarea
                  value={voiceTranscript}
                  onChange={e => setVoiceTranscript(e.target.value)}
                  placeholder="Vocal speech transcript will appear here..."
                  rows={mode === 'tri_modal' ? 3 : 4}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs leading-relaxed"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Pipeline: SpeechRecognition Web API → Lexical Feature Vector
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Fusion Weight Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Dynamic Modality Fusion Weights (Normalized to 100%)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono font-bold">
            {mode !== 'text_voice' && (
              <span className="text-indigo-600 dark:text-indigo-400">Text: {(textWeight * 100).toFixed(0)}%</span>
            )}
            {mode !== 'text_voice' && (
              <span className="text-emerald-600 dark:text-emerald-400">Vision: {(imageWeight * 100).toFixed(0)}%</span>
            )}
            {(mode === 'tri_modal' || mode === 'text_voice') && (
              <span className="text-purple-600 dark:text-purple-400">Voice: {(voiceWeight * 100).toFixed(0)}%</span>
            )}
          </div>
        </div>

        {/* Sliders */}
        {mode === 'text_image' && (
          <div className="space-y-1">
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={textWeight}
              onChange={e => {
                const val = parseFloat(e.target.value);
                setTextWeight(val);
                setImageWeight(Number((1.0 - val).toFixed(2)));
              }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>10% Text / 90% Vision</span>
              <span>50% Text / 50% Vision (Balanced Standard)</span>
              <span>90% Text / 10% Vision</span>
            </div>
          </div>
        )}

        {mode === 'tri_modal' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Text Weight: {(textWeight * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={textWeight}
                onChange={e => setTextWeight(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Vision Weight: {(imageWeight * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={imageWeight}
                onChange={e => setImageWeight(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Voice Weight: {(voiceWeight * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.05"
                value={voiceWeight}
                onChange={e => setVoiceWeight(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        {mode === 'text_voice' && (
          <div className="space-y-1">
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={textWeight}
              onChange={e => {
                const val = parseFloat(e.target.value);
                setTextWeight(val);
                setVoiceWeight(Number((1.0 - val).toFixed(2)));
              }}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>10% Text / 90% Voice</span>
              <span>50% Text / 50% Voice (Equal Combination)</span>
              <span>90% Text / 10% Voice</span>
            </div>
          </div>
        )}
      </div>

      {/* Trigger Button */}
      <div className="flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing Multimodal Decision...</span>
            </>
          ) : (
            <>
              <Layers className="w-4 h-4" />
              <span>Synthesize Multimodal Emotion</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-xs text-red-800 dark:text-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Fusion Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Synthesized Multimodal Decision
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
              <span>Download Multimodal PDF Report</span>
            </button>
          </div>

          {/* Individual Modality Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Text Modality */}
            {result.text_result ? (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block font-bold">
                  1. Text Modality Result
                </span>
                <div className="flex items-center gap-2">
                  <EmotionBadge emotion={result.text_result.emotion} confidence={result.text_result.confidence} size="md" />
                </div>
                <span className="text-[11px] text-slate-500 font-mono block">
                  Weight: {((result.fusion.weights?.text ?? textWeight) * 100).toFixed(0)}%
                </span>
              </div>
            ) : null}

            {/* 2. Vision Modality */}
            {result.image_result ? (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block font-bold">
                  2. Vision Modality Result
                </span>
                <div className="flex items-center gap-2">
                  <EmotionBadge emotion={result.image_result.emotion} confidence={result.image_result.confidence} size="md" />
                </div>
                <span className="text-[11px] text-slate-500 font-mono block">
                  Weight: {((result.fusion.weights?.image ?? imageWeight) * 100).toFixed(0)}% · Faces: {result.image_result.face_count}
                </span>
              </div>
            ) : null}

            {/* 3. Voice Modality */}
            {result.voice_result ? (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 uppercase tracking-wider block font-bold">
                  3. Voice Modality Result
                </span>
                <div className="flex items-center gap-2">
                  <EmotionBadge emotion={result.voice_result.emotion} confidence={result.voice_result.confidence} size="md" />
                </div>
                <span className="text-[11px] text-slate-500 font-mono block">
                  Weight: {((result.fusion.weights?.voice ?? voiceWeight) * 100).toFixed(0)}%
                </span>
              </div>
            ) : null}

            {/* Final Fused Card */}
            <div className="p-5 rounded-xl border-2 border-indigo-500/50 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-2">
              <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block font-bold">
                Final Decision Synthesis
              </span>
              <div className="flex items-center gap-2">
                <EmotionBadge emotion={result.emotion} confidence={result.confidence} size="md" />
              </div>
              <span className="text-[11px] text-slate-500 font-mono block">
                Convex Combination ({result.modalities_used.join(' + ')})
              </span>
            </div>
          </div>

          {/* Interactive Comparison Charts and Visualizations */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Multimodal Analytics &amp; Cross-Modality Charts
              </span>

              {/* View Selector */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={() => {
                    soundManager.playBlip(440, 0.02);
                    setActiveVisualizer('comparison');
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeVisualizer === 'comparison'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Modality Comparison</span>
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

            {/* Chart Container */}
            <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 min-h-[300px]">
              {activeVisualizer === 'comparison' && (
                <MultimodalComparisonChart
                  textProbabilities={result.text_result?.probabilities}
                  imageProbabilities={result.image_result?.probabilities}
                  voiceProbabilities={result.voice_result?.probabilities}
                  fusedProbabilities={result.probabilities}
                  winningEmotion={result.emotion}
                />
              )}

              {activeVisualizer === 'radar' && (
                <div className="flex justify-center">
                  <RadarChart probabilities={result.probabilities} highlightedEmotion={result.emotion} size={280} />
                </div>
              )}

              {activeVisualizer === 'circumplex' && (
                <div className="flex justify-center">
                  <CircumplexPlot probabilities={result.probabilities} dominantEmotion={result.emotion} />
                </div>
              )}
            </div>
          </div>

          {/* Concordance Explanation Box */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Mathematical Decision Fusion &amp; Modality Concordance
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  result.fusion.concordance === 'consistent'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                {result.fusion.concordance === 'consistent'
                  ? 'All modalities show consistent emotional alignment'
                  : 'Modality contrast/divergence detected'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {result.fusion.explanation}
            </p>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg text-xs font-mono text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-800">
              P_fused(e) = Σ [ w_m · P_m(e) ] / Σ w_m
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Multimodal analysis saved into SQLite database. Audit record logged with ID #{result.id}.</span>
          </div>
        </div>
      )}

      {/* Webcam Capture Modal */}
      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={handleWebcamCapture}
      />
    </div>
  );
};
