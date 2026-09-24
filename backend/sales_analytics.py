"""
Sales Data Analytics Backend
=============================
A robust, secure, and production-ready Python Flask backend for sales data analysis.
Accepts CSV input, cleans data, performs statistical aggregation, and exposes structured REST APIs.
"""

import os
import sys
import io
import time
import logging
from typing import Dict, Any, Optional, Tuple, List, Union
import pandas as pd
import numpy as np
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

# ---------------------------------------------------------------------------
# STRUCTURED LOGGING SETUP
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("sales_analytics")

# ---------------------------------------------------------------------------
# CONFIGURATION & ENVIRONMENT
# ---------------------------------------------------------------------------
DEFAULT_CSV_PATH = os.environ.get(
    "SALES_DATA_PATH",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "sales_data.csv"),
)
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
SERVER_START_TIME = time.time()

# In-memory storage for active dataset
ACTIVE_DATASET: Optional[pd.DataFrame] = None
ACTIVE_DATASET_NAME: str = "No dataset loaded"

# ---------------------------------------------------------------------------
# FLASK APPLICATION SETUP
# ---------------------------------------------------------------------------
app = Flask(__name__)

# Configure CORS
if CORS_ORIGINS == "*":
    CORS(app, resources={r"/*": {"origins": "*"}})
else:
    allowed_origins = [origin.strip() for origin in CORS_ORIGINS.split(",") if origin.strip()]
    CORS(app, resources={r"/*": {"origins": allowed_origins}})

# Maximum upload size (16MB)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024


