BEGIN;

-- Keep accounts created before this feature usable.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS verification_token TEXT,
  ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;

ALTER TABLE users
  ALTER COLUMN is_verified SET DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_verification_token
  ON users (verification_token)
  WHERE verification_token IS NOT NULL;

COMMIT;
