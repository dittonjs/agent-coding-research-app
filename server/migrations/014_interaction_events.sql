CREATE TABLE IF NOT EXISTS interaction_events (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER REFERENCES participants(id),
  session_id VARCHAR(36) NOT NULL,
  events JSONB NOT NULL,
  batch_seq INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interaction_events_participant ON interaction_events(participant_id);
CREATE INDEX idx_interaction_events_session ON interaction_events(session_id);
