"""
Unit, Pipeline, and API Integration Tests for Sales Analytics Backend.
"""

import io
import os
import pytest
import pandas as pd
from backend.sales_analytics import (
    app,
    load_data,
    clean_data,
    filter_dataframe,
    calculate_metrics,
    get_sales_trend,
    get_top_products,
    get_region_analysis,
    run_analysis,
)


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def sample_csv_data():
    return (
        "Date,Product,Region,Sales,Quantity\n"
        "2025-01-05,Widget A,North,1500.00,30\n"
        "2025-01-12,Widget B,South,2300.50,45\n"
        "2025-01-20,Widget C,East,980.00,20\n"
        "2025-02-03,Widget A,West,1750.25,35\n"
        "2025-02-14,Widget D,North,3200.00,60\n"
    )


# ---------------------------------------------------------------------------
# 1. DATA LOADING TESTS
# ---------------------------------------------------------------------------
def test_load_data_valid(sample_csv_data):
    buffer = io.StringIO(sample_csv_data)
    df = load_data(buffer)
    assert len(df) == 5
    assert "Sales" in df.columns


def test_load_data_file_not_found():
    with pytest.raises(FileNotFoundError):
        load_data("non_existent_sales_data_999.csv")


def test_load_data_empty():
    buffer = io.StringIO("")
    with pytest.raises(ValueError):
        load_data(buffer)


# ---------------------------------------------------------------------------
# 2. DATA CLEANING TESTS
# ---------------------------------------------------------------------------
def test_clean_data_valid(sample_csv_data):
    buffer = io.StringIO(sample_csv_data)
    df = load_data(buffer)
    cleaned = clean_data(df)
    assert len(cleaned) == 5
    assert cleaned["Sales"].dtype in ["float64", "float32"]
    assert cleaned["Quantity"].dtype in ["int64", "int32"]


def test_clean_data_currency_symbols():
    raw = (
        'Date,Product,Region,Sales,Quantity\n'
        '2025-01-05, Widget A , North , "$1,500.00" , 30 \n'
        '2025-01-12, Widget B , South , "2,300.50" , 45 \n'
    )
    buffer = io.StringIO(raw)
    df = clean_data(load_data(buffer))
    assert len(df) == 2
    assert df["Sales"].iloc[0] == 1500.00
    assert df["Product"].iloc[0] == "Widget A"
    assert df["Region"].iloc[0] == "North"


def test_clean_data_missing_required_column():
    raw = (
        "Date,Region,Sales,Quantity\n"
        "2025-01-05,North,1500.00,30\n"
    )
    buffer = io.StringIO(raw)
    with pytest.raises(KeyError) as exc_info:
        clean_data(pd.read_csv(buffer))
    assert "Missing required columns" in str(exc_info.value)


def test_clean_data_drops_invalid_dates_and_negatives():
    raw = (
        "Date,Product,Region,Sales,Quantity\n"
        "2025-01-05,Widget A,North,1500.00,30\n"
        "not-a-date,Widget B,South,2000.00,20\n"  # invalid date
        "2025-01-10,Widget C,East,-50.00,10\n"    # negative sales
        "2025-01-15,Widget D,West,100.00,0\n"     # zero quantity
    )
    buffer = io.StringIO(raw)
    cleaned = clean_data(pd.read_csv(buffer))
    assert len(cleaned) == 1
    assert cleaned["Product"].iloc[0] == "Widget A"


def test_clean_data_drops_duplicates():
    raw = (
        "Date,Product,Region,Sales,Quantity\n"
        "2025-01-05,Widget A,North,1500.00,30\n"
        "2025-01-05,Widget A,North,1500.00,30\n"
    )
    buffer = io.StringIO(raw)
    cleaned = clean_data(pd.read_csv(buffer))
    assert len(cleaned) == 1


# ---------------------------------------------------------------------------
# 3. METRICS AND ZERO-DIVISION SAFETY
# ---------------------------------------------------------------------------
def test_calculate_metrics_normal(sample_csv_data):
    buffer = io.StringIO(sample_csv_data)
    df = clean_data(load_data(buffer))
    metrics = calculate_metrics(df)

    assert metrics["total_transactions"] == 5
    assert metrics["total_quantity"] == 190
    assert metrics["total_sales"] == 9730.75
    assert metrics["average_sale_per_transaction"] == round(9730.75 / 5, 2)
    assert metrics["unique_products"] == 4
    assert metrics["unique_regions"] == 4


def test_calculate_metrics_empty_df():
    empty_df = pd.DataFrame(columns=["Date", "Product", "Region", "Sales", "Quantity"])
    metrics = calculate_metrics(empty_df)
    assert metrics["total_sales"] == 0.0
    assert metrics["total_transactions"] == 0
    assert metrics["average_sale_per_transaction"] == 0.0


