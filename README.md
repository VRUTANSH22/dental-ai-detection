# ?? AI-Based Dental Disease Detection System

> An end-to-end, production-ready web application that uses deep learning to detect dental diseases from X-ray / oral images, generates Grad-CAM heatmaps for explainability, and provides a full doctor-review & appointment workflow.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://dental-ai-detection-final.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://dental-ai-detection-9t1g.onrender.com/health)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/atlas)

---

## ?? Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [AI Model](#-ai-model--efficientnet-b0)
- [User Roles](#-user-roles)
- [Project Structure](#-project-structure)
- [Getting Started Local](#-getting-started-local)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)

---

## ?? Overview

This is my **Semester 7 Major Project (MP-1)** — a full-stack AI web application for dental disease detection. The system allows patients to upload dental images, which are analyzed by an **EfficientNet-B0** deep learning model trained on a custom dental disease dataset. Results include:

- **Disease classification** with confidence scores
- **Grad-CAM heatmap** overlaid on the original image (explainable AI)
- **Doctor review** where a dentist can add professional notes
- **PDF report generation** for each prediction
- **Appointment booking** between patients and doctors
- **Role-based dashboards** for Patients, Doctors, and Admins

---

## ? Key Features

| Feature | Description |
|---|---|
| ?? **AI Inference** | EfficientNet-B0 trained on dental disease images; classifies 7+ disease categories |
| ?? **Grad-CAM** | Visual explanation showing which region of the image triggered the prediction |
| ????? **Doctor Review** | Doctors can review AI predictions and add professional notes/corrections |
| ?? **PDF Reports** | Auto-generated downloadable reports with prediction details and Grad-CAM image |
| ?? **Appointments** | Patients can book appointments with doctors directly from the dashboard |
| ?? **Email Verification** | Full email-based registration with OTP/link verification |
| ?? **JWT Auth** | Secure access + refresh token system with role-based route protection |
| ?? **Google OAuth** | One-click login with Google account |
| ??? **Cloudinary** | Images are stored on Cloudinary CDN (not on server disk) |
| ?? **Responsive UI** | Fully responsive dark-themed React UI with smooth animations |
| ?? **Rate Limiting** | API rate limiting via SlowAPI to prevent abuse |
| ?? **Smart Failover** | Frontend auto-retries Render backend on cold start, falls back to localhost in dev |

---

## ?? Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | **FastAPI** (Python 3.11) |
| ML / DL | **PyTorch** + **TorchVision** (EfficientNet-B0) |
| Explainability | **Grad-CAM** (custom implementation) |
| Database | **MongoDB Atlas** via Motor (async) |
| Image Storage | **Cloudinary** |
| Auth | **JWT** (python-jose) + **bcrypt** |
| Email | **aiosmtplib** (async SMTP / Gmail) |
| PDF | **ReportLab** |
| Server | **Uvicorn** + **Gunicorn** |
| Rate Limiting | **SlowAPI** |
| OAuth | **Authlib** (Google OAuth 2.0) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | **React 18** (Vite) |
| Routing | **React Router v6** |
| HTTP Client | **Axios** (with smart failover) |
| Styling | **Vanilla CSS** (custom design system, dark mode) |
| State | **React Context API** |
| Hosting | **Vercel** |

---

## ?? System Architecture

```
+------------------------------------------------------------------+
|                        User Browser                               |
|   React SPA (Vite) — Hosted on Vercel                           |
|   Routes: /, /predict, /dashboard/*, /diseases, /about          |
+---------------------------+--------------------------------------+
                            |  HTTPS (Axios + smart retry)
                            v
+------------------------------------------------------------------+
|              FastAPI Backend — Hosted on Render                   |
|                                                                   |
|  +------------+  +-------------+  +---------------+             |
|  | Auth API   |  | Predict API |  | Appointment   |             |
|  | /api/auth  |  | /api/predict|  | /api/appts    |             |
|  +------------+  +------+------+  +---------------+             |
|                         |                                         |
|               +---------v---------+                               |
|               |  AI Inference     |                               |
|               |  EfficientNet-B0  |                               |
|               |  + Grad-CAM       |                               |
|               +-------------------+                               |
+--------+--------------------+------------------------------------+
         |                    |
         v                    v
  +-------------+    +--------------+
  | MongoDB Atlas|   |  Cloudinary  |
  |  (Database) |    |  (Images)    |
  +-------------+    +--------------+
```

**Failover Logic (Axios):**
- On **production**: Frontend calls Render. If cold-starting (502/503), retries up to 3 times.
- On **local dev**: Frontend calls Render first. If unreachable, falls back to `http://localhost:8000`.

---

## ?? AI Model — EfficientNet-B0

- **Architecture:** EfficientNet-B0 (pre-trained on ImageNet, fine-tuned on dental dataset)
- **Input:** 224x224 RGB dental images
- **Output:** Multi-class probability scores + top prediction
- **Preprocessing:** Resize ? ToTensor ? Normalize (ImageNet mean/std)
- **Explainability:** Grad-CAM on `model.features[-1]` (last convolutional block)
- **Training Notebook:** `dental_diseases.ipynb`
- **Model File:** `efficientnet_b0_dental.pth` (~16 MB)

### Detectable Diseases
- Cavity / Dental Caries
- Gingivitis
- Tooth Discoloration
- Mouth Ulcer
- Calculus (Tartar)
- Hypodontia
- Healthy Teeth

---

## ?? User Roles

### ?? Patient
- Register / Login / Google OAuth
- Upload dental images for AI analysis
- View predictions with Grad-CAM heatmaps
- Download PDF reports
- Book appointments with doctors
- View prediction history in dashboard

### ????? Doctor
- View assigned patients predictions
- Add professional review notes to AI predictions
- Manage appointment requests (approve/reject/reschedule)
- View patient history

### ?? Admin
- Manage all users (promote/demote roles)
- View all predictions across the system
- Read contact/support messages
- Monitor system activity

---

## ?? Project Structure

```
MP1/
+-- backend/                      # FastAPI Python backend
¦   +-- main.py                   # App entry point, middleware, lifespan
¦   +-- config/
¦   ¦   +-- settings.py           # Pydantic settings (env vars)
¦   +-- database/
¦   ¦   +-- mongodb.py            # MongoDB connection (Motor async)
¦   +-- models/                   # Pydantic data models
¦   +-- routes/                   # API route definitions
¦   ¦   +-- auth.py               # Register, login, OAuth, tokens
¦   ¦   +-- prediction.py         # AI inference endpoint
¦   ¦   +-- patient.py            # Patient profile & history
¦   ¦   +-- doctor.py             # Doctor review endpoints
¦   ¦   +-- admin.py              # Admin management
¦   ¦   +-- appointment.py        # Appointment CRUD
¦   ¦   +-- reports.py            # PDF generation
¦   ¦   +-- contact.py            # Contact form
¦   +-- services/
¦   ¦   +-- ai_service.py         # EfficientNet-B0 + Grad-CAM inference
¦   ¦   +-- cloudinary_service.py # Image upload/retrieval
¦   ¦   +-- email_service.py      # Verification & notification emails
¦   ¦   +-- pdf_service.py        # ReportLab PDF generation
¦   +-- utils/
¦   ¦   +-- security.py           # JWT + bcrypt password hashing
¦   +-- requirements.txt
¦
+-- frontend/                     # React + Vite frontend
¦   +-- src/
¦   ¦   +-- App.jsx               # Route definitions (lazy-loaded)
¦   ¦   +-- api/
¦   ¦   ¦   +-- axios.js          # Axios client with failover logic
¦   ¦   +-- context/
¦   ¦   ¦   +-- AuthContext.jsx   # Global auth state
¦   ¦   +-- pages/
¦   ¦   ¦   +-- Home.jsx
¦   ¦   ¦   +-- Predict.jsx       # Image upload & AI trigger
¦   ¦   ¦   +-- PredictionResult.jsx  # Grad-CAM + results view
¦   ¦   ¦   +-- Diseases.jsx      # Disease information page
¦   ¦   ¦   +-- dashboard/
¦   ¦   ¦       +-- patient/      # Patient dashboard pages
¦   ¦   ¦       +-- doctor/       # Doctor dashboard pages
¦   ¦   ¦       +-- admin/        # Admin dashboard pages
¦   ¦   +-- index.css             # Global styles & design system
¦   +-- vercel.json               # Vercel SPA routing config
¦
+-- models/                       # ML model files
¦   +-- efficientnet_b0_dental.pth
¦   +-- class_mapping.json
¦   +-- disease_info.json
¦
+-- dental_diseases.ipynb         # Model training notebook
+-- vercel.json                   # Root Vercel config (forces Vite build)
+-- Procfile                      # Render deployment command
+-- DEPLOYMENT.md                 # Step-by-step deployment guide
```

---

## ?? Getting Started Local

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas URI)

### 1. Clone

```bash
git clone https://github.com/VRUTANSH22/dental-ai-detection.git
cd dental-ai-detection
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env         # Fill in values (see below)
python main.py
# API at: http://localhost:8000
# Docs at: http://localhost:8000/api/docs
```

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
# App at: http://localhost:5173
```

---

## ?? Environment Variables

### Backend (`backend/.env`)

```env
APP_ENV=development
DEBUG=True

# REQUIRED — generate with: python -c "import secrets; print(secrets.token_hex(64))"
JWT_SECRET_KEY=your_very_long_random_secret_key_here

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/
MONGODB_DB_NAME=dental_db

# Cloudinary (free tier works fine)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gmail SMTP (use App Password, not main password)
SMTP_USERNAME=your_gmail@gmail.com
SMTP_PASSWORD=your_16_char_app_password

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=https://dental-ai-detection-9t1g.onrender.com
VITE_FALLBACK_API_URL=http://localhost:8000
```

---

## ?? API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check + model status |
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, get JWT tokens |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/google` | No | Google OAuth login |
| POST | `/api/predict` | Yes | Upload image ? AI prediction + Grad-CAM |
| GET | `/api/predict/{id}` | Yes | Fetch single prediction result |
| GET | `/api/patient/predictions` | Patient | List own predictions |
| GET | `/api/doctor/review` | Doctor | Predictions awaiting review |
| POST | `/api/doctor/review/{id}` | Doctor | Submit doctor review notes |
| GET | `/api/appointment` | Yes | List appointments |
| POST | `/api/appointment` | Patient | Book appointment |
| GET | `/api/reports/{id}` | Yes | Download PDF report |
| GET | `/api/admin/users` | Admin | List all users |
| POST | `/api/contact` | No | Submit contact message |

---

## ?? Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | https://dental-ai-detection-final.vercel.app |
| Backend | Render | https://dental-ai-detection-9t1g.onrender.com |
| Database | MongoDB Atlas | Cloud |
| Images | Cloudinary | CDN |

### Render (Backend)
1. New Web Service ? connect GitHub repo
2. Root directory: `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `gunicorn main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
5. Add all env vars in Render dashboard

### Vercel (Frontend)
1. Import project ? connect GitHub
2. Vercel auto-detects Vite config
3. Add `VITE_API_URL` in Environment Variables

> See `DEPLOYMENT.md` for the full step-by-step guide.

---

## ?? Academic Context

**Minor Project 1 (MP-1) — Semester 7, B.Tech Computer Engineering**

- **Domain:** Artificial Intelligence + Healthcare
- **Core Technique:** Transfer Learning (EfficientNet-B0), Grad-CAM Explainability
- **Report:** `MU_Report vrutansh last final.pdf`
- **Presentation:** `MP-1 review 2 presentation.pptx`

---

## ????? Author

**Vrutansh** — B.Tech Computer Engineering, Semester 7

GitHub: [@VRUTANSH22](https://github.com/VRUTANSH22)

---

## ?? License

This project is for academic purposes. All rights reserved © 2024 Vrutansh.
