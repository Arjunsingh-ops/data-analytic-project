# Sales Data Analytics Project Structure

This document outlines the file structure and purpose of the core components in the Sales Data Analytics full-stack application.

## 📂 Directory Layout

```text
d:\data analytic project\
├── backend/
│   ├── sales_analytics.py       # Core data processing and analytics pipeline
│   └── sample_sales_data.csv    # Sample dataset for analytics (input data)
└── dashboard/                   # Next.js Frontend App
    ├── README.md                # Frontend-specific documentation
    ├── package.json             # Node.js dependencies and run scripts
    ├── public/                  # Static assets (images, icons)
    └── src/
        ├── app/                 # Next.js App Router (pages and layouts)
        └── components/          # Reusable React UI components (charts, cards, filters)
```

---

## 🐍 Backend Architecture (`backend/`)

The backend is built with Python, using `pandas` and `numpy` to ingest raw CSV data, clean it, and derive key business metrics.

### Key File: `sales_analytics.py`
This script acts as the data pipeline orchestrator. It executes the following stages:

1. **Data Loading (`load_data`)**: Reads the input CSV (`sample_sales_data.csv`) into a pandas DataFrame, validating that the file exists and contains data.
2. **Data Cleaning (`clean_data`)**: 
   - Removes null values.
   - Cleans up whitespace in strings and column names.
   - Parses date fields into standard Datetime objects.
3. **Metrics Calculation (`calculate_metrics`)**: Derives KPI aggregates (Total Sales, Total Quantity, Averages).
4. **Trend Analysis (`get_sales_trend`)**: Computes month-over-month sales performance.
5. **Top Products (`get_top_products`)**: Identifies the highest-grossing products.
6. **Regional Analysis (`get_region_analysis`)**: Groups and aggregates revenue and volume by geographical region.
7. **Full Orchestration (`run_analysis`)**: Groups all transformations together and yields a clean, structured dictionary (capable of being returned over an API as JSON) for the frontend.

---

## ⚛️ Frontend Dashboard (`dashboard/`)

The frontend is a modern web application built using **Next.js** (React) styled for displaying analytical metrics, charts, and reports gracefully.

- **`src/app/`**: Contains the page layout structure, driving the main dashboard view, potentially mapping URLs to specific analytical views.
- **`src/components/`**: Houses isolated, modular UI components. This is where you would build your data visualization components (e.g., Line charts for Trends, Bar charts for Top Products, and KPI summary cards) to display the payload returned from `sales_analytics.py`.
- **`package.json`**: Keeps track of all npm dependencies required to run the Next.js development server and build the application.
