CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_assignment VARCHAR(10) NOT NULL CHECK (group_assignment IN ('control', 'test')),
  consent_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp TIMESTAMP,
  current_step INTEGER NOT NULL DEFAULT 1,
  age_range VARCHAR(20),
  gender VARCHAR(50),
  cs_year VARCHAR(50),
  prior_programming_experience VARCHAR(50),
  prior_ai_usage VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
