// Server FairyRoad: Hỗ trợ Multi-player, Tài khoản không cần xác minh, Đăng nhập Google, Đồng bộ Save Cloud và Gemini AI Proxy.
import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Nạp file .env nếu có ở thư mục server hoặc thư mục gốc
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(p);
        console.log(`[FairyRoad Server] Đã nạp cấu hình từ ${p}`);
        break;
      }
    } catch (e) {
      console.warn(`Lỗi nạp ${p}:`, e.message);
    }
  }
}

// Tạo thư mục data nếu chưa có
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Khởi tạo SQLite Database
const dbPath = path.join(dataDir, 'fairyroad.db');
const db = new DatabaseSync(dbPath);

// Tạo bảng người dùng và dữ liệu chơi chung
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT,
    password_salt TEXT,
    google_id TEXT UNIQUE,
    google_email TEXT,
    display_name TEXT,
    avatar TEXT,
    auth_provider TEXT DEFAULT 'local',
    gemini_key TEXT,
    gemini_token TEXT,
    save_data TEXT,
    character_preview TEXT,
    created_at INTEGER,
    last_login INTEGER
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT,
    created_at INTEGER,
    expires_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS world_chat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    display_name TEXT,
    realm TEXT,
    message TEXT,
    created_at INTEGER
  );
