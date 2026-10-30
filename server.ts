import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { EmotixDatabase } from './server/database/database.js';
import { TextEmotionClassifier } from './server/ml/textEmotion.js';
import { ImageEmotionClassifier } from './server/ml/imageEmotion.js';
import { MultimodalEmotionFusion } from './server/ml/multimodal.js';
import { User } from './server/types.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'emotix_college_project_jwt_secret_2026';

// Setup upload directory
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration for images & voice recordings
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `upload_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.webm', '.wav', '.mp3', '.ogg', '.m4a'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type ${ext}. Allowed formats: JPG, PNG, WEBP, WEBM, WAV, MP3, OGG, M4A.`));
    }
  }
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/sample-assets', express.static(path.resolve(process.cwd(), 'src/assets/images')));

// Initialize Database on startup
await EmotixDatabase.init().catch(err => {
  console.error('Database initialization error:', err);
});

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const optionalAuth = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      const user = await EmotixDatabase.findUserById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch {
      // Invalid/expired token - continue as guest
    }
  }
  next();
};

const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const user = await EmotixDatabase.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User session not found. Please log in again.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
  }
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Access forbidden. Administrator privileges required.' });
  }
  next();
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const newUser = await EmotixDatabase.createUser(name, email, password, 'USER');
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      token,
      user: newUser
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Registration failed.' });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const userWithHash = await EmotixDatabase.findUserByEmail(email);
    if (!userWithHash) {
      return res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, userWithHash.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
    }

    const user: User = {
      id: userWithHash.id,
      name: userWithHash.name,
      email: userWithHash.email,
      role: userWithHash.role,
      avatar_url: userWithHash.avatar_url,
      created_at: userWithHash.created_at
    };

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      token,
      user
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'An error occurred during authentication.' });
  }
});

// Current User Profile
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

// Update Profile
app.put('/api/auth/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
    }

    const updated = await EmotixDatabase.updateUserProfile(req.user!.id, name);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

app.get('/api/admin/stats', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const adminStats = await EmotixDatabase.getAdminStats();
    res.json({ success: true, stats: adminStats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve admin telemetry.' });
  }
});

app.get('/api/admin/users', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await EmotixDatabase.getAllUsers();
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve users.' });
  }
});

// ==========================================
// EMOTION ANALYSIS ENDPOINTS
// ==========================================

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    project: 'EMOTIX',
    title: 'Multimodal Emotion Detection & Analysis System',
    version: '2.0.0',
    models: {
      text_nlp: 'TF-IDF + Softmax Multinomial Classifier',
      vision_cv: 'Pixel YCbCr Skin Chrominance + Action Unit Geometry',
      voice_nlp: 'Speech-to-Text Transcription & Lexical Sentiment Pipeline',
      multimodal_fusion: 'Late Decision Probability Vector Fusion (Weighted Convex Combination)'
    },
    database: 'SQLite 3 (Persistent)'
  });
});

// 1. Text Emotion Analysis
app.post('/api/analyze/text', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide non-empty text for emotion analysis.'
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text input exceeds maximum limit of 5,000 characters.'
      });
    }

    const nlpResult = TextEmotionClassifier.classify(text);

    // Save record to SQLite linked to authenticated user
    const savedRecord = await EmotixDatabase.insertAnalysis({
      user_id: req.user?.id || null,
      input_type: 'text',
      text_input: text.trim(),
      emotion: nlpResult.emotion,
      confidence: nlpResult.confidence,
      probabilities: nlpResult.probabilities,
      face_count: 0,
      notes: `NLP processed ${nlpResult.text_statistics.word_count} words (${nlpResult.text_statistics.salient_tokens.length} salient tokens)`
    });

    return res.json({
      success: true,
      id: savedRecord.id,
      user_id: savedRecord.user_id,
      input_type: 'text',
      text: text.trim(),
      emotion: nlpResult.emotion,
      confidence: nlpResult.confidence,
      probabilities: nlpResult.probabilities,
      processed_tokens: nlpResult.processed_tokens,
      text_statistics: nlpResult.text_statistics,
      created_at: savedRecord.created_at
    });
  } catch (err: any) {
    console.error('Error in /api/analyze/text:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing text analysis.'
    });
  }
});