# ---------------------------------------------------------------------------
# 4. TRENDS & AGGREGATIONS
# ---------------------------------------------------------------------------
def test_get_sales_trend(sample_csv_data):
    buffer = io.StringIO(sample_csv_data)
    df = clean_data(load_data(buffer))
    trend = get_sales_trend(df, interval="M")

    assert trend["labels"] == ["2025-01", "2025-02"]
    assert len(trend["values"]) == 2
    assert trend["values"][0] == 1500.00 + 2300.50 + 980.00
    assert len(trend["series"]) == 2


def test_get_top_products(sample_csv_data):
    buffer = io.StringIO(sample_csv_data)
    df = clean_data(load_data(buffer))
    top = get_top_products(df, n=2)

    assert len(top["labels"]) == 2
    assert top["labels"][0] == "Widget A" or top["labels"][0] == "Widget D"
    assert sum(top["revenue_shares"]) > 0


def test_get_region_analysis(sample_csv_data):
    buffer = io.StringIO(sample_csv_data)
    df = clean_data(load_data(buffer))
    reg = get_region_analysis(df)

    assert len(reg["chart_data"]["labels"]) == 4
    assert "North" in reg["details"]
    assert reg["details"]["North"]["transaction_count"] == 2


def test_filter_dataframe(sample_csv_data):
    buffer = io.StringIO(sample_csv_data)
    df = clean_data(load_data(buffer))

    filtered_region = filter_dataframe(df, region="North")
    assert len(filtered_region) == 2
    assert all(filtered_region["Region"] == "North")

    filtered_date = filter_dataframe(df, start_date="2025-02-01", end_date="2025-02-28")
    assert len(filtered_date) == 2


# ---------------------------------------------------------------------------
# 5. REST API ENDPOINT TESTS
# ---------------------------------------------------------------------------
def test_api_root(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "online"
    assert "documentation" in data


def test_api_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "uptime_seconds" in data
    assert "record_count" in data["dataset"]


def test_api_analytics_full(client):
    res = client.get("/api/analytics")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "metrics" in data
    assert "sales_trend" in data
    assert "top_products" in data
    assert "region_analysis" in data
    assert "recent_transactions" in data
    assert data["metrics"]["total_sales"] >= 0


def test_api_analytics_with_filters(client):
    res = client.get("/api/analytics?region=North")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["dataset_info"]["filtered_rows"] <= data["dataset_info"]["total_rows"]


def test_api_trends_endpoint(client, sample_csv_data):
    client.post("/api/upload", data={"file": (io.BytesIO(sample_csv_data.encode("utf-8")), "data.csv")}, content_type="multipart/form-data")
    res = client.get("/api/trends?interval=M")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["data"]["labels"]) > 0


def test_api_products_top_endpoint(client, sample_csv_data):
    client.post("/api/upload", data={"file": (io.BytesIO(sample_csv_data.encode("utf-8")), "data.csv")}, content_type="multipart/form-data")
    res = client.get("/api/products/top?limit=3")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["data"]["labels"]) <= 3


def test_api_regions_endpoint(client, sample_csv_data):
    client.post("/api/upload", data={"file": (io.BytesIO(sample_csv_data.encode("utf-8")), "data.csv")}, content_type="multipart/form-data")
    res = client.get("/api/regions")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["data"]["items"]) > 0


def test_api_transactions_pagination(client, sample_csv_data):
    client.post("/api/upload", data={"file": (io.BytesIO(sample_csv_data.encode("utf-8")), "data.csv")}, content_type="multipart/form-data")
    res = client.get("/api/transactions?page=1&page_size=2")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["records"]) <= 2
    assert data["pagination"]["total_records"] == 5


def test_api_upload_and_reset(client, sample_csv_data):
    # Upload test CSV
    data = {
        "file": (io.BytesIO(sample_csv_data.encode("utf-8")), "uploaded_test.csv")
    }
    upload_res = client.post("/api/upload", data=data, content_type="multipart/form-data")
    assert upload_res.status_code == 200
    json_data = upload_res.get_json()
    assert json_data["success"] is True
    assert json_data["data"]["dataset_info"]["total_rows"] == 5

    # Verify analytics reflects new dataset
    ana_res = client.get("/api/analytics")
    assert ana_res.get_json()["metrics"]["total_transactions"] == 5

    # Reset dataset back to clean state
    reset_res = client.post("/api/reset")
    assert reset_res.status_code == 200
    reset_ana = client.get("/api/analytics")
    assert reset_ana.get_json()["metrics"]["total_transactions"] == 0


def test_api_upload_invalid_file(client):
    # No file attached
    res1 = client.post("/api/upload")
    assert res1.status_code == 400

    # Wrong extension
    data = {"file": (io.BytesIO(b"hello"), "test.txt")}
    res2 = client.post("/api/upload", data=data, content_type="multipart/form-data")
    assert res2.status_code == 400


def test_api_404_handler(client):
    res = client.get("/non_existent_route")
    assert res.status_code == 404
    assert res.get_json()["success"] is False
