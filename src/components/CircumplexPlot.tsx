import React from 'react';
import { EmotionProbabilities, EmotionType } from '../types/index.js';

interface CircumplexPlotProps {
  probabilities: EmotionProbabilities | Record<string, number>;
  dominantEmotion: EmotionType;
}

const EMOTION_COORDINATES: Record<EmotionType, { valence: number; arousal: number; emoji: string }> = {
  Happy: { valence: 0.82, arousal: 0.68, emoji: '😊' },
  Surprise: { valence: 0.35, arousal: 0.84, emoji: '😲' },
  Neutral: { valence: 0.0, arousal: 0.25, emoji: '😐' },
  Disgust: { valence: -0.68, arousal: 0.42, emoji: '🤢' },
  Angry: { valence: -0.74, arousal: 0.80, emoji: '😠' },
  Fear: { valence: -0.65, arousal: 0.76, emoji: '😨' },
  Sad: { valence: -0.78, arousal: 0.20, emoji: '😢' }
};

export const CircumplexPlot: React.FC<CircumplexPlotProps> = ({
  probabilities,
  dominantEmotion
}) => {
  // Compute continuous expected Valence & Arousal by taking expectation over probability distribution
  let expectedValence = 0;
  let expectedArousal = 0;
  let totalP = 0;

  for (const [em, coords] of Object.entries(EMOTION_COORDINATES)) {
    const p = probabilities[em as EmotionType] || 0;
    expectedValence += p * coords.valence;
    expectedArousal += p * coords.arousal;
    totalP += p;
  }

  if (totalP > 0) {
    expectedValence = expectedValence / totalP;
    expectedArousal = expectedArousal / totalP;
  } else {
    expectedValence = EMOTION_COORDINATES[dominantEmotion]?.valence || 0;
    expectedArousal = EMOTION_COORDINATES[dominantEmotion]?.arousal || 0.25;
  }

  // Geometry: SVG 280 x 200
  const width = 280;
  const height = 200;
  const padding = 28;

  // Map Valence (-1 to +1) to X
  const toX = (v: number) => padding + ((v + 1) / 2) * (width - 2 * padding);
  // Map Arousal (0 to 1) to Y (inverted)
  const toY = (a: number) => height - padding - a * (height - 2 * padding);

  const markerX = toX(expectedValence);
  const markerY = toY(expectedArousal);

  return (
    <div className="flex flex-col items-center">
      <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/60 w-full max-w-[320px]">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="select-none overflow-visible">
          {/* Quadrant Dividers */}
          {/* Neutral Horizontal baseline (Arousal = 0.5) */}
          <line
            x1={padding}
            y1={toY(0.5)}
            x2={width - padding}
            y2={toY(0.5)}
            stroke="currentColor"
            strokeDasharray="2 2"
            className="text-slate-300 dark:text-slate-700"
          />
          {/* Neutral Vertical Axis (Valence = 0) */}
          <line
            x1={toX(0)}
            y1={padding}
            x2={toX(0)}
            y2={height - padding}
            stroke="currentColor"
            strokeDasharray="2 2"
            className="text-slate-300 dark:text-slate-700"
          />

          {/* Quadrant Soft Labels */}
          <text x={padding + 4} y={padding + 10} className="text-[9px] fill-slate-400 font-mono">
            High Arousal / Negative
          </text>
          <text x={width - padding - 4} y={padding + 10} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
            High Arousal / Positive
          </text>
          <text x={padding + 4} y={height - padding - 6} className="text-[9px] fill-slate-400 font-mono">
            Low Arousal / Negative
          </text>
          <text x={width - padding - 4} y={height - padding - 6} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
            Low Arousal / Positive
          </text>

          {/* Reference Emotion Anchors */}
          {Object.entries(EMOTION_COORDINATES).map(([em, coords]) => {
            const x = toX(coords.valence);
            const y = toY(coords.arousal);
            const isDominant = em === dominantEmotion;

            return (
              <g key={em} className="opacity-75">
                <circle
                  cx={x}
                  cy={y}
                  r={isDominant ? 4 : 2.5}
                  className={isDominant ? 'fill-indigo-600' : 'fill-slate-400 dark:fill-slate-600'}
                />
                <text
                  x={x}
                  y={y - 6}
                  textAnchor="middle"
                  className={`text-[8px] font-sans ${
                    isDominant ? 'font-bold fill-indigo-600 dark:fill-indigo-400' : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {coords.emoji} {em}
                </text>
              </g>
            );
          })}

          {/* Active Coordinate Crosshairs */}
          <line
            x1={markerX}
            y1={padding}
            x2={markerX}
            y2={height - padding}
            stroke="currentColor"
            className="text-indigo-400/40 dark:text-indigo-400/40"
            strokeWidth={1}
          />
          <line
            x1={padding}
            y1={markerY}
            x2={width - padding}
            y2={markerY}
            stroke="currentColor"
            className="text-indigo-400/40 dark:text-indigo-400/40"
            strokeWidth={1}
          />

          {/* Calculated Trajectory Pulse Circle */}
          <circle
            cx={markerX}
            cy={markerY}
            r={8}
            className="fill-indigo-500/20 stroke-indigo-600 dark:stroke-indigo-400 stroke-1 animate-ping"
          />
          <circle
            cx={markerX}
            cy={markerY}
            r={5}
            className="fill-indigo-600 stroke-white dark:stroke-slate-900 stroke-2 shadow-lg"
          />
        </svg>

        {/* Dynamic Coordinates Readout */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <span>Valence: {expectedValence >= 0 ? `+${expectedValence.toFixed(2)}` : expectedValence.toFixed(2)}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{dominantEmotion}</span>
          <span>Arousal: {expectedArousal.toFixed(2)}</span>
        </div>
      </div>
      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-1">
        Russell&apos;s Circumplex Model of Affect (Valence vs Arousal)
      </span>
    </div>
  );
};
