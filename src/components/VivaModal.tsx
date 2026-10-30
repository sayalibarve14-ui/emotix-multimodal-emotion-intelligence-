import React from 'react';
import { X, BookOpen, Layers, CheckCircle2, FileText, Binary } from 'lucide-react';

interface VivaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VivaModal: React.FC<VivaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                BSc CS Viva Defense & Academic Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Key questions, theoretical foundations, mathematical formulas & architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {/* Section 1: The Core Mathematical Formula */}
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
            <div className="flex items-center gap-2 mb-2 text-indigo-900 dark:text-indigo-300 font-semibold text-sm">
              <Binary className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>1. Multimodal Late Probability Decision Fusion Formula</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              EMOTIX implements a late decision fusion paradigm combining discrete probability distributions from both Natural Language Processing and Computer Vision:
            </p>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg font-mono text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 text-center my-2">
              P_fused(e) = ( W_text · P_text(e) + W_image · P_image(e) ) / ( W_text + W_image )
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Where <code className="font-mono text-indigo-600">e ∈ &#123;Happy, Sad, Angry, Fear, Surprise, Disgust, Neutral&#125;</code> and <code className="font-mono text-indigo-600">W_text + W_image = 1.0</code> (configurable 50/50 default).
            </p>
          </div>

          {/* Section 2: Frequently Asked Viva Questions */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Top 5 Viva Questions with Model Answers</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1">
                  Q1: Why choose Late Decision Fusion over Early Feature Fusion?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Answer:</strong> Early fusion concatenates raw text embeddings and image feature maps into one vector before a classifier. This requires paired data during training and breaks down if one modality (e.g. text or face) is missing. Late Decision Fusion allows decoupled, modular models: the NLP and CV pipelines can be trained, updated, or evaluated independently, and handle asynchronous single-modality inputs gracefully.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1">
                  Q2: How does the NLP pipeline transform raw text into emotion probabilities?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Answer:</strong> The pipeline applies text cleaning (lowercasing, punctuation stripping), negation detection (e.g., &quot;not happy&quot; flips polarity), TF-IDF n-gram vectorization, and a Multinomial classifier calibrated with Softmax normalization: <code>P(e) = exp(z_e) / Σ exp(z_k)</code> ensuring probabilities sum to 1.0.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1">
                  Q3: How does the Computer Vision pipeline detect and isolate faces?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Answer:</strong> It converts RGB imagery into single-channel grayscale, applies OpenCV&apos;s Haar Cascade integral image evaluation (detecting edge, line, and center-surround contrast features), bounds facial coordinates <code>(x, y, w, h)</code>, and crops the region of interest (ROI) to 48×48 pixels for Facial Action Unit (AU) analysis.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1">
                  Q4: What happens if an image contains multiple faces?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Answer:</strong> EMOTIX detects all faces individually, outputs isolated probabilities and bounding boxes for each face (e.g. Face 1, Face 2), and computes an aggregated image-level emotion vector using uniform probability averaging across detected subjects before multimodal fusion.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1">
                  Q5: What are the ethical and technical boundaries of this system?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Answer:</strong> EMOTIX does not claim to read human psychological truth. It estimates &quot;predicted facial expression emotion&quot; and &quot;predicted text emotion&quot; for educational research. It enforces privacy by never saving biometrics or personal identity profiles.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: College Viva Checklist */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Viva Demonstration Checklist</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white">✓ Working Full-Stack:</span> Express/Flask REST API + React SPA + SQLite database.
              </div>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white">✓ True Probabilities:</span> All 7 emotion outputs sum strictly to 1.0 (100%).
              </div>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white">✓ Python Training Script:</span> Ready in <code>backend/ml/train_text_model.py</code>.
              </div>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white">✓ PDF Documentation:</span> Real-time downloadable analysis PDF reports.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
