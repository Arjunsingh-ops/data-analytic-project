# SalesPulse Analytics Dashboard (Frontend)

Modern, responsive business intelligence interface built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Recharts**.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env.local` file pointing to your Flask backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```
In production, point this to your deployed backend URL on Render (e.g. `https://sales-analytics-backend.onrender.com`).

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🛠️ Build and Lint

```bash
# Type check and production build
npm run build

# Run ESLint
npm run lint
```

---

## ☁️ Deploying to Vercel

1. Import the repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `dashboard`.
3. Add the environment variable `NEXT_PUBLIC_API_URL` with your Render backend URL.
4. Click **Deploy**.