@app.after_request
def apply_security_headers(response: Response) -> Response:
    """Add production security headers to all HTTP responses."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ---------------------------------------------------------------------------
# CENTRALIZED ERROR HANDLERS
# ---------------------------------------------------------------------------
@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        "success": False,
        "error": {
            "code": 400,
            "message": getattr(error, "description", "Bad Request")
        }
    }), 400


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": {
            "code": 404,
            "message": getattr(error, "description", "Resource not found")
        }
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "success": False,
        "error": {
            "code": 405,
            "message": "Method not allowed"
        }
    }), 405


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        "success": False,
        "error": {
            "code": 413,
            "message": "Uploaded file exceeds maximum size limit (16MB)"
        }
    }), 413


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    logger.exception("Unexpected server error: %s", error)
    return jsonify({
        "success": False,
        "error": {
            "code": 500,
            "message": "An internal server error occurred."
        }
    }), 500


# ---------------------------------------------------------------------------
# 1. DATA LOADING
# ---------------------------------------------------------------------------
def load_data(source: Union[str, io.BytesIO, io.StringIO]) -> pd.DataFrame:
    """
    Safely load tabular sales data from a filepath or file-like buffer into a DataFrame.
    Validates presence, non-emptiness, and readability.
    """
    try:
        if isinstance(source, str):
            if not os.path.exists(source):
                # Fallback check relative to script directory
                script_dir = os.path.dirname(os.path.abspath(__file__))
                alt_path = os.path.join(script_dir, os.path.basename(source))
                if os.path.exists(alt_path):
                    source = alt_path
                else:
                    raise FileNotFoundError(f"Dataset file not found at: {source}")

            df = pd.read_csv(source, skipinitialspace=True)
        else:
            df = pd.read_csv(source, skipinitialspace=True)

        if df.empty:
            raise ValueError("The provided CSV file contains no records.")

        logger.info("Successfully loaded dataset with %d rows and %d columns.", len(df), len(df.columns))
        return df

    except FileNotFoundError:
        raise
    except pd.errors.EmptyDataError:
        raise ValueError("The provided file is empty.")
    except pd.errors.ParserError as e:
        raise ValueError(f"Failed to parse CSV file: {str(e)}")
    except Exception as e:
        logger.error("Error reading CSV: %s", e)
        raise ValueError(f"Unable to read CSV data: {str(e)}")


# ---------------------------------------------------------------------------
# 2. DATA CLEANING & VALIDATION
# ---------------------------------------------------------------------------
REQUIRED_COLUMNS = ["date", "product", "region", "sales", "quantity"]


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans raw sales records:
    - Normalizes column names (case-insensitive matching)
    - Validates required fields
    - Converts Date to ISO datetime
    - Coerces Sales and Quantity to numeric, stripping currencies/commas
    - Cleans strings and drops duplicates
    - Filters out impossible or unrecoverable entries safely
    """
    if df.empty:
        raise ValueError("Cannot clean an empty dataset.")

    cleaned_df = df.copy()
    initial_rows = len(cleaned_df)

    # 1. Normalize column names (strip whitespace and lowercase for comparison)
    cleaned_df.columns = cleaned_df.columns.astype(str).str.strip()
    col_map = {c.lower(): c for c in cleaned_df.columns}

    missing_cols = [req for req in REQUIRED_COLUMNS if req not in col_map]
    if missing_cols:
        raise KeyError(
            f"Missing required columns in dataset: {', '.join([c.title() for c in missing_cols])}. "
            f"Required columns are: Date, Product, Region, Sales, Quantity."
        )

    # Rename canonical columns to standard casing: Date, Product, Region, Sales, Quantity
    rename_mapping = {
        col_map["date"]: "Date",
        col_map["product"]: "Product",
        col_map["region"]: "Region",
        col_map["sales"]: "Sales",
        col_map["quantity"]: "Quantity",
    }
    cleaned_df = cleaned_df.rename(columns=rename_mapping)

    # 2. Clean string columns (Product, Region)
    for col in ["Product", "Region"]:
        cleaned_df[col] = cleaned_df[col].astype(str).str.strip()
        # Treat empty string or "nan" as null
        cleaned_df[col] = cleaned_df[col].replace(["", "nan", "None", "null"], np.nan)

    # 3. Clean numeric fields: Sales and Quantity
    # Remove currency symbols, commas, or extra formatting
    if cleaned_df["Sales"].dtype == object:
        cleaned_df["Sales"] = (
            cleaned_df["Sales"]
            .astype(str)
            .str.replace(r"[\$,]", "", regex=True)
            .str.strip()
        )
    cleaned_df["Sales"] = pd.to_numeric(cleaned_df["Sales"], errors="coerce")

    if cleaned_df["Quantity"].dtype == object:
        cleaned_df["Quantity"] = (
            cleaned_df["Quantity"]
            .astype(str)
            .str.replace(r"[,]", "", regex=True)
            .str.strip()
        )
    cleaned_df["Quantity"] = pd.to_numeric(cleaned_df["Quantity"], errors="coerce")

    # 4. Clean Date
    cleaned_df["Date"] = pd.to_datetime(cleaned_df["Date"], errors="coerce")

    # 5. Drop rows with nulls in critical columns
    cleaned_df = cleaned_df.dropna(subset=["Date", "Sales", "Quantity", "Product", "Region"])

    # 6. Filter out non-sensical values (negative sales or zero/negative quantity)
    cleaned_df = cleaned_df[(cleaned_df["Sales"] >= 0) & (cleaned_df["Quantity"] > 0)]

    # 7. Deduplicate identical transactions
    dedup_rows = len(cleaned_df)
    cleaned_df = cleaned_df.drop_duplicates()
    duplicates_dropped = dedup_rows - len(cleaned_df)
    if duplicates_dropped > 0:
        logger.info("Removed %d duplicate rows.", duplicates_dropped)

    # 8. Sort chronologically
    cleaned_df = cleaned_df.sort_values(by="Date").reset_index(drop=True)

    rows_dropped = initial_rows - len(cleaned_df)
    logger.info("Data cleaning finished. Dropped %d invalid rows, %d rows remaining.", rows_dropped, len(cleaned_df))

    if cleaned_df.empty:
        raise ValueError("No valid records remain after dataset cleaning.")

    return cleaned_df


