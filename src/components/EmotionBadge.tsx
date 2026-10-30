import React from 'react';
import { EmotionType } from '../types/index.js';

interface EmotionBadgeProps {
  emotion: EmotionType;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
  showConfidence?: boolean;
}

export const EMOTION_META: Record<EmotionType, { emoji: string; label: string; bg: string; text: string; border: string }> = {
  Happy: {
    emoji: '😊',
    label: 'Happy',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-800/60'
  },
  Sad: {
    emoji: '😢',
    label: 'Sad',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-800/60'
  },
  Angry: {
    emoji: '😠',
    label: 'Angry',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-800 dark:text-red-200',
    border: 'border-red-200 dark:border-red-800/60'
  },
  Fear: {
    emoji: '😨',
    label: 'Fear',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-800 dark:text-purple-200',
    border: 'border-purple-200 dark:border-purple-800/60'
  },
  Surprise: {
    emoji: '😲',
    label: 'Surprise',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-800 dark:text-sky-200',
    border: 'border-sky-200 dark:border-sky-800/60'
  },
  Disgust: {
    emoji: '🤢',
    label: 'Disgust',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-800/60'
  },
  Neutral: {
    emoji: '😐',
    label: 'Neutral',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-300 dark:border-slate-700'
  }
};

export const EmotionBadge: React.FC<EmotionBadgeProps> = ({
  emotion,
  confidence,
  size = 'md',
  showConfidence = true
}) => {
  const meta = EMOTION_META[emotion] || EMOTION_META.Neutral;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-base px-4 py-2 gap-2 font-semibold'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg border ${meta.bg} ${meta.text} ${meta.border} ${sizeClasses} transition-all`}
    >
      <span className="text-base leading-none" role="img" aria-label={meta.label}>
        {meta.emoji}
      </span>
      <span>{meta.label}</span>
      {showConfidence && typeof confidence === 'number' && (
        <span className="font-mono tabular-nums opacity-75 text-[0.9em]">
          {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </span>
  );
};
