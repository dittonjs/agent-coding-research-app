CREATE TABLE IF NOT EXISTS test_results (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  test_type VARCHAR(10) NOT NULL CHECK (test_type IN ('pre', 'post')),
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  total_shown INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant_id, test_type)
);
