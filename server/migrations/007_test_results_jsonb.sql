ALTER TABLE test_results
  DROP COLUMN IF EXISTS correct_count,
  DROP COLUMN IF EXISTS incorrect_count,
  DROP COLUMN IF EXISTS total_shown,
  DROP COLUMN IF EXISTS duration_ms;

ALTER TABLE test_results
  ADD COLUMN results JSONB NOT NULL DEFAULT '{}';
