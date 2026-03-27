CREATE TABLE IF NOT EXISTS language_changes (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  from_language VARCHAR(20) NOT NULL,
  to_language VARCHAR(20) NOT NULL,
  code_snapshot TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
