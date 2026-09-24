# SalesPulse | Production Sales Data Analytics Platform

A professional, full-stack enterprise business intelligence and sales analytics dashboard built with **Python (Flask, pandas, NumPy)** and **Next.js 16 (App Router, React 19, Tailwind CSS v4, Recharts)**.

---

## 🌟 Key Features

- **Executive Analytics Engine**: High-performance pandas and NumPy data processing pipeline for loading, cleaning, validating, and calculating sales metrics.
- **Production-Grade Data Hygiene**:
  - Auto-sanitizes currency symbols (`$`, `,`), negative values, unparseable dates, and duplicates.
  - Zero-division safety: edge cases and empty datasets return normalized zeros rather than breaking.
- **RESTful API Architecture**:
  - `GET /health` – Real-time health check, uptime, and dataset status.
  - `GET /api/analytics` – Complete aggregated dashboard data with date and region filters.
  - `GET /api/trends` – Timeline sales trajectories with interval aggregation.
  - `GET /api/products/top` – Top revenue-generating products with revenue share.
  - `GET /api/regions` – Geographic performance and regional distribution.
  - `GET /api/transactions` – Paginated and sortable raw transaction ledger.
  - `POST /api/upload` – Ingest custom sales CSV files with validation and on-disk persistence.
  - `POST /api/reset` – Clean dataset reset.
- **Modern SaaS Dashboard UI**:
  - Collapsible navigation sidebar with live backend status indicator.
  - 4 Executive KPI cards with ambient glow accents and order averages.
  - Interactive Recharts area timeline with metric switchers (Revenue, Units, Orders).
  - Top products ranking with horizontal bar chart and revenue share percentages.
  - Regional impact analysis with bar and donut distribution views.
  - Transaction ledger with search, multi-column sorting, pagination, and CSV export.
  - Drag-and-drop CSV ingestion modal with schema validation.
  - Dark and Light theme switcher.
  - Responsive across Mobile, Tablet, Laptop, and Desktop.

---

## 📂 Project Structure

```text
d:\data analytic project\
├── backend/
│   ├── __init__.py              # Python package marker
│   ├── sales_analytics.py       # Core Flask REST API and pandas pipeline
│   ├── requirements.txt         # Pinned backend dependencies
│   └── .env.example             # Backend environment template
├── dashboard/
│   ├── src/
│   │   ├── app/                 # Next.js App Router (layout, globals.css, page)
│   │   ├── components/          # Modular React components:
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── KPICards.tsx
│   │   │   ├── Charts.tsx
│   │   │   ├── TransactionsTable.tsx
│   │   │   ├── DataManagement.tsx
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ProductionEmptyState.tsx
│   │   └── lib/
│   │       └── api.ts           # Typed API client and data models
│   ├── package.json             # Frontend dependencies (Next 16, React 19)
│   ├── vercel.json              # Vercel deployment configuration
│   └── .env.example             # Frontend environment template
├── tests/
│   └── test_sales_analytics.py  # 25 automated pytest unit and integration tests
├── Procfile                     # Gunicorn web process definition for Render
├── render.yaml                  # Render Infrastructure-as-Code blueprint
├── DEPLOYMENT.md                # Step-by-step production hosting manual
├── requirements.txt             # Pinned root dependencies
└── wsgi.py                      # Root WSGI application entrypoint
```

---

## 🚀 Quickstart (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Start the Flask Backend
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start backend server (runs on port 5000)
python backend/sales_analytics.py
```
Backend API will be live at `http://localhost:5000`.

### 2. Start the Next.js Frontend
```bash
# Navigate to dashboard directory
cd dashboard

# Install npm dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing

Run the backend test suite:
```bash
python -m pytest -v tests/
```
All 25 automated unit and integration tests cover:
- Data loading, empty buffers, and file error handling
- Column validation, currency cleaning, and deduplication
- Zero-division safety on empty datasets
- Trend aggregations, product rankings, and regional breakdowns
- REST API routes (`/health`, `/api/analytics`, `/api/trends`, `/api/products/top`, `/api/regions`, `/api/transactions`, `/api/upload`, `/api/reset`)

Run frontend linting and production build verification:
```bash
cd dashboard
npm run lint
npm run build
```

---

## ☁️ Production Hosting

Detailed instructions are available in [DEPLOYMENT.md](file:///d:/data%20analytic%20project/DEPLOYMENT.md).

- **Render**: Deploy the Python Flask backend with zero configuration using the included [`render.yaml`](file:///d:/data%20analytic%20project/render.yaml) or Procfile (`gunicorn --chdir backend sales_analytics:app --bind 0.0.0.0:$PORT`).
- **Vercel**: Deploy the Next.js frontend with root directory set to `dashboard` and set `NEXT_PUBLIC_API_URL` to your Render backend URL.