# ---------------------------------------------------------------------------
# 3. FILTERING HELPER
# ---------------------------------------------------------------------------
def filter_dataframe(
    df: pd.DataFrame,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    region: Optional[str] = None,
    product: Optional[str] = None,
) -> pd.DataFrame:
    """Filter DataFrame based on optional parameters."""
    if df.empty:
        return df

    filtered = df.copy()

    if start_date:
        try:
            start_dt = pd.to_datetime(start_date)
            filtered = filtered[filtered["Date"] >= start_dt]
        except Exception as e:
            logger.warning("Invalid start_date filter '%s': %s", start_date, e)

    if end_date:
        try:
            # Include entire end date up to end of that day
            end_dt = pd.to_datetime(end_date) + pd.Timedelta(days=1) - pd.Timedelta(nanoseconds=1)
            filtered = filtered[filtered["Date"] <= end_dt]
        except Exception as e:
            logger.warning("Invalid end_date filter '%s': %s", end_date, e)

    if region and region.lower() != "all":
        filtered = filtered[filtered["Region"].str.lower() == region.strip().lower()]

    if product and product.lower() != "all":
        filtered = filtered[filtered["Product"].str.lower() == product.strip().lower()]

    return filtered.reset_index(drop=True)


# ---------------------------------------------------------------------------
# 4. METRICS CALCULATION
# ---------------------------------------------------------------------------
def calculate_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculate key business KPIs with zero-division safety."""
    if df.empty:
        return {
            "total_sales": 0.0,
            "total_quantity": 0,
            "total_transactions": 0,
            "average_sale_per_transaction": 0.0,
            "average_quantity_per_transaction": 0.0,
            "highest_sale": 0.0,
            "lowest_sale": 0.0,
            "unique_products": 0,
            "unique_regions": 0,
        }

    total_sales = float(np.sum(df["Sales"]))
    total_quantity = int(np.sum(df["Quantity"]))
    total_transactions = len(df)

    avg_sale = float(np.mean(df["Sales"])) if total_transactions > 0 else 0.0
    avg_qty = float(np.mean(df["Quantity"])) if total_transactions > 0 else 0.0
    highest_sale = float(np.max(df["Sales"])) if total_transactions > 0 else 0.0
    lowest_sale = float(np.min(df["Sales"])) if total_transactions > 0 else 0.0

    return {
        "total_sales": round(total_sales, 2),
        "total_quantity": total_quantity,
        "total_transactions": total_transactions,
        "average_sale_per_transaction": round(avg_sale, 2),
        "average_quantity_per_transaction": round(avg_qty, 2),
        "highest_sale": round(highest_sale, 2),
        "lowest_sale": round(lowest_sale, 2),
        "unique_products": int(df["Product"].nunique()),
        "unique_regions": int(df["Region"].nunique()),
    }


# ---------------------------------------------------------------------------
# 5. SALES TREND OVER TIME
# ---------------------------------------------------------------------------
def get_sales_trend(df: pd.DataFrame, interval: str = "M") -> Dict[str, Any]:
    """
    Calculate sales timeline aggregated by month ('M') or day ('D').
    Returns timeline chart data and series values.
    """
    if df.empty:
        return {
            "labels": [],
            "values": [],
            "quantities": [],
            "transactions": [],
            "series": []
        }

    df_copy = df.copy()

    if interval.upper() == "D":
        df_copy["Period"] = df_copy["Date"].dt.strftime("%Y-%m-%d")
    else:
        df_copy["Period"] = df_copy["Date"].dt.to_period("M").astype(str)

    trend_agg = (
        df_copy.groupby("Period")
        .agg(
            total_sales=("Sales", "sum"),
            total_quantity=("Quantity", "sum"),
            transaction_count=("Sales", "count"),
        )
        .sort_index()
    )

    labels = trend_agg.index.tolist()
    values = [round(float(v), 2) for v in trend_agg["total_sales"]]
    quantities = [int(v) for v in trend_agg["total_quantity"]]
    transactions = [int(v) for v in trend_agg["transaction_count"]]

    series = [
        {
            "period": label,
            "sales": values[i],
            "quantity": quantities[i],
            "transactions": transactions[i],
        }
        for i, label in enumerate(labels)
    ]

    return {
        "labels": labels,
        "values": values,
        "quantities": quantities,
        "transactions": transactions,
        "series": series,
    }


# ---------------------------------------------------------------------------
# 6. TOP SELLING PRODUCTS
# ---------------------------------------------------------------------------
def get_top_products(df: pd.DataFrame, n: int = 10) -> Dict[str, Any]:
    """Calculate top-performing products ranked by sales revenue."""
    if df.empty:
        return {
            "labels": [],
            "values": [],
            "quantities": [],
            "revenue_shares": [],
            "items": [],
        }

    n = max(1, min(n, 100))
    total_revenue = float(np.sum(df["Sales"])) or 1.0

    prod_group = (
        df.groupby("Product")
        .agg(
            total_sales=("Sales", "sum"),
            total_quantity=("Quantity", "sum"),
            transaction_count=("Sales", "count"),
        )
        .sort_values(by="total_sales", ascending=False)
        .head(n)
    )

    labels = prod_group.index.tolist()
    values = [round(float(v), 2) for v in prod_group["total_sales"]]
    quantities = [int(v) for v in prod_group["total_quantity"]]
    shares = [round((val / total_revenue) * 100, 2) for val in values]

    items = [
        {
            "product": labels[i],
            "sales": values[i],
            "quantity": quantities[i],
            "transaction_count": int(prod_group["transaction_count"].iloc[i]),
            "share_percentage": shares[i],
        }
        for i in range(len(labels))
    ]

    return {
        "labels": labels,
        "values": values,
        "quantities": quantities,
        "revenue_shares": shares,
        "items": items,
    }


# ---------------------------------------------------------------------------
# 7. REGIONAL SALES ANALYSIS
# ---------------------------------------------------------------------------
def get_region_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculate geographical performance metrics with per-region breakdowns."""
    if df.empty:
        return {
            "chart_data": {
                "labels": [],
                "sales_values": [],
                "quantity_values": [],
            },
            "details": {},
            "items": [],
        }

    total_revenue = float(np.sum(df["Sales"])) or 1.0

    region_group = (
        df.groupby("Region")
        .agg(
            total_sales=("Sales", "sum"),
            total_quantity=("Quantity", "sum"),
            transaction_count=("Sales", "count"),
        )
        .sort_values("total_sales", ascending=False)
    )

    labels = region_group.index.tolist()
    sales_values = [round(float(v), 2) for v in region_group["total_sales"]]
    quantity_values = [int(v) for v in region_group["total_quantity"]]

    details: Dict[str, Any] = {}
    items = []

    for region, row in region_group.iterrows():
        sales = round(float(row["total_sales"]), 2)
        qty = int(row["total_quantity"])
        tx_count = int(row["transaction_count"])
        avg_sale = round(sales / tx_count, 2) if tx_count > 0 else 0.0
        pct = round((sales / total_revenue) * 100, 2)

        reg_data = {
            "region": str(region),
            "total_sales": sales,
            "total_quantity": qty,
            "transaction_count": tx_count,
            "average_sale": avg_sale,
            "revenue_percentage": pct,
        }
        details[str(region)] = reg_data
        items.append(reg_data)

    return {
        "chart_data": {
            "labels": labels,
            "sales_values": sales_values,
            "quantity_values": quantity_values,
        },
        "details": details,
        "items": items,
    }


