"""
WSGI entrypoint for root-level deployment runners.
Imports Flask application from backend.sales_analytics.
"""
from backend.sales_analytics import app

if __name__ == "__main__":
    app.run()
