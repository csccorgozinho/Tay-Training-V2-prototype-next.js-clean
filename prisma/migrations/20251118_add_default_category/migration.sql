-- Add default category
INSERT INTO exercise_group_categories (id, name, created_at, updated_at)
VALUES (1, 'General', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
