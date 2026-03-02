-- TrackyJoby Database Schema
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  mail_forwarder TEXT UNIQUE,               -- e.g. "ayodeji" → ayodeji@iloveinbox.com
  email_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token UUID UNIQUE DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'none', -- 'none', 'trialing', 'active', 'canceled', 'lifetime'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT, -- 'monthly', 'yearly', 'lifetime'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts (e.g., for Gmail Forwarding Verifications)
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies (To store domains and logo URLs)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  domain TEXT,          -- e.g., 'vercel.com' extracted from recruiting@vercel.com
  logo_url TEXT,        -- e.g., 'https://logo.clearbit.com/vercel.com'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Applied', -- 'Applied', 'Interview', 'Offer', 'Accepted', 'Rejected'
  salary_range TEXT,
  location_type TEXT, -- 'Remote', 'On-site', 'Hybrid', 'Unknown'
  applied_date TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Interviews (For the upcoming interviews sidebar)
CREATE TABLE IF NOT EXISTS job_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE NOT NULL,
  interview_type TEXT, -- e.g., 'Technical Round', 'Founder Chat', 'HR Screen'
  interview_date TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  additional_notes TEXT,
  status TEXT DEFAULT 'Scheduled', -- 'Scheduled', 'Completed', 'Cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL, -- 'Feedback', 'Complaints', 'Feature Request'
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Application Events (History Tracking)
CREATE TABLE IF NOT EXISTS job_application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- e.g., 'Status Change', 'Note Added'
  description TEXT,
  old_status TEXT,
  new_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Transactions (Billing History)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL, -- 'succeeded', 'failed', 'refunded'
  plan_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_mail_forwarder ON users(mail_forwarder);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON job_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON job_interviews(job_application_id);
CREATE INDEX IF NOT EXISTS idx_events_job_id ON job_application_events(job_application_id);



CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
