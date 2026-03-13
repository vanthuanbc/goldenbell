import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('goldenbell.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT,
    grade TEXT,
    status TEXT DEFAULT 'draft', -- draft, waiting, playing, finished
    join_code TEXT UNIQUE,
    time_limit INTEGER DEFAULT 10,
    current_question_index INTEGER DEFAULT -1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    game_id TEXT,
    text TEXT NOT NULL,
    type TEXT DEFAULT 'multiple_choice', -- multiple_choice, true_false, fill_blank
    options TEXT, -- JSON array
    correct_answer TEXT,
    explanation TEXT,
    sort_order INTEGER,
    FOREIGN KEY(game_id) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    game_id TEXT,
    socket_id TEXT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, eliminated
    eliminated_at_question INTEGER,
    score INTEGER DEFAULT 0,
    FOREIGN KEY(game_id) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
