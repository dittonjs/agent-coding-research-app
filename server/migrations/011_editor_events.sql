CREATE TABLE IF NOT EXISTS editor_events (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id),
  events JSONB NOT NULL,
  batch_seq INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_editor_events_participant ON editor_events(participant_id);
