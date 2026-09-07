/*
# Add Trade Categories

1. Changes
- Insert 6 trade categories into `categories` table: Boya, Seramik, Alçıpan, Laminat Parke, Tesisat, Marangoz
- Each with a distinct color for visual identification
- Uses ON CONFLICT to be idempotent (re-runnable)
2. Security
- No security changes. Table already has RLS enabled with anon+authenticated CRUD policies.
*/

INSERT INTO categories (name, color, icon) VALUES
  ('Boya', '#3B82F6', 'paintbrush'),
  ('Seramik', '#F59E0B', 'grid'),
  ('Alçıpan', '#10B981', 'layers'),
  ('Laminat Parke', '#EF4444', 'square'),
  ('Tesisat', '#06B6D4', 'pipe'),
  ('Marangoz', '#8B5CF6', 'hammer')
ON CONFLICT DO NOTHING;