`);

try { db.exec('ALTER TABLE users ADD COLUMN gemini_token TEXT'); } catch {}

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Helper băm mật khẩu bảo mật
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

// Tạo session token
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 ngày
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    token,
    userId,
    now,
    expiresAt
  );
  return token;
}

// Middleware xác thực token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.slice(7);
  const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?').get(token, Date.now());
  if (!session) {
    req.user = null;
    return next();
  }
  const user = db.prepare('SELECT id, username, google_id, google_email, display_name, avatar, auth_provider, gemini_key, character_preview, created_at FROM users WHERE id = ?').get(session.user_id);
  req.user = user || null;
  next();
}

app.use(authMiddleware);

// --- API ENDPOINTS ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, server: 'FairyRoad Cloud Server', time: Date.now() });
});

// 2. Đăng ký & Đăng nhập nhanh bằng Username + Password (không cần xác minh)
app.post('/api/auth/login-or-register', (req, res) => {
  try {
    const { username, password, displayName, geminiKey } = req.body;
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Vui lòng nhập tên tài khoản và mật khẩu.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);

    if (existing) {
      // Đã có tài khoản: kiểm tra mật khẩu
      if (!existing.password_hash || !verifyPassword(password, existing.password_hash, existing.password_salt)) {
        return res.status(401).json({ ok: false, error: 'Mật khẩu không chính xác cho tài khoản này!' });
      }

      // Đăng nhập thành công: cập nhật geminiKey nếu người dùng có nhập
      if (geminiKey) {
        db.prepare('UPDATE users SET last_login = ?, gemini_key = ? WHERE id = ?').run(Date.now(), geminiKey, existing.id);
        existing.gemini_key = geminiKey;
      } else {
        db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Date.now(), existing.id);
      }
      const token = createSession(existing.id);

      return res.json({
        ok: true,
        action: 'login',
        token,
        user: {
          id: existing.id,
          username: existing.username,
          displayName: existing.display_name || existing.username,
          avatar: existing.avatar,
          authProvider: existing.auth_provider,
          geminiKey: existing.gemini_key,
        },
      });
    } else {
      // Chưa có tài khoản: TỰ ĐỘNG TẠO MỚI ngay lập tức (không cần xác minh)
      const userId = 'usr_' + crypto.randomUUID();
      const { hash, salt } = hashPassword(password);
      const name = displayName?.trim() || cleanUsername;
      const now = Date.now();

      db.prepare(`
        INSERT INTO users (id, username, password_hash, password_salt, display_name, auth_provider, gemini_key, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, 'local', ?, ?, ?)
      `).run(userId, cleanUsername, hash, salt, name, geminiKey || null, now, now);

      const token = createSession(userId);

      return res.json({
        ok: true,
        action: 'register',
        token,
        user: {
          id: userId,
          username: cleanUsername,
          displayName: name,
          avatar: null,
          authProvider: 'local',
          geminiKey: geminiKey || null,
        },
      });
    }
  } catch (err) {
    console.error('Lỗi auth:', err);
    res.status(500).json({ ok: false, error: 'Lỗi máy chủ khi xử lý tài khoản.' });
  }
});

// 3. Đăng nhập bằng Google
app.post('/api/auth/google', (req, res) => {
  try {
    const { googleId, email, name, picture, geminiKey, geminiToken } = req.body;
    if (!googleId) {
      return res.status(400).json({ ok: false, error: 'Thiếu thông tin Google ID.' });
    }

    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

    if (user) {
      // Đã từng đăng nhập Google
      db.prepare(`
        UPDATE users 
        SET last_login = ?, display_name = ?, avatar = ?, 
            gemini_key = COALESCE(?, gemini_key), 
            gemini_token = COALESCE(?, gemini_token) 
        WHERE id = ?
      `).run(Date.now(), name || user.display_name, picture || user.avatar, geminiKey || null, geminiToken || null, user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    } else {
      // Người dùng Google lần đầu vào game
      const userId = 'usr_g_' + crypto.randomUUID();
      const now = Date.now();
      const fallbackUser = 'g_' + googleId.slice(-8);

      db.prepare(`
        INSERT INTO users (id, username, google_id, google_email, display_name, avatar, auth_provider, gemini_key, gemini_token, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, 'google', ?, ?, ?, ?)
      `).run(userId, fallbackUser, googleId, email || null, name || fallbackUser, picture || null, geminiKey || null, geminiToken || null, now, now);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    const token = createSession(user.id);

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        googleEmail: user.google_email,
        displayName: user.display_name,
        avatar: user.avatar,
        authProvider: 'google',
        geminiKey: user.gemini_key,
        geminiToken: user.gemini_token,
      },
    });
  } catch (err) {
    console.error('Lỗi Google Auth:', err);
    res.status(500).json({ ok: false, error: 'Lỗi đăng nhập Google.' });
  }
});

// 4. Lấy thông tin tài khoản hiện tại
app.get('/api/user/me', (req, res) => {
  if (!req.user) return res.status(401).json({ ok: false, error: 'Chưa đăng nhập.' });
  res.json({ ok: true, user: req.user });
});

// 5. Cập nhật Gemini API Key cho tài khoản
app.post('/api/user/gemini-key', (req, res) => {
  if (!req.user) return res.status(401).json({ ok: false, error: 'Chưa đăng nhập.' });
  const { geminiKey } = req.body;
  db.prepare('UPDATE users SET gemini_key = ? WHERE id = ?').run(geminiKey || null, req.user.id);
  res.json({ ok: true, geminiKey: geminiKey || null });
});

// 6. Đồng bộ Save Game lên Cloud
app.post('/api/user/save', (req, res) => {
  if (!req.user) return res.status(401).json({ ok: false, error: 'Chưa đăng nhập.' });
  try {
    const { saveData, characterPreview } = req.body;
    db.prepare('UPDATE users SET save_data = ?, character_preview = ? WHERE id = ?').run(
      JSON.stringify(saveData),
      characterPreview ? JSON.stringify(characterPreview) : null,
      req.user.id
    );
    res.json({ ok: true, time: Date.now() });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Lỗi lưu dữ liệu lên đám mây.' });
  }
});

// 7. Tải Save Game từ Cloud
app.get('/api/user/save', (req, res) => {
  if (!req.user) return res.status(401).json({ ok: false, error: 'Chưa đăng nhập.' });
  const row = db.prepare('SELECT save_data FROM users WHERE id = ?').get(req.user.id);
  if (!row || !row.save_data) {
    return res.json({ ok: true, hasSave: false, saveData: null });
  }
  try {
    const data = JSON.parse(row.save_data);
    res.json({ ok: true, hasSave: true, saveData: data });
  } catch {
    res.json({ ok: true, hasSave: false, saveData: null });
  }
});

// 8. Bảng Xếp Hạng & Danh sách Lôi Đài PvP Huyễn Ảnh
app.get('/api/multiplayer/roster', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, username, display_name, avatar, character_preview, last_login 
      FROM users 
      WHERE character_preview IS NOT NULL 
      ORDER BY last_login DESC 
      LIMIT 100
    `).all();

    const list = rows
      .map((r) => {
        try {
          const preview = JSON.parse(r.character_preview);
          return {
            id: r.id,
            displayName: r.display_name || r.username,
            avatar: r.avatar,
            realm: preview.realm || 'Phàm nhân',
            realmIdx: preview.realmIdx || 0,
            life: preview.life || 0,
            born: preview.born || 0,
            score: preview.score || 0,
            karma: preview.karma || 0,
            spec: preview.spec || null, // Thông số chiến đấu để tạo FoeSpec cho Lôi Đài PvP
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    res.json({ ok: true, roster: list });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Lỗi tải danh sách người chơi.' });
  }
});

// 9. Kênh Chat Thế Giới (Vạn Giới Truyền Âm)
app.get('/api/multiplayer/chat', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, user_id, display_name, realm, message, created_at 
      FROM world_chat 
      ORDER BY id DESC 
      LIMIT 50
    `).all();
    res.json({ ok: true, messages: rows.reverse() });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Lỗi tải kênh chat.' });
  }
});

app.post('/api/multiplayer/chat', (req, res) => {
  if (!req.user) return res.status(401).json({ ok: false, error: 'Cần đăng nhập để truyền âm.' });
  try {
    const { message, realm } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ ok: false, error: 'Nội dung trống.' });

    const cleanMsg = message.trim().slice(0, 300);
    const userRealm = realm || 'Tu sĩ';

    db.prepare(`
      INSERT INTO world_chat (user_id, display_name, realm, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, req.user.display_name, userRealm, cleanMsg, Date.now());

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Lỗi gửi tin nhắn.' });
  }
});

// 10. Gemini AI Proxy (gọi qua server nếu client không muốn lộ key hoặc gặp hạn chế mạng)
app.post('/api/ai/gemini-proxy', async (req, res) => {
  try {
    const { prompt, model = 'gemini-2.5-flash', apiKey } = req.body;
    const key = apiKey || req.user?.gemini_key || process.env.GEMINI_API_KEY;

    if (!key) {
      return res.status(400).json({
        ok: false,
        error: 'Chưa có Gemini API Key. Vui lòng nhập API Key từ Google AI Studio (aistudio.google.com) hoặc thiết lập GEMINI_API_KEY trong file .env của server.'
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      return res.status(resp.status).json({ ok: false, error: `Gemini API lỗi (${resp.status}): ${errTxt}` });
    }

    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ ok: true, text });
  } catch (err) {
    console.error('Lỗi Gemini Proxy:', err);
    res.status(500).json({ ok: false, error: 'Lỗi kết nối Gemini AI.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[FairyRoad Server] Máy chủ chạy tại http://localhost:${PORT}`);
});