// 2. Image Emotion Analysis (Multipart or Webcam Frame)
app.post('/api/analyze/image', optionalAuth, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    let filePath: string | undefined;
    let fileName: string | undefined;

    if (req.file) {
      filePath = req.file.path;
      fileName = req.file.filename;
    } else if (req.body.webcam_image) {
      // Decode base64 webcam data URL to actual image file on disk
      const matches = req.body.webcam_image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = '.' + matches[1].replace('jpeg', 'jpg');
        const buffer = Buffer.from(matches[2], 'base64');
        fileName = `webcam_${Date.now()}${ext}`;
        filePath = path.join(UPLOADS_DIR, fileName);
        fs.writeFileSync(filePath, buffer);
      }
    } else if (req.body.sample_image) {
      const samplePath = path.resolve(process.cwd(), 'src/assets/images', req.body.sample_image);
      if (fs.existsSync(samplePath)) {
        filePath = samplePath;
        fileName = req.body.sample_image;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded. Please upload a JPG, PNG, or WEBP image or capture via webcam.'
      });
    }

    // Run genuine pixel CV pipeline (no filename tricks)
    const result = await ImageEmotionClassifier.analyzeImage(filePath);

    // Save record to SQLite linked to user
    const savedRecord = await EmotixDatabase.insertAnalysis({
      user_id: req.user?.id || null,
      input_type: 'image',
      image_filename: fileName || 'uploaded_image.jpg',
      emotion: result.emotion,
      confidence: result.confidence,
      probabilities: result.probabilities,
      face_count: result.face_count,
      faces_data: result.faces,
      notes: result.face_count > 0 ? `Detected ${result.face_count} face(s) via skin chrominance & AU features` : 'No face detected in frame'
    });

    return res.json({
      success: true,
      id: savedRecord.id,
      user_id: savedRecord.user_id,
      input_type: 'image',
      image_filename: fileName,
      face_count: result.face_count,
      emotion: result.emotion,
      confidence: result.confidence,
      probabilities: result.probabilities,
      faces: result.faces,
      created_at: savedRecord.created_at
    });
  } catch (err: any) {
    console.error('Error in /api/analyze/image:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An error occurred during facial expression recognition.'
    });
  }
});

// 3. Voice-to-Text Emotion Analysis
app.post('/api/analyze/voice', optionalAuth, upload.single('audio'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transcript = (req.body.transcript || '').trim();
    let audioFilename: string | undefined;

    if (req.file) {
      audioFilename = req.file.filename;
    }

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Speech transcript is required. Please speak clearly into the microphone or enter transcript.'
      });
    }

    // Run text emotion model on transcript
    const nlpResult = TextEmotionClassifier.classify(transcript);

    // Save record to SQLite
    const savedRecord = await EmotixDatabase.insertAnalysis({
      user_id: req.user?.id || null,
      input_type: 'voice',
      voice_filename: audioFilename || null,
      transcript,
      emotion: nlpResult.emotion,
      confidence: nlpResult.confidence,
      probabilities: nlpResult.probabilities,
      face_count: 0,
      notes: `Voice-to-Text transcript analyzed (${nlpResult.text_statistics.word_count} words)`
    });

    return res.json({
      success: true,
      id: savedRecord.id,
      user_id: savedRecord.user_id,
      input_type: 'voice',
      transcript,
      voice_filename: audioFilename,
      emotion: nlpResult.emotion,
      confidence: nlpResult.confidence,
      probabilities: nlpResult.probabilities,
      text_statistics: nlpResult.text_statistics,
      created_at: savedRecord.created_at
    });
  } catch (err: any) {
    console.error('Error in /api/analyze/voice:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error occurred while analyzing voice recording transcript.'
    });
  }
});

