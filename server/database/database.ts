import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  AnalysisRecord,
  DashboardStats,
  AdminStats,
  User,
  EmotionType,
  EmotionProbabilities,
  ActivityTrend
} from '../types.js';
import { EMOTIONS } from '../ml/textEmotion.js';

const DB_DIR = path.resolve(process.cwd(), 'database');
const DB_PATH = path.join(DB_DIR, 'emotix.sqlite');

export class EmotixDatabase {
  private static db: SqlJsDatabase | null = null;
  private static SQL: any = null;

  public static async init(): Promise<void> {
    if (this.db) return;

    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    this.SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      this.db = new this.SQL.Database(fileBuffer);
    } else {
      this.db = new this.SQL.Database();
    }

    if (this.db) {
      // 1. Users Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'USER',
          avatar_url TEXT,
          created_at TEXT NOT NULL
        );
      `);

      // 2. Analyses Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS analyses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          input_type TEXT NOT NULL,
          text_input TEXT,
          image_filename TEXT,
          voice_filename TEXT,
          transcript TEXT,
          emotion TEXT NOT NULL,
          confidence REAL NOT NULL,
          probabilities TEXT NOT NULL,
          face_count INTEGER DEFAULT 0,
          faces_data TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      // Safe migrations for existing databases
      try {
        this.db.run('ALTER TABLE analyses ADD COLUMN user_id INTEGER;');
      } catch {}
      try {
        this.db.run('ALTER TABLE analyses ADD COLUMN voice_filename TEXT;');
      } catch {}
      try {
        this.db.run('ALTER TABLE analyses ADD COLUMN transcript TEXT;');
      } catch {}

      // Seed Default Accounts if users table is empty
      const userCountRes = this.db.exec('SELECT COUNT(*) as count FROM users');
      const count = (userCountRes[0]?.values[0]?.[0] as number) || 0;

      if (count === 0) {
        await this.seedDefaultUsers();
      }
    }

    this.saveToDisk();
  }

  private static async seedDefaultUsers(): Promise<void> {
    if (!this.db) return;

    const adminHash = await bcrypt.hash('Admin@123', 10);
    const studentHash = await bcrypt.hash('Student@123', 10);
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES ($name, $email, $password_hash, $role, $created_at)
    `);

    // 1. Admin
    stmt.run({
      $name: 'EMOTIX Administrator',
      $email: 'admin@emotix.ai',
      $password_hash: adminHash,
      $role: 'ADMIN',
      $created_at: now
    });

    // 2. Student / Researcher
    stmt.run({
      $name: 'CS Student Researcher',
      $email: 'student@emotix.ai',
      $password_hash: studentHash,
      $role: 'USER',
      $created_at: now
    });

    stmt.free();
  }

  private static saveToDisk(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (err) {
      console.error('Failed to persist SQLite database to disk:', err);
    }
  }

  // ==========================================
  // USER AUTHENTICATION METHODS
  // ==========================================

  public static async createUser(name: string, email: string, password: string, role: 'USER' | 'ADMIN' = 'USER'): Promise<User> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const cleanEmail = email.trim().toLowerCase();
    const existing = await this.findUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES ($name, $email, $password_hash, $role, $created_at)
    `);

    stmt.run({
      $name: name.trim(),
      $email: cleanEmail,
      $password_hash: passwordHash,
      $role: role,
      $created_at: createdAt
    });
    stmt.free();

    const res = this.db.exec('SELECT last_insert_rowid() as id');
    const newId = res[0]?.values[0]?.[0] as number;

    this.saveToDisk();

    return {
      id: newId,
      name: name.trim(),
      email: cleanEmail,
      role,
      created_at: createdAt
    };
  }

  public static async findUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
    await this.init();
    if (!this.db) return null;

    const stmt = this.db.prepare('SELECT id, name, email, password_hash, role, avatar_url, created_at FROM users WHERE email = $email');
    stmt.bind({ $email: email.trim().toLowerCase() });

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row as any;
    }

    stmt.free();
    return null;
  }

  public static async findUserById(id: number): Promise<User | null> {
    await this.init();
    if (!this.db) return null;

    const stmt = this.db.prepare('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $id');
    stmt.bind({ $id: id });

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row as any;
    }

    stmt.free();
    return null;
  }

  public static async getAllUsers(): Promise<User[]> {
    await this.init();
    if (!this.db) return [];

    const res = this.db.exec('SELECT id, name, email, role, avatar_url, created_at FROM users ORDER BY id ASC');
    if (!res.length || !res[0].values) return [];

    const cols = res[0].columns;
    return res[0].values.map(row => {
      const u: any = {};
      cols.forEach((col, idx) => {
        u[col] = row[idx];
      });
      return u as User;
    });
  }

  public static async updateUserProfile(id: number, name: string): Promise<User | null> {
    await this.init();
    if (!this.db) return null;

    const stmt = this.db.prepare('UPDATE users SET name = $name WHERE id = $id');
    stmt.run({ $name: name.trim(), $id: id });
    stmt.free();

    this.saveToDisk();
    return this.findUserById(id);
  }

  // ==========================================
  // ANALYSIS METHODS (USER-SPECIFIC)
  // ==========================================

  public static async insertAnalysis(params: {
    user_id?: number | null;
    input_type: 'text' | 'image' | 'voice' | 'multimodal';
    text_input?: string | null;
    image_filename?: string | null;
    voice_filename?: string | null;
    transcript?: string | null;
    emotion: EmotionType;
    confidence: number;
    probabilities: EmotionProbabilities;
    face_count?: number;
    faces_data?: any;
    notes?: string | null;
  }): Promise<AnalysisRecord> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const createdAt = new Date().toISOString();
    const probsJson = JSON.stringify(params.probabilities);
    const facesJson = params.faces_data ? JSON.stringify(params.faces_data) : null;

    const stmt = this.db.prepare(`
      INSERT INTO analyses (user_id, input_type, text_input, image_filename, voice_filename, transcript, emotion, confidence, probabilities, face_count, faces_data, notes, created_at)
      VALUES ($user_id, $input_type, $text_input, $image_filename, $voice_filename, $transcript, $emotion, $confidence, $probabilities, $face_count, $faces_data, $notes, $created_at)
    `);

    stmt.run({
      $user_id: params.user_id || null,
      $input_type: params.input_type,
      $text_input: params.text_input || null,
      $image_filename: params.image_filename || null,
      $voice_filename: params.voice_filename || null,
      $transcript: params.transcript || null,
      $emotion: params.emotion,
      $confidence: params.confidence,
      $probabilities: probsJson,
      $face_count: params.face_count || 0,
      $faces_data: facesJson,
      $notes: params.notes || null,
      $created_at: createdAt
    });
    stmt.free();

    const res = this.db.exec('SELECT last_insert_rowid() as id');
    const newId = res[0]?.values[0]?.[0] as number;

    this.saveToDisk();

    return {
      id: newId,
      user_id: params.user_id || null,
      input_type: params.input_type,
      text_input: params.text_input || null,
      image_filename: params.image_filename || null,
      voice_filename: params.voice_filename || null,
      transcript: params.transcript || null,
      emotion: params.emotion,
      confidence: params.confidence,
      probabilities: params.probabilities,
      face_count: params.face_count || 0,
      faces_data: facesJson,
      notes: params.notes || null,
      created_at: createdAt
    };
  }

  public static async getHistory(userId?: number | null, limit = 200): Promise<AnalysisRecord[]> {
    await this.init();
    if (!this.db) return [];

    let query = `
      SELECT a.id, a.user_id, a.input_type, a.text_input, a.image_filename, a.voice_filename, a.transcript,
             a.emotion, a.confidence, a.probabilities, a.face_count, a.faces_data, a.notes, a.created_at,
             u.name as user_name, u.email as user_email
      FROM analyses a
      LEFT JOIN users u ON a.user_id = u.id
    `;

    if (typeof userId === 'number') {
      query += ` WHERE a.user_id = ${userId} `;
    }

    query += ` ORDER BY a.id DESC LIMIT ${limit}`;

    const res = this.db.exec(query);
    if (!res.length || !res[0].values) return [];

    const columns = res[0].columns;
    return res[0].values.map(row => {
      const record: any = {};
      columns.forEach((col, idx) => {
        record[col] = row[idx];
      });

      try {
        record.probabilities = JSON.parse(record.probabilities);
      } catch {
        record.probabilities = {};
      }

      return record as AnalysisRecord;
    });
  }

  public static async getAnalysisById(id: number, userId?: number | null, role?: string): Promise<AnalysisRecord | null> {
    await this.init();
    if (!this.db) return null;

    let query = 'SELECT * FROM analyses WHERE id = $id';
    if (role !== 'ADMIN' && typeof userId === 'number') {
      query += ' AND user_id = $user_id';
    }

    const stmt = this.db.prepare(query);
    const bindParams: any = { $id: id };
    if (role !== 'ADMIN' && typeof userId === 'number') {
      bindParams.$user_id = userId;
    }
    stmt.bind(bindParams);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      try {
        (row as any).probabilities = JSON.parse(row.probabilities as string);
      } catch {
        (row as any).probabilities = {};
      }
      return row as any;
    }

    stmt.free();
    return null;
  }

  public static async deleteAnalysis(id: number, userId?: number | null, role?: string): Promise<boolean> {
    await this.init();
    if (!this.db) return false;

    let query = 'DELETE FROM analyses WHERE id = $id';
    if (role !== 'ADMIN' && typeof userId === 'number') {
      query += ' AND user_id = $user_id';
    }

    const stmt = this.db.prepare(query);
    const bindParams: any = { $id: id };
    if (role !== 'ADMIN' && typeof userId === 'number') {
      bindParams.$user_id = userId;
    }

    stmt.run(bindParams);
    stmt.free();

    this.saveToDisk();
    return true;
  }

  public static async clearHistory(userId?: number | null, role?: string): Promise<boolean> {
    await this.init();
    if (!this.db) return false;

    let query = 'DELETE FROM analyses';
    if (role !== 'ADMIN' && typeof userId === 'number') {
      query += ` WHERE user_id = ${userId}`;
    }

    this.db.run(query);
    this.saveToDisk();
    return true;
  }

  public static async getDashboardStats(userId?: number | null): Promise<DashboardStats> {
    await this.init();
    const history = await this.getHistory(userId, 500);

    const emotionDistribution: Record<EmotionType, number> = {
      Happy: 0,
      Sad: 0,
      Angry: 0,
      Fear: 0,
      Surprise: 0,
      Disgust: 0,
      Neutral: 0
    };

    const modalityDistribution = {
      text: 0,
      image: 0,
      voice: 0,
      multimodal: 0
    };

    const confidenceDistribution = {
      high: 0,
      medium: 0,
      low: 0
    };

    const dailyActivityMap: Record<string, number> = {};
    let totalConfidenceSum = 0;
    let totalFaces = 0;

    for (const item of history) {
      if (item.emotion in emotionDistribution) {
        emotionDistribution[item.emotion]++;
      }

      if (item.input_type === 'text') modalityDistribution.text++;
      else if (item.input_type === 'image') modalityDistribution.image++;
      else if (item.input_type === 'voice') modalityDistribution.voice++;
      else if (item.input_type === 'multimodal') modalityDistribution.multimodal++;

      totalConfidenceSum += item.confidence;
      totalFaces += item.face_count || 0;

      if (item.confidence >= 0.85) confidenceDistribution.high++;
      else if (item.confidence >= 0.60) confidenceDistribution.medium++;
      else confidenceDistribution.low++;

      // Daily activity bucket
      const day = item.created_at.substring(0, 10);
      dailyActivityMap[day] = (dailyActivityMap[day] || 0) + 1;
    }

    let mostDetected: EmotionType | 'N/A' = 'N/A';
    let maxCount = 0;
    for (const em of EMOTIONS) {
      if (emotionDistribution[em] > maxCount) {
        maxCount = emotionDistribution[em];
        mostDetected = em;
      }
    }

    const avgConfidence = history.length > 0 ? Number((totalConfidenceSum / history.length).toFixed(3)) : 0;

    // Convert daily activity map to sorted trend array
    const activityTrends: ActivityTrend[] = Object.entries(dailyActivityMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_analyses: history.length,
      text_analyses: modalityDistribution.text,
      image_analyses: modalityDistribution.image,
      voice_analyses: modalityDistribution.voice,
      multimodal_analyses: modalityDistribution.multimodal,
      most_detected_emotion: mostDetected,
      average_confidence: avgConfidence,
      total_faces_analyzed: totalFaces,
      emotion_distribution: emotionDistribution,
      modality_distribution: modalityDistribution,
      confidence_distribution: confidenceDistribution,
      activity_trends: activityTrends,
      recent_analyses: history.slice(0, 10)
    };
  }

  public static async getAdminStats(): Promise<AdminStats> {
    await this.init();
    const overallStats = await this.getDashboardStats(undefined); // all analyses
    const users = await this.getAllUsers();

    let adminCount = 0;
    let userCount = 0;

    for (const u of users) {
      if (u.role === 'ADMIN') adminCount++;
      else userCount++;
    }

    return {
      ...overallStats,
      total_users: users.length,
      user_roles: {
        admin: adminCount,
        user: userCount
      },
      users_list: users
    };
  }

  public static async loadDemoData(userId?: number | null): Promise<void> {
    await this.init();

    const sampleAnalyses = [
      {
        user_id: userId || 1,
        input_type: 'multimodal' as const,
        text_input: 'I finally got selected for my dream software engineering job!',
        image_filename: 'sample_face_happy_1790876453955.jpg',
        voice_filename: null,
        transcript: null,
        emotion: 'Happy' as const,
        confidence: 0.938,
        probabilities: {
          Happy: 0.938,
          Surprise: 0.032,
          Neutral: 0.018,
          Sad: 0.005,
          Angry: 0.003,
          Fear: 0.002,
          Disgust: 0.002
        },
        face_count: 1,
        notes: 'Demo Viva Record: Multimodal high concordance analysis'
      },
      {
        user_id: userId || 1,
        input_type: 'voice' as const,
        text_input: null,
        image_filename: null,
        voice_filename: 'sample_voice_proud.webm',
        transcript: 'We worked all night and finally completed our thesis on time!',
        emotion: 'Happy' as const,
        confidence: 0.892,
        probabilities: {
          Happy: 0.892,
          Surprise: 0.065,
          Neutral: 0.024,
          Sad: 0.011,
          Angry: 0.005,
          Fear: 0.002,
          Disgust: 0.001
        },
        face_count: 0,
        notes: 'Demo Viva Record: Voice-to-Text emotion classification'
      },
      {
        user_id: userId || 1,
        input_type: 'text' as const,
        text_input: 'I am really upset about how unfairly the grading was handled today.',
        image_filename: null,
        voice_filename: null,
        transcript: null,
        emotion: 'Angry' as const,
        confidence: 0.892,
        probabilities: {
          Angry: 0.892,
          Sad: 0.065,
          Disgust: 0.024,
          Neutral: 0.011,
          Fear: 0.005,
          Surprise: 0.002,
          Happy: 0.001
        },
        face_count: 0,
        notes: 'Demo Viva Record: NLP single-modality sentiment'
      },
      {
        user_id: userId || 1,
        input_type: 'image' as const,
        text_input: null,
        image_filename: 'sample_face_neutral_1790876466640.jpg',
        voice_filename: null,
        transcript: null,
        emotion: 'Neutral' as const,
        confidence: 0.884,
        probabilities: {
          Neutral: 0.884,
          Sad: 0.042,
          Happy: 0.035,
          Surprise: 0.018,
          Angry: 0.011,
          Fear: 0.006,
          Disgust: 0.004
        },
        face_count: 1,
        notes: 'Demo Viva Record: Facial expression computer vision'
      },
      {
        user_id: userId || 1,
        input_type: 'text' as const,
        text_input: 'I am so scared about tomorrow morning presentation in front of the board.',
        image_filename: null,
        voice_filename: null,
        transcript: null,
        emotion: 'Fear' as const,
        confidence: 0.915,
        probabilities: {
          Fear: 0.915,
          Sad: 0.048,
          Surprise: 0.021,
          Neutral: 0.010,
          Angry: 0.004,
          Disgust: 0.001,
          Happy: 0.001
        },
        face_count: 0,
        notes: 'Demo Viva Record: Anxiety and fear classification'
      }
    ];

    for (const sample of sampleAnalyses) {
      await this.insertAnalysis(sample);
    }
  }
}
