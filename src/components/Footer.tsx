import React from 'react';
import { Database, Cpu } from 'lucide-react';

interface FooterProps {
  navigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-base text-slate-900 dark:text-white">EMOTIX</span>
              <span className="text-xs text-slate-500 font-mono">v2.0.0</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 max-w-md">
              Multimodal Emotion Intelligence platform combining natural language processing, computer vision, and vocal acoustics for affective computing.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
              <span className="inline-flex items-center gap-1">
                <Database className="w-3 h-3 text-indigo-500" /> SQLite 3
              </span>
              <span className="inline-flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-500" /> TF-IDF + CV
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Platform Modules
            </h4>
            <ul className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => navigate('text-analysis')} className="hover:text-indigo-600 transition-colors text-left">
                  Natural Language Processing (Text)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('image-analysis')} className="hover:text-indigo-600 transition-colors text-left">
                  Computer Vision (Facial Expression)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('voice-analysis')} className="hover:text-indigo-600 transition-colors text-left">
                  Voice Acoustic Analysis
                </button>
              </li>
              <li>
                <button onClick={() => navigate('multimodal')} className="hover:text-indigo-600 transition-colors text-left">
                  Multimodal Late Decision Fusion
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500 gap-2">
          <p className="font-mono">Understand emotions. Connect the signals.</p>
        </div>
      </div>
    </footer>
  );
};
