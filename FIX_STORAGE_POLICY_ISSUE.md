# 🔧 Fix "New Row Violates Row-Level Security Policy" Error

## Problem
When uploading photos, you see this error:
```
new row violates row-level security policy
```

## Root Cause
Your `aadhar_pan` bucket exists, but **storage.objects policies are missing**.

Looking at your screenshot, the section **"OTHER POLICIES UNDER STORAGE.OBJECTS"** shows **"No policies created yet"**.

The policies you created are for specific folders (`y6uir_0`, `y6uir_1`), but you need policies on the **storage.objects table** itself.

---

## ✅ Solution: Add Storage Policies

### **Method 1: Using SQL Editor (Recommended)**

1. **Open Supabase Dashboard**
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. **Copy and paste this SQL**:

```sql
-- ALLOW AUTHENTICATED USERS TO UPLOAD
CREATE POLICY "Authenticated users can upload to aadhar_pan"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'aadhar_pan');

-- ALLOW AUTHENTICATED USERS TO READ
CREATE POLICY "Authenticated users can read from aadhar_pan"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'aadhar_pan');

-- ALLOW AUTHENTICATED USERS TO UPDATE
CREATE POLICY "Authenticated users can update in aadhar_pan"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'aadhar_pan')
WITH CHECK (bucket_id = 'aadhar_pan');

-- ALLOW AUTHENTICATED USERS TO DELETE
CREATE POLICY "Authenticated users can delete from aadhar_pan"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'aadhar_pan');
```

5. Click **Run** (or press Ctrl+Enter)
6. You should see: **"Success. No rows returned"**

---

### **Method 2: Using Storage UI (Easier)**

1. **Go to Storage → Policies tab**
2. Scroll down to **"OTHER POLICIES UNDER STORAGE.OBJECTS"**
3. Click **"New policy"**

#### **Policy 1: Allow Upload (INSERT)**
- **Policy name**: `Authenticated users can upload to aadhar_pan`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'aadhar_pan'
  ```
- Click **Review** → **Save policy**

#### **Policy 2: Allow Read (SELECT)**
- **Policy name**: `Authenticated users can read from aadhar_pan`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'aadhar_pan'
  ```
- Click **Review** → **Save policy**

#### **Policy 3: Allow Update (UPDATE)**
- **Policy name**: `Authenticated users can update in aadhar_pan`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'aadhar_pan'
  ```
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'aadhar_pan'
  ```
- Click **Review** → **Save policy**

#### **Policy 4: Allow Delete (DELETE)** (Optional)
- **Policy name**: `Authenticated users can delete from aadhar_pan`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'aadhar_pan'
  ```
- Click **Review** → **Save policy**

---

## 🧪 Verify Policies Were Created

### **Option A: Check in UI**
1. Go to **Storage** → **Policies**
2. Scroll to **"OTHER POLICIES UNDER STORAGE.OBJECTS"**
3. You should now see 4 policies listed (not "No policies created yet")

### **Option B: Check via SQL**
Run this query in SQL Editor:
```sql
SELECT
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%aadhar_pan%';
```

You should see 4 rows returned.

---

## 🎯 Test Photo Upload

1. **Restart your React app** (to clear any cached errors):
   ```bash
   # Stop the dev server (Ctrl+C)
   cd abhyasika-dashboard
   npm run dev
   ```

2. **Try uploading again**:
   - Navigate to **Students** → **Add Student**
   - Toggle **"Attach Aadhaar photo"** ON
   - Click **Choose file** and select an image
   - Fill in required fields
   - Click **Create Student**

3. **Check browser console** (F12):
   - ✅ **Success**: No errors, student created
   - ❌ **Still failing**: Check the error message (see troubleshooting below)

---

## 🔍 Troubleshooting

### Error Still Occurs After Adding Policies

#### **Check 1: Verify User is Authenticated**
Open browser console and run:
```javascript
const { data } = await window.supabase.auth.getSession()
console.log('Authenticated:', !!data.session)
console.log('User:', data.session?.user?.email)
```

If `Authenticated: false`, the user is not logged in. Log out and log back in.

#### **Check 2: Verify Bucket Name Matches**
In browser console:
```javascript
console.log('Bucket name in code:', 'aadhar_pan')
```

In your Supabase dashboard, verify the bucket is named **exactly** `aadhar_pan` (case-sensitive, all lowercase with underscore).

#### **Check 3: Clear Browser Cache**
```bash
# Hard refresh in browser
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

#### **Check 4: Verify Environment Variables**
Check `abhyasika-dashboard/.env`:
```env
VITE_SUPABASE_URL=https://yjkhjeiozoumprsters.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # Your anon key
```

Make sure these match your Supabase project.

#### **Check 5: Test Upload Directly**
Open browser console and test the upload:
```javascript
// Test file upload
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

const { data, error } = await window.supabase.storage
  .from('aadhar_pan')
  .upload('students/test-' + Date.now() + '.jpg', testFile)

console.log('Upload result:', { data, error })
```

- ✅ **data**: Upload worked, policy is correct
- ❌ **error**: Check the error message

---

## 📊 What Each Policy Does

| Policy | Operation | Purpose |
|--------|-----------|---------|
| INSERT | Upload new files | Allows students to upload Aadhaar photos |
| SELECT | Read/download files | Allows viewing uploaded photos |
| UPDATE | Replace existing files | Allows re-uploading if needed |
| DELETE | Remove files | Allows deleting photos (optional) |

---

## 🔒 Security Notes

These policies allow **any authenticated user** to upload to `aadhar_pan`.

### **More Restrictive Policy (Optional)**
If you want to restrict uploads to specific users or roles:

```sql
-- Only allow uploads to students/ folder
CREATE POLICY "Authenticated users can upload to students folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'aadhar_pan'
  AND (storage.foldername(name))[1] = 'students'
);

-- Only allow users to access their own files
CREATE POLICY "Users can only access their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'aadhar_pan'
  AND (storage.foldername(name))[1] = 'students'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
```

---

## 📝 Quick Reference

### **SQL File Location**
I've created a ready-to-run SQL file:
```
E:\Study Room\CREATE_STORAGE_POLICIES.sql
```

### **Running the SQL File**
1. Open the file
2. Copy all SQL
3. Paste in Supabase SQL Editor
4. Click Run

---

## ✅ Expected Result

After adding policies, the **"OTHER POLICIES UNDER STORAGE.OBJECTS"** section should show:

```
✓ Authenticated users can upload to aadhar_pan    (INSERT)
✓ Authenticated users can read from aadhar_pan    (SELECT)
✓ Authenticated users can update in aadhar_pan    (UPDATE)
✓ Authenticated users can delete from aadhar_pan  (DELETE)
```

Then photo uploads will work! 🎉

---

**Need Help?**
- Check browser console for detailed error messages
- Verify you're logged in as an authenticated user
- Make sure the bucket name is exactly `aadhar_pan` (lowercase)
- Try the SQL method if the UI method doesn't work
