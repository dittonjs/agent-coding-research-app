-- Incentive contact info (name/email for gift-card delivery) is stored in its
-- own table. It is linked to the study (so we know which study earned the
-- reward) but intentionally NOT linked to a participant or any response table.
-- Linking to a participant would de-anonymize their survey/test/code responses;
-- linking only to the study is safe because a study has many participants.

-- Remove the earlier (incorrect) attempt that stored PII directly on participants.
ALTER TABLE participants
  DROP COLUMN IF EXISTS incentive_name,
  DROP COLUMN IF EXISTS incentive_email,
  DROP COLUMN IF EXISTS incentive_declined,
  DROP COLUMN IF EXISTS incentive_submitted_at;

CREATE TABLE IF NOT EXISTS incentives (
  id SERIAL PRIMARY KEY,
  study_id INTEGER REFERENCES studies(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
