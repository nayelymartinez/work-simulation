-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Patients table (integer PK + separate UUID for external use)
CREATE TABLE patients (
  id            SERIAL PRIMARY KEY,
  patient_uuid  UUID NOT NULL DEFAULT gen_random_uuid(),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_session_date DATE NOT NULL
);

-- Transcripts table
CREATE TABLE transcripts (
  id              SERIAL PRIMARY KEY,
  transcript_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- QA logs table
CREATE TABLE qa_logs (
  id            SERIAL PRIMARY KEY,
  transcript_id INTEGER NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  model_used    TEXT NOT NULL,
  prompt_snapshot TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_patients_patient_uuid    ON patients(patient_uuid);
CREATE UNIQUE INDEX idx_transcripts_transcript_uuid ON transcripts(transcript_uuid);
CREATE INDEX        idx_patients_user_id         ON patients(user_id);
CREATE INDEX        idx_transcripts_patient_id   ON transcripts(patient_id);
CREATE INDEX        idx_qa_logs_transcript_id    ON qa_logs(transcript_id);

-- Add UUID to users table for external-facing use
ALTER TABLE users
  ADD COLUMN user_uuid UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX idx_users_user_uuid ON users(user_uuid);

-- Backfill existing users with random UUIDs for user_uuid
UPDATE users SET user_uuid = gen_random_uuid() WHERE user_uuid IS NULL;

-- Sample data
INSERT INTO patients (patient_uuid, first_name, last_name, user_id, email, first_session_date)
VALUES 
  (gen_random_uuid(), 'Natalia', 'Gomez',  1, 'natalia.gomez@example.com', '2025-06-01'),
  (gen_random_uuid(), 'Alex',    'Alvarez', 1, 'alex.alvarez@example.com',  '2024-12-02');



