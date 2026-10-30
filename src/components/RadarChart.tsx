import React from 'react';
import { EmotionProbabilities, EmotionType } from '../types/index.js';

interface RadarChartProps {
  probabilities: EmotionProbabilities | Record<string, number>;
  highlightedEmotion?: EmotionType;
  size?: number;
}

const AXES: { key: EmotionType; label: string; angle: number }[] = [
  { key: 'Happy', label: 'Happy 😊', angle: -90 },
  { key: 'Surprise', label: 'Surprise 😲', angle: -38.57 },
  { key: 'Neutral', label: 'Neutral 😐', angle: 12.86 },
  { key: 'Disgust', label: 'Disgust 🤢', angle: 64.29 },
  { key: 'Angry', label: 'Angry 😠', angle: 115.71 },
  { key: 'Fear', label: 'Fear 😨', angle: 167.14 },
  { key: 'Sad', label: 'Sad 😢', angle: 218.57 }
];

export const RadarChart: React.FC<RadarChartProps> = ({
  probabilities,
  highlightedEmotion,
  size = 280
}) => {
  const center = size / 2;
  const radius = center - 42;

  // Grid levels (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (angleDeg: number, distance: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: center + distance * Math.cos(rad),
      y: center + distance * Math.sin(rad)
    };
  };

  // Compute polygon points for the current probabilities
  const dataPoints = AXES.map(axis => {
    const prob = probabilities[axis.key] || 0.02;
    // Scale probability: min 0.05 for visibility, capped at 1.0
    const scaledDistance = radius * Math.min(Math.max(prob, 0.06), 1.0);
    return getCoordinates(axis.angle, scaledDistance);
  });

  const polygonPath = dataPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible select-none">
          {/* Circular/Polygonal Grid Rings */}
          {gridLevels.map(level => {
            const levelPoints = AXES.map(axis => getCoordinates(axis.angle, radius * level));
            const path = levelPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`).join(' ') + ' Z';
            return (
              <path
                key={level}
                d={path}
                fill="none"
                stroke="currentColor"
                strokeDasharray={level < 1 ? '3 3' : 'none'}
                className="text-slate-200 dark:text-slate-800"
                strokeWidth={level === 1.0 ? 1.5 : 1}
              />
            );
          })}

          {/* Radial Spokes */}
          {AXES.map(axis => {
            const outer = getCoordinates(axis.angle, radius);
            return (
              <line
                key={axis.key}
                x1={center}
                y1={center}
                x2={outer.x}
                y2={outer.y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth={1}
              />
            );
          })}

          {/* Probability Polygon Fill & Stroke */}
          <path
            d={polygonPath}
            className="fill-indigo-500/25 stroke-indigo-600 dark:fill-indigo-400/20 dark:stroke-indigo-400 transition-all duration-500"
            strokeWidth={2}
          />

          {/* Data Vertex Dots */}
          {dataPoints.map((pt, i) => {
            const axis = AXES[i];
            const isTop = highlightedEmotion === axis.key;
            return (
              <g key={axis.key}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isTop ? 5 : 3.5}
                  className={
                    isTop
                      ? 'fill-indigo-600 stroke-white dark:stroke-slate-900 stroke-2'
                      : 'fill-slate-700 dark:fill-slate-300'
                  }
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          {AXES.map(axis => {
            const labelCoord = getCoordinates(axis.angle, radius + 22);
            const prob = probabilities[axis.key] || 0;
            const isTop = highlightedEmotion === axis.key;

            return (
              <text
                key={axis.key}
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor="middle"
                dominantBaseline="central"
                className={`text-[10px] font-sans transition-colors ${
                  isTop
                    ? 'font-bold fill-indigo-600 dark:fill-indigo-400'
                    : 'font-medium fill-slate-600 dark:fill-slate-400'
                }`}
              >
                {axis.key} ({(prob * 100).toFixed(0)}%)
              </text>
            );
          })}
        </svg>
      </div>
      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-1">
        7-Dimensional Affective Vector Footprint
      </div>
    </div>
  );
};
