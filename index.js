import express from 'express';
import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded successfully! (hidden for security)' : 'MISSING - Check .env!');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Test endpoint – proves server + Neon DB connection works
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

app.use(express.json());

app.post('/posts', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    const result = await pool.query(
      'INSERT INTO posts (content) VALUES ($1) RETURNING *',
      [content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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