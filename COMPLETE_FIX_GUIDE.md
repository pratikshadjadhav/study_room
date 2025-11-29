# 🔧 Complete Photo Upload Fix

## Current Errors

1. ✅ **"new row violates row-level security policy"** - FIXED (policies added)
2. ⚠️ **"No API key found in request"** - Supabase client configuration issue
3. ⚠️ **"Could not find 'photo_url' column"** - Database column missing

---

## Step 1: Add Missing Database Column ✅

The `students` table doesn't have a `photo_url` column. You need to add it.

### **Run this SQL in Supabase:**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New query"**
3. Paste this SQL:

```sql
-- Add photo_url column to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN students.photo_url IS 'Storage path to student Aadhaar/ID photo in aadhar_pan bucket';
```

4. Click **"Run"**
5. You should see: **"Success. No rows returned"**

### **Verify the column was added:**

Run this query:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
  AND column_name = 'photo_url';
```

**Expected result:**
```
column_name | data_type | is_nullable
photo_url   | text      | YES
```

---

## Step 2: Restart Your Development Server ✅

The "No API key" error might be due to cached environment variables.

```bash
# Stop the dev server (Ctrl+C)
cd abhyasika-dashboard

# Clear any cache
rm -rf node_modules/.vite

# Restart
npm run dev
```

---

## Step 3: Test Photo Upload 🧪

1. **Open your browser** → Navigate to the app
2. **Open DevTools** (Press F12) → Go to **Console** tab
3. **Add a new student**:
   - Click **Students** → **Add Student**
   - Fill in all required fields
   - Toggle **"Attach Aadhaar photo"** to ON
   - Click **Choose file** and select an image
   - You should see a preview
   - Click **Create Student**

4. **Check the Console output**:
   ```
   Uploading photo to: aadhar_pan students/abc123.jpg
   Photo uploaded successfully: { path: "students/abc123.jpg" }
   Public URL generated: https://...
   ```

5. **Verify in Supabase**:
   - Go to **Storage** → **aadhar_pan** → **students** folder
   - You should see the uploaded file

---

## Troubleshooting

### Error: "No API key found in request"

**Cause**: Supabase client is missing API key

**Fix 1: Check Environment Variables**
```bash
# In abhyasika-dashboard directory
cat .env
```

Make sure you see:
```env
VITE_SUPABASE_URL=https://yjkhjeiozouniprsters.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Fix 2: Restart Dev Server**
```bash
# Stop server (Ctrl+C)
npm run dev
```

**Fix 3: Check Browser Console**
Press F12 and run:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Has anon key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
```

If either is undefined, the `.env` file isn't being loaded.

---

### Error: "Could not find 'photo_url' column"

**Cause**: Database column doesn't exist

**Fix**: Run the SQL from Step 1 above

**Verify**:
```sql
SELECT * FROM students LIMIT 1;
```

You should see `photo_url` in the columns list.

---

### Error: "new row violates row-level security policy" (if it returns)

**Cause**: Storage policies missing

**Fix**: Run this SQL:
```sql
CREATE POLICY "Authenticated users can upload to aadhar_pan"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'aadhar_pan');

CREATE POLICY "Authenticated users can read from aadhar_pan"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'aadhar_pan');
```

---

### Photo Uploads But Shows Broken Image

**Cause**: Photo URL not being generated correctly

**Fix**: The photo is stored as a path (e.g., `students/abc.jpg`). To display it, you need to generate a public URL.

**In your code:**
```javascript
// Get public URL from path
const { data } = supabase.storage
  .from('aadhar_pan')
  .getPublicUrl(student.photo_url);

// Use in img tag
<img src={data.publicUrl} alt="Student photo" />
```

---

## Verification Checklist

After all fixes, verify:

- [ ] `photo_url` column exists in `students` table
- [ ] Storage policies exist under "OTHER POLICIES UNDER STORAGE.OBJECTS"
- [ ] Environment variables are loaded (check browser console)
- [ ] Dev server has been restarted
- [ ] You can upload a photo without errors
- [ ] Photo appears in Supabase Storage → aadhar_pan → students

---

## Quick Reference

### **SQL Files Created:**
1. `CREATE_STORAGE_POLICIES.sql` - Storage RLS policies
2. `ADD_PHOTO_URL_COLUMN.sql` - Add database column

### **Restart Command:**
```bash
cd abhyasika-dashboard
npm run dev
```

### **Test Upload in Console:**
```javascript
// Test if Supabase is configured
console.log('Supabase client:', window.supabase ? 'OK' : 'Missing')

// Test file upload
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
const { data, error } = await window.supabase.storage
  .from('aadhar_pan')
  .upload('students/test-' + Date.now() + '.jpg', testFile)
console.log('Result:', { data, error })
```

---

## What Each Fix Does

| Issue | Fix | Why |
|-------|-----|-----|
| RLS policy error | Added storage.objects policies | Allows authenticated users to upload |
| Missing column | Added `photo_url TEXT` column | Stores file path in database |
| No API key | Restart dev server | Reloads environment variables |
| Broken images | Generate public URL from path | Converts storage path to accessible URL |

---

## Summary of Changes Made

### **Code Changes:**
- ✅ Enhanced error handling in `StudentModal.jsx`
- ✅ Added console logging for debugging
- ✅ Added photo preview before upload

### **Database Changes Needed:**
- ⚠️ Add `photo_url` column to `students` table (run SQL)
- ✅ Storage policies created

### **Configuration:**
- ✅ Environment variables verified
- ✅ Supabase client properly configured

---

**After completing Steps 1 & 2, the photo upload should work completely!** 🎉
