-- ========================================
-- SUPABASE STORAGE POLICIES FOR AADHAR_PAN
-- ========================================
-- Run these in Supabase SQL Editor
-- Go to: Dashboard → SQL Editor → New query
-- ========================================

-- 1. ALLOW AUTHENTICATED USERS TO UPLOAD (INSERT)
CREATE POLICY "Authenticated users can upload to aadhar_pan"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'aadhar_pan'
);

-- 2. ALLOW AUTHENTICATED USERS TO READ (SELECT)
CREATE POLICY "Authenticated users can read from aadhar_pan"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'aadhar_pan'
);

-- 3. ALLOW AUTHENTICATED USERS TO UPDATE
CREATE POLICY "Authenticated users can update in aadhar_pan"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'aadhar_pan'
)
WITH CHECK (
  bucket_id = 'aadhar_pan'
);

-- 4. ALLOW AUTHENTICATED USERS TO DELETE
CREATE POLICY "Authenticated users can delete from aadhar_pan"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'aadhar_pan'
);

-- ========================================
-- OPTIONAL: PUBLIC ACCESS (if bucket is public)
-- ========================================
-- Uncomment if you want public read access:

-- CREATE POLICY "Public can read from aadhar_pan"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (
--   bucket_id = 'aadhar_pan'
-- );

-- ========================================
-- VERIFICATION
-- ========================================
-- After running, verify policies exist:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
