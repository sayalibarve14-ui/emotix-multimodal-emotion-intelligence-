import React from 'react';
import { EmotionProbabilities, EmotionType } from '../types/index.js';
import { EMOTION_META } from './EmotionBadge.js';

interface MultimodalComparisonChartProps {
  textProbabilities?: EmotionProbabilities | Record<string, number>;
  imageProbabilities?: EmotionProbabilities | Record<string, number>;
  voiceProbabilities?: EmotionProbabilities | Record<string, number>;
  fusedProbabilities: EmotionProbabilities | Record<string, number>;
  winningEmotion: EmotionType;
}

const EMOTIONS: EmotionType[] = ['Happy', 'Sad', 'Angry', 'Fear', 'Surprise', 'Disgust', 'Neutral'];

export const MultimodalComparisonChart: React.FC<MultimodalComparisonChartProps> = ({
  textProbabilities,
  imageProbabilities,
  voiceProbabilities,
  fusedProbabilities,
  winningEmotion
}) => {
  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-800 gap-2">
        <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Modality Probability Comparison Matrix
        </span>
        <div className="flex items-center gap-4 text-[11px] font-medium flex-wrap">
          {textProbabilities && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-400">Text NLP</span>
            </div>
          )}
          {imageProbabilities && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-400">Vision CV</span>
            </div>
          )}
          {voiceProbabilities && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-400">Voice Acoustic</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            <span className="text-slate-900 dark:text-white font-bold">Fused Output</span>
          </div>
        </div>
      </div>

      {/* Grouped Bars */}
      <div className="space-y-3">
        {EMOTIONS.map(em => {
          const pt = textProbabilities ? textProbabilities[em] || 0 : undefined;
          const pi = imageProbabilities ? imageProbabilities[em] || 0 : undefined;
          const pv = voiceProbabilities ? voiceProbabilities[em] || 0 : undefined;
          const pf = fusedProbabilities[em] || 0;
          const isWinner = em === winningEmotion;
          const meta = EMOTION_META[em];

          return (
            <div
              key={em}
              className={`p-2.5 rounded-xl border transition-all ${
                isWinner
                  ? 'border-indigo-400/60 bg-indigo-50/30 dark:bg-indigo-950/20'
                  : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                  <span>{meta.emoji}</span>
                  <span className={isWinner ? 'font-bold text-indigo-600 dark:text-indigo-400' : ''}>{em}</span>
                  {isWinner && (
                    <span className="text-[10px] font-mono uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1 rounded">
                      Dominant
                    </span>
                  )}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">
                  Fused: <strong className="text-slate-900 dark:text-white font-bold">{(pf * 100).toFixed(1)}%</strong>
                </span>
              </div>

              {/* Parallel Modality Bars */}
              <div className="space-y-1">
                {/* Text Bar */}
                {typeof pt === 'number' && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-9 font-mono text-slate-400">Text</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pt * 100, 1)}%` }}
                      />
                    </div>
                    <span className="w-9 text-right font-mono text-slate-500">{(pt * 100).toFixed(0)}%</span>
                  </div>
                )}

                {/* Vision Bar */}
                {typeof pi === 'number' && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-9 font-mono text-slate-400">Vision</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pi * 100, 1)}%` }}
                      />
                    </div>
                    <span className="w-9 text-right font-mono text-slate-500">{(pi * 100).toFixed(0)}%</span>
                  </div>
                )}

                {/* Voice Bar */}
                {typeof pv === 'number' && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-9 font-mono text-slate-400">Voice</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pv * 100, 1)}%` }}
                      />
                    </div>
                    <span className="w-9 text-right font-mono text-slate-500">{(pv * 100).toFixed(0)}%</span>
                  </div>
                )}

                {/* Fused Bar */}
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-9 font-mono font-semibold text-slate-700 dark:text-slate-300">Fused</span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pf * 100, 1)}%` }}
                    />
                  </div>
                  <span className="w-9 text-right font-mono font-bold text-slate-900 dark:text-white">{(pf * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
