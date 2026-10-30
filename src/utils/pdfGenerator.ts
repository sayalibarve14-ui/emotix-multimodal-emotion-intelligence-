import { jsPDF } from 'jspdf';
import { TextAnalysisResult, ImageAnalysisResult, MultimodalResult, AnalysisRecord } from '../types/index.js';

export class ReportGenerator {
  public static generatePdf(data: {
    title: string;
    analysisType: 'Text Analysis' | 'Image Analysis' | 'Multimodal Analysis';
    createdAt: string;
    detectedEmotion: string;
    confidence: number;
    probabilities: Record<string, number>;
    textInput?: string;
    imageFilename?: string;
    faceCount?: number;
    faces?: any[];
    textResult?: any;
    imageResult?: any;
    fusion?: any;
  }): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header Background
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title & Branding
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('EMOTIX', 14, 18);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // Slate-300
    doc.text('Multimodal Emotion Intelligence — Analysis Report', 14, 26);
    doc.setFontSize(9);
    doc.text('BSc Computer Science Academic Research Project', 14, 33);

    y = 52;

    // Report Metadata Table Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 30, 3, 3, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ANALYSIS TYPE', 20, y + 10);
    doc.text('DATE & TIME (UTC)', 80, y + 10);
    doc.text('DOMINANT PREDICTION', 145, y + 10);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(data.analysisType, 20, y + 20);
    doc.text(new Date(data.createdAt).toLocaleString(), 80, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text(`${data.detectedEmotion} (${(data.confidence * 100).toFixed(1)}%)`, 145, y + 20);

    y += 42;

    // Section 1: Input Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. Input Data Summary', 14, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    if (data.textInput) {
      doc.text(`Text Content: "${data.textInput.length > 95 ? data.textInput.substring(0, 95) + '...' : data.textInput}"`, 16, y);
      y += 6;
      doc.text(`Length: ${data.textInput.length} characters`, 16, y);
      y += 8;
    }

    if (data.imageFilename) {
      doc.text(`Referenced Image File: ${data.imageFilename}`, 16, y);
      y += 6;
    }

    if (typeof data.faceCount === 'number') {
      doc.text(`Total Human Faces Detected: ${data.faceCount}`, 16, y);
      y += 8;
    }

    y += 4;

    // Section 2: Multimodal Decomposition (if applicable)
    if (data.analysisType === 'Multimodal Analysis' && data.textResult && data.imageResult) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('2. Modality Disaggregation & Fusion Mechanism', 14, y);
      y += 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      doc.text(`• Linguistic Modality (NLP): ${data.textResult.emotion} with ${(data.textResult.confidence * 100).toFixed(1)}% confidence`, 16, y);
      y += 5;
      doc.text(`• Visual Expression Modality (CV): ${data.imageResult.emotion} with ${(data.imageResult.confidence * 100).toFixed(1)}% confidence`, 16, y);
      y += 5;
      doc.text(`• Concordance Assessment: ${data.fusion?.concordance === 'consistent' ? 'Predictions are consistent (high agreement)' : 'Predictions differ (modality divergence)'}`, 16, y);
      y += 5;
      doc.text(`• Late Decision Weighting: ${(data.fusion?.text_weight * 100 || 50).toFixed(0)}% Text + ${(data.fusion?.image_weight * 100 || 50).toFixed(0)}% Image`, 16, y);
      y += 10;
    } else if (data.analysisType === 'Image Analysis' && data.faces && data.faces.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('2. Detected Faces Detailed Breakdown', 14, y);
      y += 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      data.faces.forEach((face: any, i: number) => {
        doc.text(`Face #${i + 1}: ${face.emotion} (${(face.confidence * 100).toFixed(1)}%) — Bounding Box: [x:${face.box.x}, y:${face.box.y}, w:${face.box.width}, h:${face.box.height}]`, 16, y);
        y += 5;
      });
      y += 5;
    }

    // Section 3: Probability Vector Distribution
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('3. Emotion Class Probability Distribution', 14, y);
    y += 8;

    const emotions = ['Happy', 'Sad', 'Angry', 'Fear', 'Surprise', 'Disgust', 'Neutral'];
    const maxBarWidth = 100;

    emotions.forEach(em => {
      const prob = data.probabilities[em] || 0;
      const barLen = Math.max(1, Math.round(prob * maxBarWidth));

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(em.padEnd(10, ' '), 16, y + 4);

      // Bar background
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(42, y, maxBarWidth, 6, 1, 1, 'F');

      // Filled bar
      doc.setFillColor(em === data.detectedEmotion ? 59 : 148, em === data.detectedEmotion ? 130 : 163, em === data.detectedEmotion ? 246 : 184);
      doc.roundedRect(42, y, barLen, 6, 1, 1, 'F');

      // Percentage text
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${(prob * 100).toFixed(1)}%`, 148, y + 4.5);

      y += 9;
    });

    y += 10;

    // Academic Notice / Privacy Footer
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Academic Notice: EMOTIX analyzes provided text and images for educational demonstration.',
      18,
      y + 7
    );
    doc.text(
      'Emotion predictions are AI-generated estimates and should not be treated as psychological or medical diagnoses.',
      18,
      y + 13
    );

    // Save PDF
    const filename = `EMOTIX_${data.analysisType.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    doc.save(filename);
  }
}
