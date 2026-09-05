-- ============================================================
-- Selah House · Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com dashboard)
-- ============================================================

-- Vendors (created first — referenced by maintenance and expenses)
CREATE TABLE vendors (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  category   text NOT NULL,
  phone      text,
  email      text,
  website    text,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Maintenance tasks
CREATE TABLE maintenance (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  category       text NOT NULL,
  due_date       date NOT NULL,
  recurrence     text NOT NULL DEFAULT 'One-time',
  assignee       text,
  vendor_id      uuid REFERENCES vendors(id) ON DELETE SET NULL,
  cost           numeric,
  notes          text,
  manual_done    boolean NOT NULL DEFAULT false,
  completed_date date,
  actual_cost    numeric,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Recurring expense templates
CREATE TABLE recurring_templates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  category         text NOT NULL,
  default_amount   numeric NOT NULL DEFAULT 0,
  due_day_of_month integer NOT NULL DEFAULT 1,
  generate_mode    text NOT NULL DEFAULT 'automatic',
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE expenses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category            text NOT NULL,
  description         text NOT NULL,
  amount              numeric NOT NULL,
  due_date            date NOT NULL,
  status              text NOT NULL DEFAULT 'Unpaid',
  paid_by             text,
  date_paid           date,
  split_payment       jsonb,
  recurrence          text NOT NULL DEFAULT 'One-time',
  notes               text,
  template_id         uuid REFERENCES recurring_templates(id) ON DELETE SET NULL,
  vendor_id           uuid REFERENCES vendors(id) ON DELETE SET NULL,
  maintenance_task_id uuid REFERENCES maintenance(id) ON DELETE SET NULL,
  source              text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Custom expense categories
CREATE TABLE expense_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Stays (includes payment tracking for paid-guest stays)
CREATE TABLE stays (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person         text,
  guest          text,
  start_date     date NOT NULL,
  nights         integer NOT NULL DEFAULT 1,
  cost           numeric NOT NULL DEFAULT 0,
  payment_status text,
  payment_method text,
  payment_notes  text,
  revenue_id     uuid REFERENCES revenue(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- People (owner guests and paid guests)
CREATE TABLE people (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  type         text NOT NULL DEFAULT 'owner',
  relationship text,
  owner        text,
  rate         numeric,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Revenue entries (guest rental income)
CREATE TABLE revenue (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name     text NOT NULL,
  check_in       date NOT NULL,
  check_out      date NOT NULL,
  nights         integer NOT NULL,
  nightly_rate   numeric NOT NULL,
  total_amount   numeric NOT NULL,
  payment_status text NOT NULL DEFAULT 'Pending',
  payment_method text NOT NULL DEFAULT 'Cash',
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Document folders (self-referencing for nesting)
CREATE TABLE document_folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  parent_id  uuid REFERENCES document_folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Documents (links and notes)
CREATE TABLE documents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  category   text NOT NULL DEFAULT 'Other',
  type       text NOT NULL DEFAULT 'link',
  url        text,
  content    text,
  folder_id  uuid REFERENCES document_folders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Custom document categories
CREATE TABLE document_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Disable Row Level Security (no auth in this app)
-- ============================================================
ALTER TABLE vendors             DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance         DISABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses            DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories  DISABLE ROW LEVEL SECURITY;
ALTER TABLE stays               DISABLE ROW LEVEL SECURITY;
ALTER TABLE people              DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenue             DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders    DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents           DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Booking Requests (from public website)
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name     text NOT NULL,
  email          text NOT NULL,
  phone          text,
  check_in       date NOT NULL,
  check_out      date NOT NULL,
  nights         integer NOT NULL,
  guest_count    integer NOT NULL DEFAULT 2,
  message        text,
  source         text,
  status         text NOT NULL DEFAULT 'pending',  -- pending | approved | declined
  nightly_rate   numeric,
  rate_breakdown jsonb,                             -- seasonal rate segments from booking form
  total_amount   numeric NOT NULL DEFAULT 0,        -- quoted total from booking form
  deposit_paid   boolean NOT NULL DEFAULT false,
  balance_paid   boolean NOT NULL DEFAULT false,
  revenue_id     uuid REFERENCES revenue(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE booking_requests DISABLE ROW LEVEL SECURITY;
