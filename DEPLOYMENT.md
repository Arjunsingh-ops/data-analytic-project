# Production Deployment Guide: SalesPulse Analytics Platform

This guide provides step-by-step instructions for hosting the **Python Flask backend on Render** and the **Next.js frontend on Vercel**.

---

## 🏗️ Architecture Overview

| Tier | Technology | Hosting Platform | Key Environment Variables |
| :--- | :--- | :--- | :--- |
| **Backend API** | Python 3.11, Flask, pandas, Gunicorn | **Render** (Web Service) | `FLASK_ENV`, `PORT`, `CORS_ORIGINS` |
| **Frontend UI** | Next.js 16 (App Router), React 19, Tailwind CSS | **Vercel** | `NEXT_PUBLIC_API_URL` |

---

## 🐍 Part 1: Deploy Backend to Render

### Option A: Using the Render Blueprint (Recommended)
This repository includes a [`render.yaml`](file:///d:/data%20analytic%20project/render.yaml) file for infrastructure-as-code deployment.

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Blueprint**.
3. Connect your Git repository.
4. Render will automatically detect [`render.yaml`](file:///d:/data%20analytic%20project/render.yaml) and configure:
   - **Service Type**: Web Service
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --chdir backend sales_analytics:app --bind 0.0.0.0:$PORT`
   - **Health Check Path**: `/health`
5. Click **Apply**.
6. Once deployed, note your service URL (e.g. `https://sales-analytics-backend.onrender.com`).

---

### Option B: Manual Web Service Setup on Render
1. Log in to [Render](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Select your GitHub repository.
3. Configure the following settings:
   - **Name**: `sales-analytics-backend`
   - **Region**: Select closest to your users (e.g., Oregon, Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `.` (leave empty for repository root)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --chdir backend sales_analytics:app --bind 0.0.0.0:$PORT`
4. Add the following **Environment Variables**:
   | Variable | Recommended Value | Description |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.11.15` | Required Python runtime |
   | `FLASK_ENV` | `production` | Disables debug mode and enables strict security |
   | `FLASK_DEBUG` | `0` | Disables Flask debug server |
   | `CORS_ORIGINS` | `*` (or your Vercel domain) | Allowed origin for frontend API requests |
5. Under **Advanced**, set **Health Check Path** to `/health`.
6. Click **Create Web Service**.

> [!NOTE]
> **Ephemeral Disk Storage on Render**: Render free-tier web services use an ephemeral filesystem. Any CSV uploaded in-memory will persist across requests during the active instance lifecycle, but will reset upon container spin-down or new deployment. For long-term production persistence, attach a Render Persistent Disk or integrate cloud object storage (AWS S3, Google Cloud Storage, or PostgreSQL).

---

## ⚛️ Part 2: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New...** > **Project**.
2. Import your GitHub repository.
3. In the project configuration modal:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click `Edit` and select `dashboard`.
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
4. Add the **Environment Variable**:
   | Key | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | Your Render backend URL (e.g., `https://sales-analytics-backend.onrender.com`) |
5. Click **Deploy**.
6. Once deployment finishes, copy your live Vercel URL (e.g. `https://salespulse-analytics.vercel.app`).

---

## 🔒 Part 3: Production Security Lockdown

Once both services are deployed:
1. Return to your Render backend service.
2. Update the `CORS_ORIGINS` environment variable from `*` to your actual Vercel domain:
   ```env
   CORS_ORIGINS=https://salespulse-analytics.vercel.app
   ```
3. Save changes; Render will redeploy automatically.

---

## 🧪 Post-Deployment Verification Checklist

- [ ] **Backend Health Probe**:
  Visit `https://<your-backend>.onrender.com/health` in your browser. Verify you receive:
  ```json
  {
    "status": "healthy",
    "dataset": { "status": "ready_for_data", "record_count": 0 }
  }
  ```
- [ ] **Frontend Loading**:
  Visit your Vercel URL. Confirm the dashboard loads without hydration errors.
- [ ] **Live Connectivity Indicator**:
  Check the sidebar bottom status: it should display `API: healthy` with a pulsing green indicator.
- [ ] **Data Ingestion Flow**:
  Upload a test CSV via the frontend uploader or via terminal:
  ```bash
  curl -X POST -F "file=@your_sales_data.csv" https://<your-backend>.onrender.com/api/upload
  ```
- [ ] **Interactive Visualizations**:
  Verify the Revenue Timeline area chart, Top Products horizontal bar chart, Regional Impact distribution, and Transaction Ledger render the uploaded numbers accurately.
- [ ] **Filtering**:
  Test date range filtering, regional filters, and quick presets.
- [ ] **Export**:
  Click the "Export CSV" button and confirm that filtered transactions download cleanly.
