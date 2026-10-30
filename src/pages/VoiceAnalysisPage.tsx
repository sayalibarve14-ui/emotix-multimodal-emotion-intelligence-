import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  Volume2,
  Clock,
  Hash,
  BarChart2,
  Radar,
  Compass,
  FileText
} from 'lucide-react';
import { EmotionBadge } from '../components/EmotionBadge.js';
import { ProbabilityBar } from '../components/ProbabilityBar.js';
import { RadarChart } from '../components/RadarChart.js';
import { CircumplexPlot } from '../components/CircumplexPlot.js';
import { ApiService } from '../services/api.js';
import { ReportGenerator } from '../utils/pdfGenerator.js';
import { soundManager } from '../utils/audioFeedback.js';
import { VoiceAnalysisResult } from '../types/index.js';

export const VoiceAnalysisPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceAnalysisResult | null>(null);
  const [activeVisualizer, setActiveVisualizer] = useState<'bars' | 'radar' | 'circumplex'>('bars');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Sample quick vocal voice scripts
  const voicePresets = [
    {
      label: 'Joyful / Happy',
      text: 'I am so excited and happy to announce that we won first place in the college competition!'
    },
    {
      label: 'Upset / Angry',
      text: 'I am furious about how unfairly the project marks were distributed without explanation.'
    },
    {
      label: 'Anxious / Fear',
      text: 'I feel very nervous and scared about the upcoming final year viva examination tomorrow.'
    },
    {
      label: 'Astonished / Surprise',
      text: 'Wow, I truly was not expecting such an unbelievable announcement today!'
    }
  ];

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
        setTranscript(currentTranscript.trim());
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition status:', e.error);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setTranscript('');
    setResult(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start duration counter
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Start SpeechRecognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }

      soundManager.playBlip(540, 0.05);
    } catch (err: any) {
      console.error(err);
      setError('Microphone access denied or unavailable. You can also type or use speech presets below.');
    }
  };

  const stopRecording = () => {
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

  const handleReset = () => {
    soundManager.playBlip(320, 0.04);
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscript('');
    setResult(null);
    setError(null);
    setRecordingSeconds(0);
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError('Please record audio or provide a transcript for emotion analysis.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let audioFile: File | undefined;
      if (audioBlob) {
        audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      }

      const res = await ApiService.analyzeVoice(transcript.trim(), audioFile);
      setResult(res);
      soundManager.playResultChime();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while analyzing voice recording transcript.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    ReportGenerator.generatePdf({
      title: 'EMOTIX — Voice-to-Text Emotion Report',
      analysisType: 'Text Analysis',
      createdAt: result.created_at,
      detectedEmotion: result.emotion,
      confidence: result.confidence,
      probabilities: result.probabilities,
      textInput: `[Voice Transcript] ${result.transcript}`
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-1 font-semibold">
          <span>MODULE 04 · VOICE-TO-TEXT AFFECTIVE RECOGNITION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Voice Emotion Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Record vocal speech, transcribe audio in real-time, and classify affective signals through the calibrated NLP pipeline.
        </p>
      </div>

      {/* Acoustic Notice */}
      <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <Volume2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold">Academic Transparency Notice: </strong>
          This feature performs <strong>voice-to-text emotion analysis</strong>: speech is converted into linguistic text tokens and evaluated via the validated NLP emotion classifier.
        </div>
      </div>

      {/* Main Recording Console */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Record & Audio Player Zone */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all shadow-lg shadow-red-500/30 animate-pulse"
                title="Stop Recording"
              >
                <Square className="w-6 h-6" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30"
                title="Start Voice Recording"
              >
                <Mic className="w-7 h-7" />
              </button>
            )}

            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isRecording ? 'Listening & Transcribing...' : audioUrl ? 'Voice Recording Ready' : 'Click Mic to Record'}</span>
                {isRecording && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
              </div>
              <p className="text-xs font-mono text-slate-500">
                Duration: {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          {/* Audio Player playback if recorded */}
          {audioUrl && (
            <div className="w-full sm:w-auto">
              <audio controls src={audioUrl} className="h-10 w-full sm:w-64 accent-indigo-600" />
            </div>
          )}
        </div>

        {/* Live Transcript Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Spoken Transcript (Editable)
            </label>
            <span className="text-xs font-mono text-slate-400">
              {transcript.length} characters
            </span>
          </div>

          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            placeholder="Your spoken words will appear here in real-time, or you can type directly..."
            rows={3}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed resize-y"
          />
        </div>

        {/* Quick Voice Script Presets */}
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2 font-medium">
            Or test with sample spoken transcripts:
          </span>
          <div className="flex flex-wrap gap-2">
            {voicePresets.map((vp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  soundManager.playBlip(480, 0.03);
                  setTranscript(vp.text);
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 text-left"
              >
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 mr-1.5">{vp.label}:</span>
                <span className="truncate max-w-[220px] inline-block align-bottom">{vp.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            disabled={!transcript && !audioUrl && !result}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !transcript.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating Vocal Transcript...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Analyze Voice Emotion</span>
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
            <span className="font-semibold">Voice Notice: </span>
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
                Dominant Vocal-Text Prediction
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

          {/* Visualizer Tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Probability Visualizations &amp; Affective Trajectory
              </span>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={() => setActiveVisualizer('bars')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeVisualizer === 'bars'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
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
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Radar className="w-3.5 h-3.5" />
                  <span>7D Radar Chart</span>
                </button>

                <button
                  onClick={() => setActiveVisualizer('circumplex')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeVisualizer === 'circumplex'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
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

          {/* Transcript Telemetry */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Hash className="w-3.5 h-3.5" /> Analyzed Words
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {result.text_statistics?.word_count ?? result.transcript.split(/\s+/).length} words
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5" /> Timestamp
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {new Date(result.created_at).toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block mb-1 font-semibold">Analyzed Transcript:</span>
              <p className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 italic text-slate-800 dark:text-slate-200 leading-relaxed">
                &ldquo;{result.transcript}&rdquo;
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Voice-to-text analysis committed to SQLite database. Viewable on your personal Dashboard &amp; History.</span>
          </div>
        </div>
      )}
    </div>
  );
};