# ---------------------------------------------------------------------------
# 8. ACTIVE DATASET MANAGEMENT & PIPELINE ORCHESTRATION
# ---------------------------------------------------------------------------
def get_active_dataset() -> pd.DataFrame:
    """Retrieve or initialize the active cleaned DataFrame."""
    global ACTIVE_DATASET, ACTIVE_DATASET_NAME

    if ACTIVE_DATASET is not None:
        return ACTIVE_DATASET

    if os.path.exists(DEFAULT_CSV_PATH) and os.path.getsize(DEFAULT_CSV_PATH) > 0:
        try:
            logger.info("Initializing active dataset from persistent storage: %s", DEFAULT_CSV_PATH)
            raw_df = load_data(DEFAULT_CSV_PATH)
            ACTIVE_DATASET = clean_data(raw_df)
            ACTIVE_DATASET_NAME = os.path.basename(DEFAULT_CSV_PATH)
            return ACTIVE_DATASET
        except Exception as e:
            logger.warning("Could not load dataset from %s: %s", DEFAULT_CSV_PATH, e)

    logger.info("No active sales dataset file found. Initializing clean production state awaiting upload.")
    ACTIVE_DATASET = pd.DataFrame(columns=["Date", "Product", "Region", "Sales", "Quantity"])
    ACTIVE_DATASET_NAME = "No dataset loaded"
    return ACTIVE_DATASET


