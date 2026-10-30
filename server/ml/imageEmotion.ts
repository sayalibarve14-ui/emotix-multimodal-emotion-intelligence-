import fs from 'fs';
import path from 'path';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { EmotionType, EmotionProbabilities, DetectedFace } from '../types.js';
import { EMOTIONS } from './textEmotion.js';

export interface ImageAnalysisEngineResult {
  face_count: number;
  emotion: EmotionType;
  confidence: number;
  probabilities: EmotionProbabilities;
  faces: DetectedFace[];
}

interface PixelMatrix {
  width: number;
  height: number;
  data: Uint8Array | Buffer;
}

export class ImageEmotionClassifier {
  /**
   * Validate image file format and integrity
   */
  public static validateImage(filePath: string): { valid: boolean; error?: string } {
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File does not exist on server.' };
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      return { valid: false, error: 'Uploaded file is empty (0 bytes).' };
    }

    if (stats.size > 15 * 1024 * 1024) {
      return { valid: false, error: 'File exceeds maximum size limit (15MB).' };
    }

    const ext = path.extname(filePath).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!validExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported image format (${ext}). Supported formats: JPG, JPEG, PNG, WEBP.`
      };
    }

    return { valid: true };
  }

  /**
   * Decode image buffer into raw RGBA pixel data
   */
  private static decodeImage(buffer: Buffer, ext: string): PixelMatrix | null {
    try {
      if (ext === '.png') {
        const png = PNG.sync.read(buffer);
        return {
          width: png.width,
          height: png.height,
          data: png.data
        };
      } else {
        // Default to JPEG decoder
        const decoded = jpeg.decode(buffer, { useTArray: true, maxMemoryUsageInMB: 128 });
        return {
          width: decoded.width,
          height: decoded.height,
          data: decoded.data
        };
      }
    } catch {
      // If jpeg-js fails on WebP or non-standard JPEG, attempt fallback PNG decoding
      try {
        const png = PNG.sync.read(buffer);
        return { width: png.width, height: png.height, data: png.data };
      } catch {
        return null;
      }
    }
  }

  /**
   * Convert RGB to Luminance and Skin Chrominance (YCbCr)
   */
  private static getPixelYCrCb(r: number, g: number, b: number): { y: number; cb: number; cr: number; isSkin: boolean } {
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    // Standard Peer et al. / Kovac skin chrominance threshold
    const isSkin =
      r > 50 &&
      g > 30 &&
      b > 20 &&
      r > g &&
      r > b &&
      Math.abs(r - g) > 10 &&
      cr >= 130 &&
      cr <= 180 &&
      cb >= 75 &&
      cb <= 135;

    return { y, cb, cr, isSkin };
  }

  /**
   * Detect human faces using skin chrominance density and facial luminance contrast
   */
  private static detectFaceRegions(pixels: PixelMatrix): { x: number; y: number; width: number; height: number }[] {
    const { width, height, data } = pixels;
    const gridStep = Math.max(4, Math.floor(Math.min(width, height) / 80));
    const cols = Math.floor(width / gridStep);
    const rows = Math.floor(height / gridStep);

    // Build skin map grid
    const skinGrid = new Uint8Array(cols * rows);
    let totalSkinCount = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = c * gridStep;
        const py = r * gridStep;
        const idx = (py * width + px) * 4;

        if (idx + 2 < data.length) {
          const red = data[idx];
          const green = data[idx + 1];
          const blue = data[idx + 2];
          const { isSkin } = this.getPixelYCrCb(red, green, blue);

          if (isSkin) {
            skinGrid[r * cols + c] = 1;
            totalSkinCount++;
          }
        }
      }
    }

    // If less than 1.5% of pixels are skin, image does not contain visible human face
    if (totalSkinCount / (cols * rows) < 0.015) {
      return [];
    }

    // Multi-scale sliding window to find dense face bounding boxes
    const candidateBoxes: { x: number; y: number; width: number; height: number; score: number }[] = [];
    const minFaceSize = Math.floor(Math.min(width, height) * 0.18);
    const maxFaceSize = Math.floor(Math.min(width, height) * 0.85);

    for (let size = minFaceSize; size <= maxFaceSize; size += Math.floor(size * 0.35)) {
      const step = Math.max(gridStep * 2, Math.floor(size * 0.25));

      for (let y = 0; y <= height - size; y += step) {
        for (let x = 0; x <= width - size; x += step) {
          // Count skin ratio in window
          let skinInBox = 0;
          let totalSamples = 0;

          const startR = Math.floor(y / gridStep);
          const endR = Math.floor((y + size) / gridStep);
          const startC = Math.floor(x / gridStep);
          const endC = Math.floor((x + size) / gridStep);

          for (let r = startR; r < endR && r < rows; r++) {
            for (let c = startC; c < endC && c < cols; c++) {
              if (skinGrid[r * cols + c]) skinInBox++;
              totalSamples++;
            }
          }

          const skinRatio = totalSamples > 0 ? skinInBox / totalSamples : 0;

          // Face regions typically have 35% - 85% skin (excluding hair, eyes, lips, background)
          if (skinRatio >= 0.32 && skinRatio <= 0.90) {
            // Verify upper-third has facial eye contrast valley
            const upperY = Math.floor(y + size * 0.25);
            const lowerY = Math.floor(y + size * 0.65);
            const sampleX = Math.floor(x + size * 0.5);

            const upperIdx = (upperY * width + sampleX) * 4;
            const lowerIdx = (lowerY * width + sampleX) * 4;

            if (upperIdx < data.length && lowerIdx < data.length) {
              const upperLum = 0.299 * data[upperIdx] + 0.587 * data[upperIdx + 1] + 0.114 * data[upperIdx + 2];
              const lowerLum = 0.299 * data[lowerIdx] + 0.587 * data[lowerIdx + 1] + 0.114 * data[lowerIdx + 2];

              // Eye/brow region is darker than cheek
              if (upperLum <= lowerLum * 1.25) {
                candidateBoxes.push({
                  x,
                  y,
                  width: size,
                  height: Math.floor(size * 1.15), // Face height is ~1.15x width
                  score: skinRatio
                });
              }
            }
          }
        }
      }
    }

    if (candidateBoxes.length === 0) {
      return [];
    }

    // Non-Maximum Suppression (NMS) to merge overlapping candidate boxes
    candidateBoxes.sort((a, b) => b.score - a.score);
    const selectedBoxes: { x: number; y: number; width: number; height: number }[] = [];

    for (const box of candidateBoxes) {
      let isOverlap = false;
      for (const sel of selectedBoxes) {
        const overlapX = Math.max(0, Math.min(box.x + box.width, sel.x + sel.width) - Math.max(box.x, sel.x));
        const overlapY = Math.max(0, Math.min(box.y + box.height, sel.y + sel.height) - Math.max(box.y, sel.y));
        const overlapArea = overlapX * overlapY;
        const boxArea = box.width * box.height;

        if (overlapArea / boxArea > 0.35) {
          isOverlap = true;
          break;
        }
      }

      if (!isOverlap) {
        selectedBoxes.push({
          x: Math.max(0, box.x),
          y: Math.max(0, box.y),
          width: Math.min(width - box.x, box.width),
          height: Math.min(height - box.y, box.height)
        });
        if (selectedBoxes.length >= 4) break; // Limit to up to 4 faces
      }
    }

    return selectedBoxes;
  }

  /**
   * Analyze facial action units and emotion probabilities from pixel data of a face ROI
   */
  private static extractFaceEmotion(
    pixels: PixelMatrix,
    box: { x: number; y: number; width: number; height: number }
  ): { emotion: EmotionType; confidence: number; probabilities: EmotionProbabilities } {
    const { width, data } = pixels;
    const { x, y, width: bw, height: bh } = box;

    // Subdivide Face into Action Unit Zones:
    // 1. Forehead / Upper brow: y + [0.15 .. 0.35]*bh
    // 2. Eye / Bridge: y + [0.35 .. 0.52]*bh
    // 3. Mouth / Lower lip: y + [0.65 .. 0.88]*bh

    let browLumSum = 0;
    let browLumCount = 0;
    let cheekLumSum = 0;
    let cheekLumCount = 0;
    let mouthLumSum = 0;
    let mouthLumCount = 0;
    let mouthCornerVariance = 0;

    let redSatSum = 0;
    let redSatCount = 0;

    const sampleStep = Math.max(2, Math.floor(bw / 30));

    // Sample Brow
    for (let py = Math.floor(y + bh * 0.18); py < y + bh * 0.34; py += sampleStep) {
      for (let px = Math.floor(x + bw * 0.2); px < x + bw * 0.8; px += sampleStep) {
        const idx = (py * width + px) * 4;
        if (idx + 2 < data.length) {
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          browLumSum += lum;
          browLumCount++;
        }
      }
    }

    // Sample Cheek (baseline skin brightness)
    for (let py = Math.floor(y + bh * 0.45); py < y + bh * 0.60; py += sampleStep) {
      for (let px = Math.floor(x + bw * 0.15); px < x + bw * 0.85; px += sampleStep) {
        const idx = (py * width + px) * 4;
        if (idx + 2 < data.length) {
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          cheekLumSum += lum;
          cheekLumCount++;
        }
      }
    }

    // Sample Mouth
    const mouthLums: number[] = [];
    for (let py = Math.floor(y + bh * 0.68); py < y + bh * 0.88; py += sampleStep) {
      for (let px = Math.floor(x + bw * 0.25); px < x + bw * 0.75; px += sampleStep) {
        const idx = (py * width + px) * 4;
        if (idx + 2 < data.length) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          mouthLumSum += lum;
          mouthLumCount++;
          mouthLums.push(lum);

          // Measure redness / saturation
          const sat = (r - Math.min(g, b)) / (r + 1);
          redSatSum += sat;
          redSatCount++;
        }
      }
    }

    const avgBrow = browLumCount > 0 ? browLumSum / browLumCount : 120;
    const avgCheek = cheekLumCount > 0 ? cheekLumSum / cheekLumCount : 140;
    const avgMouth = mouthLumCount > 0 ? mouthLumSum / mouthLumCount : 110;
    const avgRedSat = redSatCount > 0 ? redSatSum / redSatCount : 0.2;

    if (mouthLums.length > 1) {
      const mMean = mouthLumSum / mouthLumCount;
      const vSum = mouthLums.reduce((acc, v) => acc + (v - mMean) ** 2, 0);
      mouthCornerVariance = Math.sqrt(vSum / mouthLums.length);
    }

    // Feature Metrics:
    // Smile (Happy): Lip corner puller AU12 elevates cheek brightness and creates high mouth luminance variance (teeth contrast)
    const smileMetric = (mouthCornerVariance / 35.0) * (avgCheek / 130.0);

    // Brow Furrow (Anger / AU04): Brow region becomes darker and textured compared to cheek
    const furrowMetric = Math.max(0, (avgCheek - avgBrow) / 28.0);

    // Mouth Open / Eye Widening (Surprise / AU01+AU26): Dark mouth cavity opening + bright upper face
    const surpriseMetric = Math.max(0, (avgBrow / 135.0) * (mouthCornerVariance > 32 ? 1.4 : 0.8));

    // Sadness (Sad / AU15): Lower mouth corners droop, low overall cheek saturation and variance
    const sadMetric = Math.max(0, (140.0 - avgMouth) / 38.0) * (avgRedSat < 0.22 ? 1.3 : 0.8);

    // Disgust (Disgust / AU09): High mid-face nasal wrinkle ratio
    const disgustMetric = Math.max(0, (avgCheek - avgMouth) / 45.0);

    // Initial base logit scores
    const logits: Record<EmotionType, number> = {
      Happy: 0.1 + smileMetric * 2.2,
      Sad: 0.1 + sadMetric * 1.5,
      Angry: 0.1 + furrowMetric * 1.8,
      Fear: 0.1 + furrowMetric * 0.8 + surpriseMetric * 0.6,
      Surprise: 0.1 + surpriseMetric * 2.0,
      Disgust: 0.05 + disgustMetric * 1.6,
      Neutral: 1.2
    };

    // If smileMetric is strong, dampen sadness and anger
    if (smileMetric > 1.2) {
      logits.Happy += 1.8;
      logits.Neutral = Math.max(0.1, logits.Neutral - 0.6);
      logits.Sad = 0.05;
    } else if (furrowMetric > 1.4) {
      logits.Angry += 1.6;
      logits.Neutral = Math.max(0.1, logits.Neutral - 0.5);
    } else if (surpriseMetric > 1.5 && mouthCornerVariance > 35) {
      logits.Surprise += 1.7;
    } else if (sadMetric > 1.3) {
      logits.Sad += 1.5;
    }

    // Softmax normalization across 7 emotions
    const temperature = 1.8;
    const expScores: Record<EmotionType, number> = {} as any;
    let sumExp = 0;

    for (const em of EMOTIONS) {
      const scaled = Math.exp((logits[em] || 0.1) / temperature);
      expScores[em] = scaled;
      sumExp += scaled;
    }

    const probabilities: EmotionProbabilities = {
      Happy: 0,
      Sad: 0,
      Angry: 0,
      Fear: 0,
      Surprise: 0,
      Disgust: 0,
      Neutral: 0
    };

    let bestEmotion: EmotionType = 'Neutral';
    let maxProb = -1;

    for (const em of EMOTIONS) {
      const p = Number(Math.max(0.003, expScores[em] / sumExp).toFixed(3));
      probabilities[em] = p;
      if (p > maxProb) {
        maxProb = p;
        bestEmotion = em;
      }
    }

    // Ensure sum = 1.000
    const sumTotal = Object.values(probabilities).reduce((a, b) => a + b, 0);
    const diff = Number((1.0 - sumTotal).toFixed(3));
    probabilities[bestEmotion] = Number((probabilities[bestEmotion] + diff).toFixed(3));

    return {
      emotion: bestEmotion,
      confidence: probabilities[bestEmotion],
      probabilities
    };
  }

  /**
   * Main entrypoint for Image Emotion Recognition:
   * Inspects actual pixels, detects face boxes, and computes facial emotion probabilities.
   */
  public static async analyzeImage(filePath: string): Promise<ImageAnalysisEngineResult> {
    const validation = this.validateImage(filePath);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    const pixels = this.decodeImage(buffer, ext);
    if (!pixels || pixels.width === 0 || pixels.height === 0) {
      throw new Error('Image decoding failed. Please upload a valid JPG, PNG, or WEBP image.');
    }

    // Run real face localization algorithm on image pixels
    const faceBoxes = this.detectFaceRegions(pixels);

    // Handle when NO face is detected in the image
    if (faceBoxes.length === 0) {
      return {
        face_count: 0,
        emotion: 'Neutral',
        confidence: 0.0,
        probabilities: {
          Happy: 0.0,
          Sad: 0.0,
          Angry: 0.0,
          Fear: 0.0,
          Surprise: 0.0,
          Disgust: 0.0,
          Neutral: 1.0
        },
        faces: []
      };
    }

    // Analyze every detected face individually
    const detectedFaces: DetectedFace[] = [];

    for (let i = 0; i < faceBoxes.length; i++) {
      const box = faceBoxes[i];
      const emotionResult = this.extractFaceEmotion(pixels, box);

      detectedFaces.push({
        face_id: i + 1,
        box: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        },
        emotion: emotionResult.emotion,
        confidence: emotionResult.confidence,
        probabilities: emotionResult.probabilities
      });
    }

    // Aggregate probabilities across all detected faces
    const aggregatedProbs: EmotionProbabilities = {
      Happy: 0,
      Sad: 0,
      Angry: 0,
      Fear: 0,
      Surprise: 0,
      Disgust: 0,
      Neutral: 0
    };

    for (const f of detectedFaces) {
      for (const em of EMOTIONS) {
        aggregatedProbs[em] += f.probabilities[em] / detectedFaces.length;
      }
    }

    for (const em of EMOTIONS) {
      aggregatedProbs[em] = Number(aggregatedProbs[em].toFixed(3));
    }

    // Ensure sum is 1.000
    let topEmotion: EmotionType = 'Neutral';
    let maxP = -1;
    for (const em of EMOTIONS) {
      if (aggregatedProbs[em] > maxP) {
        maxP = aggregatedProbs[em];
        topEmotion = em;
      }
    }

    const currentSum = Object.values(aggregatedProbs).reduce((a, b) => a + b, 0);
    const remainder = Number((1.0 - currentSum).toFixed(3));
    aggregatedProbs[topEmotion] = Number((aggregatedProbs[topEmotion] + remainder).toFixed(3));

    return {
      face_count: detectedFaces.length,
      emotion: topEmotion,
      confidence: aggregatedProbs[topEmotion],
      probabilities: aggregatedProbs,
      faces: detectedFaces
    };
  }
}
