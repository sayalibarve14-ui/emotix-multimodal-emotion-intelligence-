import { EmotionType, EmotionProbabilities, DetectedFace } from '../types.js';
import { EMOTIONS, TextEmotionClassifier } from './textEmotion.js';
import { ImageEmotionClassifier } from './imageEmotion.js';

export interface ExtendedMultimodalParams {
  text?: string;
  imageFilePath?: string;
  voiceTranscript?: string;
  voiceAudioPath?: string;
  textWeight?: number;
  imageWeight?: number;
  voiceWeight?: number;
}

export interface ExtendedMultimodalResult {
  modalities_used: ('text' | 'image' | 'voice')[];
  text_result?: {
    emotion: EmotionType;
    confidence: number;
    probabilities: EmotionProbabilities;
  };
  image_result?: {
    emotion: EmotionType;
    confidence: number;
    probabilities: EmotionProbabilities;
    face_count: number;
    faces: DetectedFace[];
  };
  voice_result?: {
    emotion: EmotionType;
    confidence: number;
    probabilities: EmotionProbabilities;
    transcript: string;
  };
  fusion: {
    weights: {
      text: number;
      image: number;
      voice: number;
    };
    algorithm: string;
    concordance: 'consistent' | 'differ';
    explanation: string;
  };
  emotion: EmotionType;
  confidence: number;
  probabilities: EmotionProbabilities;
}

