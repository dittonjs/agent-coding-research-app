CREATE TABLE IF NOT EXISTS code_submissions (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  code TEXT NOT NULL DEFAULT '',
  duration_ms INTEGER,
  submitted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  survey_type VARCHAR(20) NOT NULL DEFAULT 'post',
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant_id, survey_type)
);
