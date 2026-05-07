"""
Sales Data Analytics Backend
=============================
A clean and modular Python backend for performing sales data analysis.
Accepts CSV input, cleans data, and returns structured results for frontend use.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from flask import Flask, jsonify
from flask_cors import CORS

# ---------------------------------------------------------------------------
# FLASK APP
# ---------------------------------------------------------------------------

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return {"message": "Backend Running Successfully"}


# API Endpoint
@app.route("/analyze")
def analyze():

    try:
        output = run_analysis("backend/sample_sales_data.csv")
        return jsonify(output)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# 1. DATA LOADING
# ---------------------------------------------------------------------------

def load_data(filepath: str) -> pd.DataFrame:

    try:
        df = pd.read_csv(filepath)

        if df.empty:
            raise ValueError("The CSV file is empty.")

        print(f"[INFO] Loaded {len(df)} rows and {len(df.columns)} columns.")

        return df

    except FileNotFoundError:
        raise FileNotFoundError(f"File not found: {filepath}")

    except pd.errors.EmptyDataError:
        raise ValueError("The file contains no data.")


# ---------------------------------------------------------------------------
# 2. DATA CLEANING
# ---------------------------------------------------------------------------

def clean_data(df: pd.DataFrame) -> pd.DataFrame:

    initial_rows = len(df)

    # Strip whitespace from column names
    df.columns = df.columns.str.strip()

    # Strip whitespace from string columns
    string_cols = df.select_dtypes(include=["object"]).columns

    for col in string_cols:
        df[col] = df[col].str.strip()

    # Remove rows with null values
    df = df.dropna()

    dropped = initial_rows - len(df)

    if dropped:
        print(f"[INFO] Dropped {dropped} rows containing null values.")

    # Convert 'Date' column to datetime
    if "Date" not in df.columns:
        raise KeyError("CSV must contain a 'Date' column.")

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

    # Drop rows where date conversion failed
    invalid_dates = df["Date"].isna().sum()

    if invalid_dates:
        df = df.dropna(subset=["Date"])

        print(f"[INFO] Dropped {invalid_dates} rows with unparseable dates.")

    print(f"[INFO] Cleaning complete. {len(df)} rows remaining.")

    return df.reset_index(drop=True)


# ---------------------------------------------------------------------------
# 3. METRICS CALCULATION
# ---------------------------------------------------------------------------

def calculate_metrics(df: pd.DataFrame) -> Dict[str, Any]:

    total_sales = float(np.sum(df["Sales"]))
    total_quantity = int(np.sum(df["Quantity"]))
    total_transactions = len(df)

    avg_sale = float(np.mean(df["Sales"]))
    avg_qty = float(np.mean(df["Quantity"]))

    return {
        "total_sales": round(total_sales, 2),
        "total_quantity": total_quantity,
        "total_transactions": total_transactions,
        "average_sale_per_transaction": round(avg_sale, 2),
        "average_quantity_per_transaction": round(avg_qty, 2),
    }


# ---------------------------------------------------------------------------
# 4. SALES TREND OVER TIME
# ---------------------------------------------------------------------------

def get_sales_trend(df: pd.DataFrame) -> Dict[str, Any]:

    df = df.copy()

    # Create a Year-Month period for grouping
    df["YearMonth"] = df["Date"].dt.to_period("M")

    trend = (
        df.groupby("YearMonth")["Sales"]
        .sum()
        .sort_index()
    )

    return {
        "labels": [str(period) for period in trend.index],
        "values": [round(float(v), 2) for v in trend.values],
    }


# ---------------------------------------------------------------------------
# 5. TOP SELLING PRODUCTS
# ---------------------------------------------------------------------------

def get_top_products(df: pd.DataFrame, n: int = 10) -> Dict[str, Any]:

    top = (
        df.groupby("Product")["Sales"]
        .sum()
        .sort_values(ascending=False)
        .head(n)
    )

    return {
        "labels": top.index.tolist(),
        "values": [round(float(v), 2) for v in top.values],
    }


# ---------------------------------------------------------------------------
# 6. REGION-WISE SALES ANALYSIS
# ---------------------------------------------------------------------------

def get_region_analysis(df: pd.DataFrame) -> Dict[str, Any]:

    region_group = df.groupby("Region").agg(
        total_sales=("Sales", "sum"),
        total_quantity=("Quantity", "sum"),
        transaction_count=("Sales", "count"),
    ).sort_values("total_sales", ascending=False)

    chart_data = {
        "labels": region_group.index.tolist(),
        "sales_values": [
            round(float(v), 2)
            for v in region_group["total_sales"]
        ],
        "quantity_values": [
            int(v)
            for v in region_group["total_quantity"]
        ],
    }

    details = {}

    for region, row in region_group.iterrows():

        details[region] = {
            "total_sales": round(float(row["total_sales"]), 2),
            "total_quantity": int(row["total_quantity"]),
            "transaction_count": int(row["transaction_count"]),
        }

    return {
        "chart_data": chart_data,
        "details": details,
    }


# ---------------------------------------------------------------------------
# 7. FULL ANALYSIS PIPELINE
# ---------------------------------------------------------------------------

def run_analysis(filepath: str, top_n: int = 10) -> Dict[str, Any]:

    # Step 1 – Load
    raw_df = load_data(filepath)

    # Step 2 – Clean
    clean_df = clean_data(raw_df)

    # Step 3 – Analyse
    results: Dict[str, Any] = {
        "metrics": calculate_metrics(clean_df),
        "sales_trend": get_sales_trend(clean_df),
        "top_products": get_top_products(clean_df, n=top_n),
        "region_analysis": get_region_analysis(clean_df),
    }

    print("[INFO] Analysis complete.")

    return results


# ---------------------------------------------------------------------------
# OLD STANDALONE EXECUTION (COMMENTED FOR RENDER)
# ---------------------------------------------------------------------------

"""
if __name__ == "__main__":

    import json
    import sys

    csv_path = sys.argv[1] if len(sys.argv) > 1 else "sample_sales_data.csv"

    try:
        output = run_analysis(csv_path)

        print("\\n" + "=" * 60)
        print("ANALYSIS RESULTS")
        print("=" * 60)

        print(json.dumps(output, indent=2))

    except (FileNotFoundError, ValueError, KeyError) as e:

        print(f"[ERROR] {e}")

        sys.exit(1)
"""


# ---------------------------------------------------------------------------
# RUN FLASK SERVER
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)