-- Migration 001: Multi-Category Support
-- Adds category, source_url, and notes columns to job_applications

-- 1. Add category column with default 'job' for backward compatibility
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'job';

-- 2. Add new fields for the browser extension
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_jobs_category ON job_applications(category);

-- 4. Update users table with default category preferences
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS enabled_categories TEXT[] DEFAULT '{job}',
  ADD COLUMN IF NOT EXISTS default_category TEXT DEFAULT 'job';
