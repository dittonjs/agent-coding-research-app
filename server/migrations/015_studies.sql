CREATE TABLE IF NOT EXISTS studies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE participants ADD COLUMN IF NOT EXISTS study_id INTEGER REFERENCES studies(id);
CREATE INDEX IF NOT EXISTS idx_participants_study ON participants(study_id);
