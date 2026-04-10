CREATE TABLE IF NOT EXISTS jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task          VARCHAR(100)   NOT NULL,
  payload       JSONB          NOT NULL DEFAULT '{}',
  status        VARCHAR(20)    NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued','processing','retrying','completed','failed')),
  attempts      INT            NOT NULL DEFAULT 0,
  max_attempts  INT            NOT NULL DEFAULT 5,
  error         TEXT,
  next_run_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);
