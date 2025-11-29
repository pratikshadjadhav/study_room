-- ========================================
-- ADD PHOTO_URL COLUMN TO STUDENTS TABLE
-- ========================================
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New query
-- ========================================

-- Add the photo_url column to students table




-- Optional: Create an index for faster queries (if you'll search by photo_url)
-- CREATE INDEX IF NOT EXISTS idx_students_photo_url ON students(photo_url);

-- ========================================
-- VERIFICATION
-- ========================================
-- Check if column was added successfully:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
  AND column_name = 'photo_url';

-- Expected result:
-- column_name | data_type | is_nullable
-- photo_url   | text      | YES
