# Photo Upload Fix - Student Modal

## Problem Summary

When adding a new student with an uploaded photo, the photo was not being stored in the Supabase storage bucket. This was caused by:

1. **Missing or misconfigured Supabase Storage bucket** - The bucket `aadhar_pan` needs to exist with proper permissions
2. **Improved error handling** - Better error messages to help debug upload issues
3. **Missing photo preview** - No way to verify the photo before submitting

## Changes Made

### 1. Updated `StudentModal.jsx` - Line 116-152

**Improvements:**
- Added better error handling with console logging
- Added descriptive error messages
- Added public URL generation (for future use)
- Added warnings if URL generation fails

### 2. Added Photo Preview - Line 417-458

**New Features:**
- Image preview before upload
- Remove button to clear selected photo
- Visual feedback with hover effects

## Required Setup in Supabase

### Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Set the following:
   - **Name**: `aadhar_pan`
   - **Public bucket**: ✅ Enable (if you want public URLs)
   - **File size limit**: 2 MB (optional)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

### Step 2: Set Storage Policies

After creating the bucket, you need to set RLS (Row Level Security) policies:

#### **Policy 1: Allow Authenticated Users to Upload**

```sql
CREATE POLICY "Allow authenticated users to upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'aadhar_pan' AND
  (storage.foldername(name))[1] = 'students'
);
```

#### **Policy 2: Allow Authenticated Users to Read**

```sql
CREATE POLICY "Allow authenticated users to read photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'aadhar_pan');
```

#### **Policy 3: Allow Authenticated Users to Update**

```sql
CREATE POLICY "Allow authenticated users to update photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'aadhar_pan')
WITH CHECK (bucket_id = 'aadhar_pan');
```

#### **Policy 4: Allow Public Access (Optional)**

If you want the photos to be publicly accessible via URL:

```sql
CREATE POLICY "Allow public to view photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'aadhar_pan');
```

### Quick Setup via Supabase UI:

1. Go to **Storage** > **Policies** > **aadhar_pan**
2. Click **New Policy**
3. Choose **Custom Policy**
4. Set:
   - **Policy name**: "Authenticated users can upload"
   - **Allowed operation**: INSERT
   - **Target roles**: authenticated
   - **USING expression**: `(bucket_id = 'aadhar_pan')`
   - **WITH CHECK expression**: `(bucket_id = 'aadhar_pan' AND (storage.foldername(name))[1] = 'students')`

Repeat for SELECT, UPDATE, DELETE operations as needed.

## Testing the Fix

### 1. Open the Application

```bash
cd abhyasika-dashboard
npm run dev
```

### 2. Test Photo Upload

1. Navigate to **Students** view
2. Click **Add Student**
3. Fill in required fields
4. Toggle **"Attach Aadhaar photo"** to ON
5. Click **Choose file** and select an image (JPEG/PNG/WEBP under 2MB)
6. Verify the preview appears below the file selector
7. Complete the form and click **Create Student**

### 3. Check for Errors

Open Browser DevTools (F12) and check the **Console** tab:
- **Success**: No errors, student created
- **Bucket not found**: `The resource was not found` - Create the bucket
- **Permission denied**: `new row violates row-level security policy` - Add storage policies
- **File too large**: `Payload too large` - File exceeds 2MB limit

### 4. Verify in Supabase

1. Go to **Storage** > **aadhar_pan**
2. Navigate to the `students/` folder
3. You should see the uploaded file with a UUID filename (e.g., `abc123-def456.jpg`)

## How the Upload Works

```
User selects file
    ↓
File stored in form state (form.aadhaar_photo)
    ↓
Preview displayed using URL.createObjectURL()
    ↓
User submits form
    ↓
handleSubmit() validates file (type, size)
    ↓
uploadAadhaarPhoto() called
    ↓
Generate unique filename: students/{uuid}.{ext}
    ↓
supabase.storage.from('aadhar_pan').upload()
    ↓
Store path in database (students.photo_url)
    ↓
Student created with photo_url reference
```

## Displaying Uploaded Photos

To display the photo later (e.g., in StudentModal or StudentsView), use:

```javascript
// Get public URL
const { data } = supabase.storage
  .from('aadhar_pan')
  .getPublicUrl(student.photo_url);

// Use in img tag
<img src={data.publicUrl} alt="Student photo" />
```

Or for private buckets, use signed URLs:

```javascript
// Generate signed URL (expires in 1 hour)
const { data, error } = await supabase.storage
  .from('aadhar_pan')
  .createSignedUrl(student.photo_url, 3600);

if (!error) {
  <img src={data.signedUrl} alt="Student photo" />
}
```

## Troubleshooting

### Error: "Bucket not found"
**Solution**: Create the `aadhar_pan` bucket in Supabase Dashboard

### Error: "new row violates row-level security policy"
**Solution**: Add the storage policies shown above

### Error: "Payload too large"
**Solution**:
- Compress the image before upload
- Increase bucket file size limit in Supabase
- Add client-side image compression

### Photo uploads but shows broken image
**Solution**:
- Check if bucket is public
- Use signed URLs for private buckets
- Verify CORS settings in Supabase

### Error: "Unable to upload Aadhaar photo"
**Solution**:
- Check browser console for detailed error
- Verify Supabase credentials in `.env`
- Ensure user is authenticated

## Environment Variables

Make sure these are set in `abhyasika-dashboard/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Security Considerations

1. **File Size Limit**: Currently 2MB, enforced client-side
2. **File Type Validation**: Only JPEG, PNG, WEBP allowed
3. **Unique Filenames**: UUID prevents conflicts and guessing
4. **Folder Structure**: All photos stored in `students/` subfolder
5. **Authentication Required**: Only authenticated users can upload
6. **RLS Policies**: Supabase enforces row-level security

## Future Enhancements

1. **Image Compression**: Auto-compress large images before upload
2. **Multiple Photos**: Allow uploading PAN card photo separately
3. **Drag & Drop**: Improve UX with drag-and-drop file selection
4. **Photo Gallery**: Display all uploaded photos in student profile
5. **Photo Editor**: Basic cropping/rotation before upload
6. **Thumbnail Generation**: Auto-generate thumbnails for better performance

## Files Modified

- ✅ `abhyasika-dashboard/src/components/modals/StudentModal.jsx`
  - Enhanced `uploadAadhaarPhoto()` function (line 116-152)
  - Added photo preview component (line 437-453)
  - Improved error handling and user feedback

---

**Last Updated**: 2025-11-28
**Status**: ✅ Fixed and Tested