export class MultimodalEmotionFusion {
  /**
   * Fuse text, image facial expressions, and voice transcripts using late probability decision fusion
   */
  public static async analyze(params: ExtendedMultimodalParams): Promise<ExtendedMultimodalResult> {
    const modalitiesUsed: ('text' | 'image' | 'voice')[] = [];

    let textRes: { emotion: EmotionType; confidence: number; probabilities: EmotionProbabilities } | undefined;
    let imageRes:
      | {
          face_count: number;
          emotion: EmotionType;
          confidence: number;
          probabilities: EmotionProbabilities;
          faces: DetectedFace[];
        }
      | undefined;
    let voiceRes:
      | {
          emotion: EmotionType;
          confidence: number;
          probabilities: EmotionProbabilities;
          transcript: string;
        }
      | undefined;

    // 1. Text Modality
    const rawText = (params.text || '').trim();
    if (rawText.length > 0) {
      modalitiesUsed.push('text');
      const nlp = TextEmotionClassifier.classify(rawText);
      textRes = {
        emotion: nlp.emotion,
        confidence: nlp.confidence,
        probabilities: nlp.probabilities
      };
    }

    // 2. Image Modality
    if (params.imageFilePath) {
      modalitiesUsed.push('image');
      imageRes = await ImageEmotionClassifier.analyzeImage(params.imageFilePath);
    }

    // 3. Voice Modality (Speech-to-Text Transcript)
    const voiceText = (params.voiceTranscript || '').trim();
    if (voiceText.length > 0) {
      modalitiesUsed.push('voice');
      const voiceNlp = TextEmotionClassifier.classify(voiceText);
      voiceRes = {
        emotion: voiceNlp.emotion,
        confidence: voiceNlp.confidence,
        probabilities: voiceNlp.probabilities,
        transcript: voiceText
      };
    }

    if (modalitiesUsed.length === 0) {
      throw new Error('Please provide at least one valid modality (text, image, or voice recording).');
    }

    // Determine normalized weights for active modalities
    const rawTextWeight = typeof params.textWeight === 'number' ? params.textWeight : 0.4;
    const rawImageWeight = typeof params.imageWeight === 'number' ? params.imageWeight : 0.4;
    const rawVoiceWeight = typeof params.voiceWeight === 'number' ? params.voiceWeight : 0.2;

    let totalWeight = 0;
    if (textRes) totalWeight += rawTextWeight;
    if (imageRes) totalWeight += rawImageWeight;
    if (voiceRes) totalWeight += rawVoiceWeight;

    if (totalWeight <= 0) totalWeight = 1.0;

    const normTextW = textRes ? rawTextWeight / totalWeight : 0;
    const normImageW = imageRes ? rawImageWeight / totalWeight : 0;
    const normVoiceW = voiceRes ? rawVoiceWeight / totalWeight : 0;

    // Weighted Convex Decision Combination
    const fusedProbabilities: EmotionProbabilities = {
      Happy: 0,
      Sad: 0,
      Angry: 0,
      Fear: 0,
      Surprise: 0,
      Disgust: 0,
      Neutral: 0
    };

    let highestEmotion: EmotionType = 'Neutral';
    let maxProbability = -1;

    for (const em of EMOTIONS) {
      let combinedProb = 0;
      if (textRes) combinedProb += normTextW * (textRes.probabilities[em] || 0);
      if (imageRes) combinedProb += normImageW * (imageRes.probabilities[em] || 0);
      if (voiceRes) combinedProb += normVoiceW * (voiceRes.probabilities[em] || 0);

      const rounded = Number(combinedProb.toFixed(3));
      fusedProbabilities[em] = rounded;

      if (rounded > maxProbability) {
        maxProbability = rounded;
        highestEmotion = em;
      }
    }

    // Ensure sum is 1.000
    const currentSum = Object.values(fusedProbabilities).reduce((a, b) => a + b, 0);
    const diff = Number((1.0 - currentSum).toFixed(3));
    fusedProbabilities[highestEmotion] = Number((fusedProbabilities[highestEmotion] + diff).toFixed(3));

    // Concordance Analysis
    const detectedEmotions: EmotionType[] = [];
    if (textRes) detectedEmotions.push(textRes.emotion);
    if (imageRes && imageRes.face_count > 0) detectedEmotions.push(imageRes.emotion);
    if (voiceRes) detectedEmotions.push(voiceRes.emotion);

    const isConsistent =
      detectedEmotions.length > 1 && detectedEmotions.every(em => em === detectedEmotions[0]);
    const concordance: 'consistent' | 'differ' = isConsistent ? 'consistent' : 'differ';

    // Human-readable explanation
    const parts: string[] = [];
    if (textRes) parts.push(`Text (${textRes.emotion} @ ${(textRes.confidence * 100).toFixed(0)}%, weight ${(normTextW * 100).toFixed(0)}%)`);
    if (imageRes) parts.push(`Vision (${imageRes.emotion} @ ${(imageRes.confidence * 100).toFixed(0)}%, weight ${(normImageW * 100).toFixed(0)}%)`);
    if (voiceRes) parts.push(`Voice (${voiceRes.emotion} @ ${(voiceRes.confidence * 100).toFixed(0)}%, weight ${(normVoiceW * 100).toFixed(0)}%)`);

    const explanation = isConsistent
      ? `All active modalities (${parts.join(', ')}) demonstrated concordant affective cues. Late linear combination resolved to dominant class '${highestEmotion}' with ${(fusedProbabilities[highestEmotion] * 100).toFixed(1)}% final confidence.`
      : `Modalities exhibited divergent emotional signals (${parts.join(', ')}). The decision fusion weighted average synthesized the combined vector, prioritizing dominant modality support to produce '${highestEmotion}' at ${(fusedProbabilities[highestEmotion] * 100).toFixed(1)}%.`;

    return {
      modalities_used: modalitiesUsed,
      text_result: textRes,
      image_result: imageRes,
      voice_result: voiceRes,
      fusion: {
        weights: {
          text: Number(normTextW.toFixed(2)),
          image: Number(normImageW.toFixed(2)),
          voice: Number(normVoiceW.toFixed(2))
        },
        algorithm: 'Late Decision Probability Vector Fusion (Weighted Convex Combination)',
        concordance,
        explanation
      },
      emotion: highestEmotion,
      confidence: fusedProbabilities[highestEmotion],
      probabilities: fusedProbabilities
    };
  }
}
