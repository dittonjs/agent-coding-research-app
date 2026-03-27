CREATE TABLE IF NOT EXISTS code_checks (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language VARCHAR(20) NOT NULL DEFAULT 'javascript',
  correct BOOLEAN NOT NULL,
  agent_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_checks_participant ON code_checks(participant_id);
