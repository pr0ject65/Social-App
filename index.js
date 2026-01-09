import express from 'express';
import pool from './db.js';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';


dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded successfully! (hidden for security)' : 'MISSING - Check .env!');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

const app = express();
app.use(express.json());  // ← Keep this early (only once!)

app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      message: 'Social App Backend Live! 🎉 (Neon DB Connected)',
      db_time: result.rows[0].now,
      project_status: 'Ready for posts, users, and image uploads'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB Connection Failed: ' + err.message });
  }
});

app.get('/posts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/posts', upload.single('image'), async (req, res) => {
  try {
    const { content, user_id } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!content || !user_id) {
      return res.status(400).json({ error: 'content and user_id required' });
    }

    const result = await pool.query(
      `INSERT INTO posts (user_id, content, image_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, content, imageUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/posts-with-image', upload.single('image'), async (req, res) => {
  try {
    const { content, user_id } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!content || !user_id) {
      return res.status(400).json({ error: 'content and user_id are required' });
    }

    const result = await pool.query(
      'INSERT INTO posts (content, user_id, image_url) VALUES ($1, $2, $3) RETURNING *',
      [content, user_id, imageUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// Start server LAST
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
