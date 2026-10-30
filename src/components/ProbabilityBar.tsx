import React from 'react';
import { EmotionProbabilities, EmotionType } from '../types/index.js';
import { EMOTION_META } from './EmotionBadge.js';

interface ProbabilityBarProps {
  probabilities: EmotionProbabilities | Record<string, number>;
  highlightedEmotion?: EmotionType;
  compact?: boolean;
}

const ORDERED_EMOTIONS: EmotionType[] = [
  'Happy',
  'Sad',
  'Angry',
  'Fear',
  'Surprise',
  'Disgust',
  'Neutral'
];

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({
  probabilities,
  highlightedEmotion,
  compact = false
}) => {
  return (
    <div className={`space-y-${compact ? '1.5' : '2.5'}`}>
      {ORDERED_EMOTIONS.map(em => {
        const prob = probabilities[em] || 0;
        const percentage = (prob * 100).toFixed(1);
        const isDominant = highlightedEmotion === em;
        const meta = EMOTION_META[em];

        return (
          <div key={em} className="group">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`flex items-center gap-1.5 font-medium ${isDominant ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                <span>{meta.emoji}</span>
                <span>{em}</span>
                {isDominant && (
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono uppercase tracking-wider">
                    · Top
                  </span>
                )}
              </span>
              <span className={`font-mono tabular-nums ${isDominant ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                {percentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDominant
                    ? 'bg-indigo-600 dark:bg-indigo-500'
                    : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400'
                }`}
                style={{ width: `${Math.max(prob * 100, 1.5)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
