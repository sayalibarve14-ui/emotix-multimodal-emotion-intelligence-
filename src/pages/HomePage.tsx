import React, { useState } from 'react';
import {
  ArrowRight,
  MessageSquare,
  Camera,
  Sparkles,
  Database,
  Cpu,
  Binary,
  ShieldCheck,
  Zap,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { EmotionBadge } from '../components/EmotionBadge.js';
import { EmotionType } from '../types/index.js';

interface HomePageProps {
  navigate: (route: string) => void;
  openVivaGuide: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate, openVivaGuide }) => {
  // Interactive Live Pipeline Simulator on Hero
  const [activeScenario, setActiveScenario] = useState<'happy' | 'discordant' | 'surprise'>('happy');

  const scenarios = {
    happy: {
      text: 'I finally passed my final year university exams!',
      textEmotion: 'Happy' as EmotionType,
      textConf: 0.94,
      imageFace: 'Smiling Face (AU06 + AU12)',
      imageEmotion: 'Happy' as EmotionType,
      imageConf: 0.91,
      fusedEmotion: 'Happy' as EmotionType,
      fusedConf: 0.93,
      concordance: 'Consistent Agreement'
    },
    discordant: {
      text: 'I am so devastated and disheartened by the results.',
      textEmotion: 'Sad' as EmotionType,
      textConf: 0.88,
      imageFace: 'Composed Neutral Expression',
      imageEmotion: 'Neutral' as EmotionType,
      imageConf: 0.82,
      fusedEmotion: 'Sad' as EmotionType,
      fusedConf: 0.68,
      concordance: 'Modality Divergence'
    },
    surprise: {
      text: "Whoa! I didn't see that sudden announcement coming!",
      textEmotion: 'Surprise' as EmotionType,
      textConf: 0.92,
      imageFace: 'Raised Brows (AU01 + AU02)',
      imageEmotion: 'Surprise' as EmotionType,
      imageConf: 0.89,
      fusedEmotion: 'Surprise' as EmotionType,
      fusedConf: 0.91,
      concordance: 'Consistent Agreement'
    }
  };

  const curr = scenarios[activeScenario];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] text-balance">
                  Multimodal Emotion Intelligence
                </h1>
                <p className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  Linguistic NLP &amp; Facial Computer Vision Fusion
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed text-pretty">
                An advanced affective computing platform that bridges natural language sentiment analysis and facial expression recognition using late decision-level probability fusion.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => navigate('multimodal')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm"
                >
                  <span>Start Multimodal Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => navigate('text-analysis')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-all shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <span>Analyze Text</span>
                </button>

                <button
                  onClick={() => navigate('image-analysis')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-all shadow-sm"
                >
                  <Camera className="w-4 h-4 text-emerald-500" />
                  <span>Analyze Facial Image</span>
                </button>

                <button
                  onClick={() => navigate('voice-analysis')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-all shadow-sm"
                >
                  <span className="text-sm">🎙️</span>
                  <span>Analyze Voice</span>
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono pt-1">
                <span>· 7 Emotion Classes</span>
                <span>· SQLite 3 Storage</span>
                <span>· Real-time Late Fusion</span>
              </div>
            </div>

            {/* Right Interactive Architecture Diagram (NO AI-LOOKING RASTER IMAGES) */}
            <div className="lg:col-span-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                {/* Simulator Controls */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Binary className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                      Live Decision Pipeline Simulator
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {(['happy', 'discordant', 'surprise'] as const).map(k => (
                      <button
                        key={k}
                        onClick={() => setActiveScenario(k)}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded capitalize transition-colors ${
                          activeScenario === k
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dual Streams Diagram */}
                <div className="space-y-3">
                  {/* Stream A: Text */}
                  <div className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/40 dark:bg-indigo-950/30 flex items-center justify-between text-xs">
                    <div className="space-y-0.5 max-w-[240px]">
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase font-bold">
                        Modality A · NLP Text
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-sans italic truncate">
                        &ldquo;{curr.text}&rdquo;
                      </p>
                    </div>
                    <div className="text-right">
                      <EmotionBadge emotion={curr.textEmotion} confidence={curr.textConf} size="sm" />
                    </div>
                  </div>

                  {/* Flow Arrows into Central Fusion Node */}
                  <div className="flex items-center justify-center gap-2 py-0.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    <span className="text-[10px] font-mono text-slate-400">
                      W_text (50%) + W_vision (50%)
                    </span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>

                  {/* Stream B: Vision */}
                  <div className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/30 flex items-center justify-between text-xs">
                    <div className="space-y-0.5 max-w-[240px]">
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">
                        Modality B · Computer Vision
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-sans truncate">
                        {curr.imageFace}
                      </p>
                    </div>
                    <div className="text-right">
                      <EmotionBadge emotion={curr.imageEmotion} confidence={curr.imageConf} size="sm" />
                    </div>
                  </div>

                  {/* Central Late Decision Fusion Result */}
                  <div className="p-4 rounded-xl border-2 border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] font-mono">
                        Synthesized Late Fusion Decision
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          curr.concordance === 'Consistent Agreement'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {curr.concordance}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <EmotionBadge emotion={curr.fusedEmotion} confidence={curr.fusedConf} size="lg" />
                      <button
                        onClick={() => navigate('multimodal')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        Open Full Lab →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 font-mono text-center">
                  Mathematical proof: P_fused(e) = 0.5 · P_text(e) + 0.5 · P_vision(e)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-8 text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Tri-Tier Modality Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Engineered modularly so linguistic and vision features can operate in isolation or collaborate in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-xl border border-indigo-200 dark:border-indigo-900">
                📝
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Text NLP
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Syntactic negation parsing, TF-IDF n-gram vectorization, and calibrated Softmax probability outputs.
              </p>
            </div>
            <button
              onClick={() => navigate('text-analysis')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Explore NLP Module</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-xl border border-emerald-200 dark:border-emerald-900">
                📷
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Vision / Face
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                YCbCr skin chrominance localization, multi-face bounding boxes, and action unit geometric feature vectors.
              </p>
            </div>
            <button
              onClick={() => navigate('image-analysis')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>Explore Vision Module</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-xl border border-purple-200 dark:border-purple-900">
                🎙️
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Voice Acoustic
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Microphone audio recording, live speech transcription, and sentiment scoring for spoken emotion classification.
              </p>
            </div>
            <button
              onClick={() => navigate('voice-analysis')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              <span>Explore Voice Module</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-xl border border-amber-200 dark:border-amber-900">
                🧠
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Multimodal AI
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Weighted convex late fusion combining text, face, and voice vectors with concordance diagnostics and PDF reports.
              </p>
            </div>
            <button
              onClick={() => navigate('multimodal')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              <span>Explore Late Fusion</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>

      {/* How it Works / Technical Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-2xl bg-slate-900 text-white shadow-xl space-y-6">
          <div className="max-w-2xl text-left">
            <h2 className="text-2xl font-bold text-white">
              End-to-End Multimodal Data Flow
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
              <span className="text-indigo-400 font-mono font-bold text-xs">01. Acquisition</span>
              <div className="text-xs font-semibold text-white">Text &amp; Face Capture</div>
              <p className="text-[11px] text-slate-300">Raw text or webcam photo.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
              <span className="text-indigo-400 font-mono font-bold text-xs">02. Feature Extraction</span>
              <div className="text-xs font-semibold text-white">TF-IDF &amp; Haar ROI</div>
              <p className="text-[11px] text-slate-300">Syntactic tokens and 48×48 face crops.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
              <span className="text-indigo-400 font-mono font-bold text-xs">03. Classification</span>
              <div className="text-xs font-semibold text-white">Softmax Distribution</div>
              <p className="text-[11px] text-slate-300">Calibrated probabilities over 7 emotions.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
              <span className="text-indigo-400 font-mono font-bold text-xs">04. Decision Fusion</span>
              <div className="text-xs font-semibold text-white">Weighted Linear Sum</div>
              <p className="text-[11px] text-slate-300">P_fused = (W_t · P_t + W_i · P_i) / (W_t + W_i).</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
              <span className="text-indigo-400 font-mono font-bold text-xs">05. Audit &amp; DB</span>
              <div className="text-xs font-semibold text-white">SQLite Persistence</div>
              <p className="text-[11px] text-slate-300">Logged to SQLite and downloadable as PDF.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