// 4. Multimodal Analysis (Text + Image + Voice)
app.post('/api/analyze/multimodal', optionalAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const text = req.body.text || '';
    const voiceTranscript = req.body.voice_transcript || '';

    let imagePath: string | undefined;
    let imageFilename: string | undefined;

    if (files?.image?.[0]) {
      imagePath = files.image[0].path;
      imageFilename = files.image[0].filename;
    } else if (req.body.sample_image) {
      const samplePath = path.resolve(process.cwd(), 'src/assets/images', req.body.sample_image);
      if (fs.existsSync(samplePath)) {
        imagePath = samplePath;
        imageFilename = req.body.sample_image;
      }
    }

    let voiceAudioPath: string | undefined;
    let voiceFilename: string | undefined;
    if (files?.audio?.[0]) {
      voiceAudioPath = files.audio[0].path;
      voiceFilename = files.audio[0].filename;
    }

    if (!text && !imagePath && !voiceTranscript) {
      return res.status(400).json({
        success: false,
        error: 'Multimodal analysis requires at least one modality (text, image, or voice transcript).'
      });
    }

    const textWeight = req.body.text_weight ? parseFloat(req.body.text_weight) : 0.4;
    const imageWeight = req.body.image_weight ? parseFloat(req.body.image_weight) : 0.4;
    const voiceWeight = req.body.voice_weight ? parseFloat(req.body.voice_weight) : 0.2;

    const fusionResult = await MultimodalEmotionFusion.analyze({
      text,
      imageFilePath: imagePath,
      voiceTranscript,
      voiceAudioPath,
      textWeight,
      imageWeight,
      voiceWeight
    });

    // Save record to SQLite
    const savedRecord = await EmotixDatabase.insertAnalysis({
      user_id: req.user?.id || null,
      input_type: 'multimodal',
      text_input: text || null,
      image_filename: imageFilename || null,
      voice_filename: voiceFilename || null,
      transcript: voiceTranscript || null,
      emotion: fusionResult.emotion,
      confidence: fusionResult.confidence,
      probabilities: fusionResult.probabilities,
      face_count: fusionResult.image_result?.face_count || 0,
      faces_data: fusionResult.image_result?.faces || null,
      notes: fusionResult.fusion.explanation
    });

    return res.json({
      success: true,
      id: savedRecord.id,
      user_id: savedRecord.user_id,
      input_type: 'multimodal',
      text_input: text,
      image_filename: imageFilename,
      voice_filename: voiceFilename,
      transcript: voiceTranscript,
      modalities_used: fusionResult.modalities_used,
      text_result: fusionResult.text_result,
      image_result: fusionResult.image_result,
      voice_result: fusionResult.voice_result,
      fusion: fusionResult.fusion,
      emotion: fusionResult.emotion,
      confidence: fusionResult.confidence,
      probabilities: fusionResult.probabilities,
      created_at: savedRecord.created_at
    });
  } catch (err: any) {
    console.error('Error in /api/analyze/multimodal:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error occurred during multimodal emotion fusion.'
    });
  }
});

// 5. History Endpoints (User-Specific with Admin Access)
app.get('/api/history', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isAll = req.query.all === 'true' && req.user?.role === 'ADMIN';
    const userId = isAll ? undefined : (req.user ? req.user.id : undefined);

    const history = await EmotixDatabase.getHistory(userId, 300);
    res.json({
      success: true,
      total: history.length,
      history
    });
  } catch (err: any) {
    console.error('Error in /api/history:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve analysis history.' });
  }
});

app.get('/api/history/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid analysis ID.' });
    }
    const record = await EmotixDatabase.getAnalysisById(id, req.user?.id, req.user?.role);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Analysis record not found.' });
    }
    res.json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch record details.' });
  }
});

app.delete('/api/history', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await EmotixDatabase.clearHistory(req.user?.id, req.user?.role);
    res.json({ success, message: 'Analysis history cleared successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to clear history.' });
  }
});

app.delete('/api/history/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid analysis ID.' });
    }
    const success = await EmotixDatabase.deleteAnalysis(id, req.user?.id, req.user?.role);
    res.json({ success, message: 'Analysis record deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete record.' });
  }
});

// 6. Dashboard Endpoint
app.get('/api/dashboard', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isAll = req.query.all === 'true' && req.user?.role === 'ADMIN';
    const userId = isAll ? undefined : (req.user ? req.user.id : undefined);

    const stats = await EmotixDatabase.getDashboardStats(userId);
    res.json({
      success: true,
      stats
    });
  } catch (err: any) {
    console.error('Error in /api/dashboard:', err);
    res.status(500).json({ success: false, error: 'Failed to generate dashboard statistics.' });
  }
});

// 7. Demo Data Seeding
app.post('/api/demo-data', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await EmotixDatabase.loadDemoData(req.user?.id || 1);
    res.json({ success: true, message: 'Sample viva demo data successfully loaded into SQLite database.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to load demo data.' });
  }
});

// ==========================================
// VITE CLIENT MOUNTING
// ==========================================
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(process.cwd(), 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[EMOTIX SERVER] Running on http://localhost:${PORT}`);
});
