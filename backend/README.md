# SentinelMarket Backend API

FastAPI backend for the SentinelMarket stock anomaly detection system.

## Setup

1. Install dependencies:
```bash
cd ../SentinelMarket
pip install -r requirements.txt
```

2. Make sure the ML model exists:
```bash
# Model should be at: SentinelMarket/models/isolation_forest.pkl
```

3. Run the server:
```bash
cd backend
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `GET /api/stocks` - Get list of stocks (with filters)
- `GET /api/stocks/{ticker}` - Get detailed analysis for a stock
- `GET /api/stocks/{ticker}/history` - Get historical data
- `GET /api/alerts` - Get high-risk alerts
- `GET /api/analytics` - Get system analytics

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

Create a `.env` file (optional):
```
API_PORT=8000
CORS_ORIGINS=http://localhost:3000
```

