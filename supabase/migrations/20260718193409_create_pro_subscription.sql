/*
# Create pro_subscriptions table (single-tenant, no auth)

1. New Tables
- `pro_subscriptions`: Stores the app's Pro subscription state (single row).
  - id (int, primary key, always 1)
  - is_pro (boolean, default false)
  - plan_id (text, nullable: 'monthly' | 'yearly')
  - purchased_at (timestamptz, nullable)
  - expires_at (timestamptz, nullable)
  - updated_at (timestamptz, default now())

2. Security
- RLS enabled on pro_subscriptions.
- anon + authenticated CRUD (single-tenant, no sign-in): the app reads/writes its own subscription row.

3. Notes
- The app uses a single row (id = 1) to track the Pro state across reloads.
- On first load, the app will insert the row if it does not exist.
*/

CREATE TABLE IF NOT EXISTS pro_subscriptions (
  id int PRIMARY KEY DEFAULT 1,
  is_pro boolean NOT NULL DEFAULT false,
  plan_id text,
  purchased_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE pro_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pro_subscriptions" ON pro_subscriptions;
CREATE POLICY "anon_select_pro_subscriptions" ON pro_subscriptions FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pro_subscriptions" ON pro_subscriptions;
CREATE POLICY "anon_insert_pro_subscriptions" ON pro_subscriptions FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pro_subscriptions" ON pro_subscriptions;
CREATE POLICY "anon_update_pro_subscriptions" ON pro_subscriptions FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pro_subscriptions" ON pro_subscriptions;
CREATE POLICY "anon_delete_pro_subscriptions" ON pro_subscriptions FOR DELETE
TO anon, authenticated USING (true);

-- Seed the single row
INSERT INTO pro_subscriptions (id, is_pro) VALUES (1, false)
ON CONFLICT (id) DO NOTHING;