def run_analysis(
    filepath_or_df: Union[str, pd.DataFrame] = DEFAULT_CSV_PATH,
    top_n: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    region: Optional[str] = None,
    product: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main analytics pipeline function.
    Accepts filepath or DataFrame, applies optional filters, and computes all analytical layers.
    """
    if isinstance(filepath_or_df, pd.DataFrame):
        df = filepath_or_df
    else:
        if os.path.exists(filepath_or_df) and os.path.getsize(filepath_or_df) > 0:
            raw_df = load_data(filepath_or_df)
            df = clean_data(raw_df)
        else:
            df = pd.DataFrame(columns=["Date", "Product", "Region", "Sales", "Quantity"])

    if df.empty:
        return {
            "success": True,
            "dataset_info": {
                "source_name": ACTIVE_DATASET_NAME,
                "total_rows": 0,
                "filtered_rows": 0,
                "date_range": {
                    "min": "",
                    "max": "",
                },
                "available_regions": ["All"],
                "available_products": ["All"],
            },
            "metrics": calculate_metrics(df),
            "sales_trend": get_sales_trend(df),
            "top_products": get_top_products(df, n=top_n),
            "region_analysis": get_region_analysis(df),
            "recent_transactions": [],
        }

    # Apply filters if provided
    filtered_df = filter_dataframe(df, start_date=start_date, end_date=end_date, region=region, product=product)

    # Date range bounds from full dataset
    min_date = df["Date"].min().strftime("%Y-%m-%d") if not df.empty else ""
    max_date = df["Date"].max().strftime("%Y-%m-%d") if not df.empty else ""

    available_regions = ["All"] + sorted(df["Region"].unique().tolist()) if not df.empty else ["All"]
    available_products = ["All"] + sorted(df["Product"].unique().tolist()) if not df.empty else ["All"]

    # Recent transactions formatted for the data table
    recent_transactions = []
    if not filtered_df.empty:
        sample_rows = filtered_df.tail(20).iloc[::-1]  # Most recent first
        for idx, row in sample_rows.iterrows():
            recent_transactions.append({
                "id": int(idx),
                "date": row["Date"].strftime("%Y-%m-%d"),
                "product": str(row["Product"]),
                "region": str(row["Region"]),
                "quantity": int(row["Quantity"]),
                "sales": round(float(row["Sales"]), 2),
            })

    results: Dict[str, Any] = {
        "success": True,
        "dataset_info": {
            "source_name": ACTIVE_DATASET_NAME,
            "total_rows": len(df),
            "filtered_rows": len(filtered_df),
            "date_range": {
                "min": min_date,
                "max": max_date,
            },
            "available_regions": available_regions,
            "available_products": available_products,
        },
        "metrics": calculate_metrics(filtered_df),
        "sales_trend": get_sales_trend(filtered_df),
        "top_products": get_top_products(filtered_df, n=top_n),
        "region_analysis": get_region_analysis(filtered_df),
        "recent_transactions": recent_transactions,
    }

    return results


# ---------------------------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------------------------

@app.route("/", methods=["GET"])
def index():
    """Root info endpoint providing API documentation and health status."""
    return jsonify({
        "status": "online",
        "service": "Sales Data Analytics API",
        "version": "2.0.0",
        "documentation": {
            "endpoints": {
                "GET /health": "Server health status, uptime, and dataset information",
                "GET /api/analytics": "Complete aggregated dashboard metrics and charts (supports query filters)",
                "GET /api/trends": "Sales timeline trends (params: start_date, end_date, region, interval)",
                "GET /api/products/top": "Top selling products breakdown (params: limit, region, start_date, end_date)",
                "GET /api/regions": "Regional performance data",
                "GET /api/transactions": "Paginated and filtered raw transactions",
                "POST /api/upload": "Upload custom sales CSV dataset to replace or inspect data",
                "POST /api/reset": "Reset dataset back to default sample sales data",
                "GET /analyze": "Legacy backward-compatible analysis endpoint",
            }
        }
    })


@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health_check():
    """Structured health check endpoint for monitoring, Docker, and Render."""
    try:
        df = get_active_dataset()
        dataset_status = "healthy"
        rows = len(df)
    except Exception as e:
        logger.error("Health check dataset probe failed: %s", e)
        dataset_status = f"unhealthy: {str(e)}"
        rows = 0

    uptime_seconds = round(time.time() - SERVER_START_TIME, 2)

    return jsonify({
        "status": "healthy" if dataset_status == "healthy" else "degraded",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "uptime_seconds": uptime_seconds,
        "dataset": {
            "name": ACTIVE_DATASET_NAME,
            "status": dataset_status,
            "record_count": rows,
        }
    }), 200 if dataset_status == "healthy" else 503


@app.route("/api/analytics", methods=["GET"])
@app.route("/analyze", methods=["GET"])
def api_analytics():
    """
    Main dashboard analytics endpoint.
    Supports query filters:
      - start_date (YYYY-MM-DD)
      - end_date (YYYY-MM-DD)
      - region (string)
      - product (string)
      - top_n (integer, default 10)
    """
    try:
        df = get_active_dataset()

        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        region = request.args.get("region")
        product = request.args.get("product")

        try:
            top_n = int(request.args.get("top_n", 10))
        except ValueError:
            top_n = 10

        payload = run_analysis(
            df,
            top_n=top_n,
            start_date=start_date,
            end_date=end_date,
            region=region,
            product=product,
        )

        return jsonify(payload), 200

    except Exception as e:
        logger.exception("Error executing /api/analytics: %s", e)
        return jsonify({
            "success": False,
            "error": {
                "code": 500,
                "message": f"Analytics computation failed: {str(e)}"
            }
        }), 500


@app.route("/api/trends", methods=["GET"])
def api_trends():
    """Dedicated sales trend timeline endpoint."""
    try:
        df = get_active_dataset()
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        region = request.args.get("region")
        product = request.args.get("product")
        interval = request.args.get("interval", "M")

        filtered = filter_dataframe(df, start_date=start_date, end_date=end_date, region=region, product=product)
        trend = get_sales_trend(filtered, interval=interval)

        return jsonify({
            "success": True,
            "interval": interval,
            "data": trend
        }), 200

    except Exception as e:
        logger.exception("Error in /api/trends: %s", e)
        return jsonify({"success": False, "error": {"code": 500, "message": str(e)}}), 500


@app.route("/api/products/top", methods=["GET"])
def api_top_products():
    """Dedicated top products ranking endpoint."""
    try:
        df = get_active_dataset()
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        region = request.args.get("region")

        try:
            limit = int(request.args.get("limit", 10))
        except ValueError:
            limit = 10

        filtered = filter_dataframe(df, start_date=start_date, end_date=end_date, region=region)
        top = get_top_products(filtered, n=limit)

        return jsonify({
            "success": True,
            "data": top
        }), 200

    except Exception as e:
        logger.exception("Error in /api/products/top: %s", e)
        return jsonify({"success": False, "error": {"code": 500, "message": str(e)}}), 500


@app.route("/api/regions", methods=["GET"])
def api_regions():
    """Dedicated regional performance endpoint."""
    try:
        df = get_active_dataset()
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        product = request.args.get("product")

        filtered = filter_dataframe(df, start_date=start_date, end_date=end_date, product=product)
        regions_data = get_region_analysis(filtered)

        return jsonify({
            "success": True,
            "data": regions_data
        }), 200

    except Exception as e:
        logger.exception("Error in /api/regions: %s", e)
        return jsonify({"success": False, "error": {"code": 500, "message": str(e)}}), 500


@app.route("/api/transactions", methods=["GET"])
def api_transactions():
    """Paginated raw transaction records."""
    try:
        df = get_active_dataset()
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        region = request.args.get("region")
        product = request.args.get("product")

        try:
            page = max(1, int(request.args.get("page", 1)))
            page_size = min(100, max(1, int(request.args.get("page_size", 20))))
        except ValueError:
            page, page_size = 1, 20

        filtered = filter_dataframe(df, start_date=start_date, end_date=end_date, region=region, product=product)

        total_records = len(filtered)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        page_df = filtered.iloc[start_idx:end_idx]

        records = [
            {
                "id": int(start_idx + i + 1),
                "date": row["Date"].strftime("%Y-%m-%d"),
                "product": str(row["Product"]),
                "region": str(row["Region"]),
                "quantity": int(row["Quantity"]),
                "sales": round(float(row["Sales"]), 2),
            }
            for i, (_, row) in enumerate(page_df.iterrows())
        ]

        return jsonify({
            "success": True,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_records": total_records,
                "total_pages": int(np.ceil(total_records / page_size)) if total_records > 0 else 1,
            },
            "records": records,
        }), 200

    except Exception as e:
        logger.exception("Error in /api/transactions: %s", e)
        return jsonify({"success": False, "error": {"code": 500, "message": str(e)}}), 500


@app.route("/api/upload", methods=["POST"])
def api_upload_csv():
    """
    Upload a new CSV file to parse, validate, and analyze in memory.
    Updates the active working dataset.
    """
    global ACTIVE_DATASET, ACTIVE_DATASET_NAME

    if "file" not in request.files:
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": "No file part provided in multipart form-data. Key must be 'file'."}
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": "No file selected."}
        }), 400

    if not file.filename.lower().endswith(".csv"):
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": "Only CSV files are supported."}
        }), 400

    try:
        # Read uploaded file content into memory buffer
        file_bytes = io.BytesIO(file.read())
        raw_df = load_data(file_bytes)
        cleaned_df = clean_data(raw_df)

        # Persist uploaded file to DEFAULT_CSV_PATH so it persists across server restarts
        try:
            with open(DEFAULT_CSV_PATH, "wb") as f:
                f.write(file_bytes.getvalue())
            logger.info("Persisted uploaded CSV to: %s", DEFAULT_CSV_PATH)
        except Exception as persist_err:
            logger.warning("Could not persist file to disk (operating in-memory): %s", persist_err)

        ACTIVE_DATASET = cleaned_df
        ACTIVE_DATASET_NAME = file.filename

        logger.info("Successfully updated active dataset from upload: %s (%d rows)", file.filename, len(cleaned_df))

        # Return full analysis of newly uploaded data
        analysis = run_analysis(cleaned_df)
        return jsonify({
            "success": True,
            "message": f"Successfully loaded and analyzed '{file.filename}' with {len(cleaned_df)} valid records.",
            "data": analysis
        }), 200

    except (ValueError, KeyError) as e:
        logger.warning("Validation error on uploaded CSV: %s", e)
        return jsonify({
            "success": False,
            "error": {"code": 400, "message": str(e)}
        }), 400
    except Exception as e:
        logger.exception("Upload processing failed: %s", e)
        return jsonify({
            "success": False,
            "error": {"code": 500, "message": f"Failed to process CSV: {str(e)}"}
        }), 500


@app.route("/api/reset", methods=["POST"])
def api_reset_dataset():
    """Clear active dataset and remove persistent storage."""
    global ACTIVE_DATASET, ACTIVE_DATASET_NAME

    try:
        if os.path.exists(DEFAULT_CSV_PATH):
            try:
                os.remove(DEFAULT_CSV_PATH)
                logger.info("Removed persistent sales data file: %s", DEFAULT_CSV_PATH)
            except Exception as rm_err:
                logger.warning("Could not remove persistent file: %s", rm_err)

        ACTIVE_DATASET = pd.DataFrame(columns=["Date", "Product", "Region", "Sales", "Quantity"])
        ACTIVE_DATASET_NAME = "No dataset loaded"

        analysis = run_analysis(ACTIVE_DATASET)
        return jsonify({
            "success": True,
            "message": "Dataset cleared. Ready for fresh CSV upload.",
            "data": analysis
        }), 200
    except Exception as e:
        logger.exception("Failed to reset dataset: %s", e)
        return jsonify({
            "success": False,
            "error": {"code": 500, "message": f"Reset failed: {str(e)}"}
        }), 500


# ---------------------------------------------------------------------------
# LOCAL DEV SERVER ENTRYPOINT
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development" or os.environ.get("FLASK_DEBUG") == "1"
    logger.info("Starting Sales Analytics Flask API on 0.0.0.0:%d (Debug=%s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)