# Abhyasika Dashboard - Deployment Guide

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- Your code pushed to a GitHub repository

### Step-by-Step Deployment

#### 1. Push Code to GitHub
```bash
# If not already done, initialize and push to GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### 2. Deploy to Vercel

**Option A: Deploy via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `abhyasika-dashboard`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variables (click "Environment Variables"):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_API_BASE_URL=https://your-backend-api.com/api
   ```

6. Click "Deploy"

**Option B: Deploy via Vercel CLI**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to frontend directory:
   ```bash
   cd abhyasika-dashboard
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. Follow the prompts:
   - Link to existing project or create new? → Create new
   - Project name → (press enter for default)
   - Directory → `./` (current directory)

6. Add environment variables:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add VITE_API_BASE_URL
   ```

7. Deploy to production:
   ```bash
   vercel --prod
   ```

### Environment Variables Explained

- `VITE_SUPABASE_URL`: Your Supabase project URL (found in Supabase Dashboard → Settings → API)
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key (found in Supabase Dashboard → Settings → API)
- `VITE_API_BASE_URL`: Your backend API URL (e.g., https://api.yourdomain.com/api)

**Important**: All Vite environment variables must be prefixed with `VITE_` to be exposed to the client.

### Post-Deployment

1. Your app will be live at: `https://your-project.vercel.app`
2. Set up a custom domain (optional):
   - Go to project settings in Vercel
   - Click "Domains"
   - Add your custom domain
   - Update DNS records as instructed

3. Enable automatic deployments:
   - Vercel automatically deploys on every push to main branch
   - Preview deployments are created for pull requests

---

## Alternative: Netlify Deployment

### Deploy to Netlify

1. Go to https://netlify.com and sign in
2. Click "Add new site" → "Import an existing project"
3. Choose your GitHub repository
4. Configure build settings:
   - **Base directory**: `abhyasika-dashboard`
   - **Build command**: `npm run build`
   - **Publish directory**: `abhyasika-dashboard/dist`

5. Add environment variables:
   - Go to Site settings → Environment variables
   - Add the same variables as listed above

6. Click "Deploy site"

### Netlify CLI (Alternative)

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Navigate to frontend directory:
   ```bash
   cd abhyasika-dashboard
   ```

3. Login and deploy:
   ```bash
   netlify login
   netlify init
   netlify deploy --prod
   ```

---

## Backend Deployment

Your backend (`abhyasika-dashboard-server`) needs to be deployed separately. Recommended platforms:

- **Railway**: Easy Node.js hosting
- **Render**: Free tier available
- **Heroku**: Popular choice
- **AWS EC2/DigitalOcean**: For more control

### Important Notes

1. **CORS Configuration**: Ensure your backend allows requests from your frontend domain
2. **Environment Variables**: Never commit `.env` files (already in .gitignore)
3. **API URL**: Update `VITE_API_BASE_URL` to point to your deployed backend
4. **Supabase**: Make sure your Supabase project allows connections from your deployed frontend

---

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check build logs for specific errors

### Environment Variables Not Working
- Ensure variables are prefixed with `VITE_`
- Rebuild after adding new variables
- Check that variables are set in deployment platform

### 404 on Refresh
- Vercel: Already configured in `vercel.json`
- Netlify: Add `_redirects` file with `/* /index.html 200`

### API Connection Issues
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings on backend
- Ensure backend is deployed and accessible

---

## Quick Commands Reference

### Test Production Build Locally
```bash
cd abhyasika-dashboard
npm run build
npm run preview
```

### Deploy Updates
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# Or just push to GitHub (if auto-deploy is enabled)
git push origin main
```

---

## Security Checklist

- ✅ `.env` files are in `.gitignore`
- ✅ No sensitive keys in code
- ✅ Environment variables set in deployment platform
- ✅ `.env.example` has placeholder values only
- ✅ HTTPS enabled on production
- ✅ CORS properly configured

---

For questions or issues, check the documentation:
- Vercel: https://vercel.com/docs
- Netlify: https://docs.netlify.com
- Vite: https://vitejs.dev/guide
