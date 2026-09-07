# Dental AI — Deployment Guide

## Architecture
```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  Frontend   │  API    │   Backend    │  DB     │  MongoDB     │
│  (Vercel)   │────────>│  (Render)    │────────>│  (Atlas)     │
│  React SPA  │         │  FastAPI     │         │  Cloud DB    │
└─────────────┘         └──────────────┘         └──────────────┘
```

## Step-by-Step Deployment

### Step 1: Create Required Accounts (Free Tier)

1. **GitHub** — https://github.com (you already have: VRUTANSH22)
2. **MongoDB Atlas** — https://cloud.mongodb.com (free M0 cluster)
3. **Cloudinary** — https://cloudinary.com/users/register_free (free tier)
4. **Render** — https://render.com (for backend hosting, free tier)
5. **Vercel** — https://vercel.com (for frontend hosting, free tier)

---

### Step 2: MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com → Create free account
2. Create a **free M0 cluster** (choose any region)
3. Create a database user (username + password)
4. Under **Network Access** → Add `0.0.0.0/0` (allow all IPs for Render)
5. Click **Connect** → **Drivers** → Copy the connection string
6. It will look like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dental_db?retryWrites=true&w=majority`

---

### Step 3: Cloudinary Setup

1. Go to https://cloudinary.com → Sign up free
2. From your **Dashboard**, copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

### Step 4: Push Code to GitHub

Run these commands in your terminal:

```bash
cd "c:\Users\vruta\CODES\SEM 7\MP1"
git init
git add .
git commit -m "Initial commit: Dental AI full-stack application"
```

Then go to **GitHub** → **New Repository**:
- Name: `dental-ai-detection`
- Set to **Public** or **Private**
- Do NOT initialize with README
- Click **Create Repository**

Then push:
```bash
git remote add origin https://github.com/VRUTANSH22/dental-ai-detection.git
git branch -M main
git push -u origin main
```

---

### Step 5: Deploy Backend on Render

1. Go to https://render.com → Sign up with GitHub
2. Click **New** → **Web Service**
3. Connect your `dental-ai-detection` GitHub repo
4. Configure:
   - **Name**: `dental-ai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1`
5. Under **Environment Variables**, add ALL of these:

| Variable | Value |
|----------|-------|
| `APP_ENV` | `production` |
| `DEBUG` | `false` |
| `JWT_SECRET_KEY` | *(generate a random 64-char string)* |
| `MONGODB_URI` | *(paste your Atlas connection string)* |
| `MONGODB_DB_NAME` | `dental_db` |
| `CLOUDINARY_CLOUD_NAME` | *(from Cloudinary dashboard)* |
| `CLOUDINARY_API_KEY` | *(from Cloudinary dashboard)* |
| `CLOUDINARY_API_SECRET` | *(from Cloudinary dashboard)* |
| `FRONTEND_URL` | *(your Vercel URL, set after Step 6)* |
| `ALLOWED_ORIGINS` | *(your Vercel URL, set after Step 6)* |
| `MODEL_PATH` | `../models/efficientnet_b0_dental.pth` |
| `CLASS_MAPPING_PATH` | `../models/class_mapping.json` |
| `DISEASE_INFO_PATH` | `../models/disease_info.json` |

6. Click **Create Web Service** → Wait for deploy (~5-10 min first time)
7. Copy your Render URL (e.g., `https://dental-ai-backend.onrender.com`)

---

### Step 6: Deploy Frontend on Vercel

1. Go to https://vercel.com → Sign up with GitHub
2. Click **Import Project** → Select `dental-ai-detection`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://dental-ai-backend.onrender.com` *(your Render URL)* |

5. Click **Deploy** → Wait ~2 min
6. Your site will be live at `https://dental-ai-detection.vercel.app`

---

### Step 7: Update CORS (Final Step)

Go back to **Render Dashboard** → Your backend service → **Environment**:
- Update `FRONTEND_URL` to `https://dental-ai-detection.vercel.app`
- Update `ALLOWED_ORIGINS` to `https://dental-ai-detection.vercel.app`
- Click **Save** → Service will auto-redeploy

---

## Generate JWT Secret Key

Run this in PowerShell to generate a secure JWT secret:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
```

## Verify Deployment

1. Visit your Vercel URL → Should see the Home page
2. Check `https://your-render-url.onrender.com/health` → Should return `{"status": "healthy"}`
3. Try registering a new account
4. Upload a dental image to test prediction
