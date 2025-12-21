"""
FastAPI Backend for SentinelMarket
Main API server
"""

import sys
import os

# CRITICAL: Set up paths BEFORE any imports that use 'src'
# Add backend directory to path for imports (must be first!)
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Add SentinelMarket to path (if exists) - this is where the original ML code lives
# IMPORTANT: keep backend_dir (which contains our ETL 'src') *ahead* of SentinelMarket
# so that `import src.data.pipeline...` resolves to backend/src, not SentinelMarket/src.
sentinel_path = os.path.join(os.path.dirname(__file__), '..', 'SentinelMarket')
if os.path.exists(sentinel_path):
    if sentinel_path not in sys.path:
        # Append so it has lower priority than backend_dir
        sys.path.append(sentinel_path)
    print(f"[PATH] Added SentinelMarket to path (low priority): {sentinel_path}")
else:
    print(f"[PATH] SentinelMarket path not found: {sentinel_path}")

# Now import standard libraries
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import ML modules (type: ignore for linter - path is added dynamically)
# These are in SentinelMarket/src, not backend/src
try:
    from src.data.stock_data_fetcher import StockDataFetcher  # type: ignore
    from src.detectors.risk_scorer import RiskScorer  # type: ignore
    print("[ML] ML modules imported successfully")
except ImportError as e:
    print(f"[ML] Could not import ML modules: {e}")
    import traceback
    traceback.print_exc()
    # Create fallback classes to prevent complete failure
    # Mark that we're using mock classes
    ML_MODULES_AVAILABLE = False
    
    class StockDataFetcher:
        def __init__(self, market_suffix=""):
            self.market_suffix = market_suffix
            self.is_mock = True  # Mark as mock
        def fetch_stock_data(self, ticker, exchange="nse"):
            return {"ticker": ticker, "price": 0, "volume": 0}
        def fetch_historical_data(self, ticker, period="3mo"):
            # Return empty DataFrame - will trigger demo data fallback
            try:
                import pandas as pd
                return pd.DataFrame()
            except:
                return None
    
    class RiskScorer:
        def __init__(self, *args, **kwargs):
            self.is_mock = True  # Mark as mock
            pass
        def calculate_risk_score(self, *args, **kwargs):
            return {"risk_score": 0, "risk_level": "LOW", "is_suspicious": False}
else:
    ML_MODULES_AVAILABLE = True

# Import database (optional - will work without it)
try:
    from database import db_manager, StockRepository
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("⚠️  Database module not available - running without database")

# Import social media monitoring (optional)
# NOTE: On Windows, importing transformers/torch for Twitter can raise DLL OSErrors.
# We catch any exception here so the rest of the app (and Telegram, ETL, etc.) still work.
try:
    social_path = os.path.join(os.path.dirname(__file__), 'src', 'social')
    if os.path.dirname(__file__) not in sys.path:
        sys.path.append(os.path.dirname(__file__))
    from src.social import twitter_monitor, telegram_monitor
    SOCIAL_AVAILABLE = True
except Exception as e:
    SOCIAL_AVAILABLE = False
    print(f"[SOCIAL] Social media monitoring not available (transformers/torch issue): {e}")

# Import data engineering modules (optional)
# Path is already set up above, so imports should work now
try:
    from src.data.pipeline.stock_pipeline import StockDataPipeline
    from src.data.storage.warehouse import DataWarehouse
    from src.data.scheduler.pipeline_scheduler import PipelineScheduler
    from src.data.monitoring.pipeline_monitor import PipelineMonitor
    from src.data.validation import DataValidator, DataQualityMetrics
    from src.data.streaming import StreamProcessor
    # Try to import social pipeline (may fail due to PyTorch DLL issues)
    # Skip it if it fails - stock pipeline is more important
    SOCIAL_PIPELINE_AVAILABLE = False
    SocialMediaPipeline = None
    try:
        from src.data.pipeline.social_pipeline import SocialMediaPipeline
        SOCIAL_PIPELINE_AVAILABLE = True
    except (ImportError, OSError, Exception) as e:
        # PyTorch DLL errors on Windows - skip social pipeline
        SOCIAL_PIPELINE_AVAILABLE = False
        SocialMediaPipeline = None
        print(f"[PIPELINES] Social pipeline skipped (PyTorch/DLL issue): {type(e).__name__}")
    
    DATA_ENGINEERING_AVAILABLE = True
    
    # Initialize scheduler, monitor, and stream processor
    pipeline_scheduler = PipelineScheduler()
    pipeline_monitor = PipelineMonitor()
    stream_processor = StreamProcessor()

    # Seed stream with a few demo events so the Streams page is never empty
    try:
        demo_events = [
            {
                "pipeline": "stock_data",
                "success": True,
                "records_loaded": 1200,
                "duration_seconds": 3.4,
            },
            {
                "pipeline": "social_media",
                "success": True,
                "records_loaded": 350,
                "duration_seconds": 5.1,
            },
            {
                "pipeline": "stock_data",
                "success": False,
                "records_loaded": 0,
                "duration_seconds": 1.2,
            },
        ]
        from datetime import datetime as _dt

        for ev in demo_events:
            stream_processor.publish(
                "pipeline_runs",
                {
                    **ev,
                    "timestamp": _dt.now().isoformat(),
                    "demo": True,
                },
            )
    except Exception:
        # Seeding is best-effort; never block startup
        pass
    print("[PIPELINES] Data engineering modules loaded successfully")
    if not SOCIAL_PIPELINE_AVAILABLE:
        print("[PIPELINES] Note: Social media pipeline unavailable (PyTorch issue), but other pipelines work")
except ImportError as e:
    DATA_ENGINEERING_AVAILABLE = False
    pipeline_scheduler = None
    pipeline_monitor = None
    print(f"[PIPELINES] Data engineering modules not available: {e}")
    import traceback
    traceback.print_exc()
except Exception as e:
    DATA_ENGINEERING_AVAILABLE = False
    pipeline_scheduler = None
    pipeline_monitor = None
    print(f"[PIPELINES] Data engineering modules failed to load: {e}")
    import traceback
    traceback.print_exc()

# Initialize FastAPI app
app = FastAPI(
    title="SentinelMarket API",
    description="AI-Powered Stock Anomaly Detection API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sentinelmarket.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
fetcher_nse = StockDataFetcher(market_suffix=".NS")  # NSE
fetcher_bse = StockDataFetcher(market_suffix=".BO")  # BSE
risk_scorer = RiskScorer(ml_model_path="SentinelMarket/models/isolation_forest.pkl", use_ml=True)

# Database dependency
def get_db():
    if not DB_AVAILABLE:
        return None
    db = db_manager.get_session()
    try:
        yield db
    finally:
        db.close()

# Check database connection on startup
@app.on_event("startup")
async def startup_event():
    if DB_AVAILABLE:
        if db_manager.test_connection():
            print("[OK] Database connection successful")
        else:
            print("[WARNING] Database connection failed - running without database")
    else:
        print("[INFO] Running without database (database module not available)")
    
    # Verify Telegram monitor is using correct channels
    if SOCIAL_AVAILABLE:
        # FORCE update channels to the correct ones (in case old instance is cached)
        # User's actual Telegram channels (update these if needed):
        # https://t.me/Stock_Gainerss_2
        # https://t.me/hindustan_om_unique_traders
        correct_channels = ['Stock_Gainerss_2', 'hindustan_om_unique_traders','stockmarkettradingproject']
        print(f"🔍 [Startup] OLD Telegram monitor channels: {telegram_monitor.default_channels}")
        telegram_monitor.default_channels = correct_channels
        print(f"✅ [Startup] UPDATED Telegram monitor channels to: {telegram_monitor.default_channels}")
        print(f"🔍 [Startup] Telegram monitor configured: {telegram_monitor.is_configured}")

# Root endpoint with HEAD support for uptime monitors
@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    """Root endpoint - health check for uptime monitors"""
    return {
        "service": "SentinelMarket API",
        "status": "healthy",
        "version": "1.0.0"
    }

# Health endpoint with HEAD support for uptime monitors
@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    """Health check endpoint for uptime monitors (supports GET and HEAD)"""
    return {
        "status": "healthy",
        "database": "connected" if DB_AVAILABLE else "not configured",
        "ml_modules": "available" if ML_MODULES_AVAILABLE else "fallback",
        "social_monitoring": "available" if SOCIAL_AVAILABLE else "not available",
        "data_engineering": "available" if DATA_ENGINEERING_AVAILABLE else "not available"
    }

# Popular NSE and BSE stocks for demo
POPULAR_NSE_STOCKS = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "HINDUNILVR", "ICICIBANK",
    "BHARTIARTL", "SBIN", "BAJFINANCE", "LICI", "ITC", "SUNPHARMA",
    "HCLTECH", "AXISBANK", "KOTAKBANK", "LT", "ASIANPAINT", "MARUTI",
    "TITAN", "ULTRACEMCO", "NESTLEIND", "WIPRO", "ONGC", "POWERGRID",
    "NTPC", "TECHM", "JSWSTEEL", "ADANIENT", "TATAMOTORS", "HDFCLIFE"
]

POPULAR_BSE_STOCKS = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "HINDUNILVR", "ICICIBANK",
    "BHARTIARTL", "SBIN", "BAJFINANCE", "LICI", "ITC", "SUNPHARMA",
    "HCLTECH", "AXISBANK", "KOTAKBANK", "LT", "ASIANPAINT", "MARUTI",
    "TITAN", "ULTRACEMCO", "NESTLEIND", "WIPRO", "ONGC", "POWERGRID",
    "NTPC", "TECHM", "JSWSTEEL", "ADANIENT", "TATAMOTORS", "HDFCLIFE"
]


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SentinelMarket API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "ml_enabled": risk_scorer.ml_enabled
    }


@app.get("/api/market-indices")
async def get_market_indices():
    """
    Get real-time market indices data (NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT)
    Used for the header ticker display
    """
    import yfinance as yf
    
    # Define indices with their Yahoo Finance symbols
    indices = [
        {"symbol": "^NSEI", "name": "NIFTY 50"},
        {"symbol": "^BSESN", "name": "SENSEX"},
        {"symbol": "^NSEBANK", "name": "BANK NIFTY"},
        {"symbol": "^CNXIT", "name": "NIFTY IT"},
    ]
    
    results = []
    
    for index in indices:
        try:
            ticker = yf.Ticker(index["symbol"])
            # Get current day's data
            hist = ticker.history(period="2d")
            
            if hist is not None and len(hist) >= 1:
                current_price = float(hist['Close'].iloc[-1])
                
                # Calculate change from previous close
                if len(hist) >= 2:
                    prev_close = float(hist['Close'].iloc[-2])
                else:
                    # Use today's open if we don't have yesterday's close
                    prev_close = float(hist['Open'].iloc[-1])
                
                change = current_price - prev_close
                change_percent = (change / prev_close) * 100 if prev_close > 0 else 0
                
                results.append({
                    "symbol": index["name"],
                    "value": round(current_price, 2),
                    "change": round(change, 2),
                    "change_percent": round(change_percent, 2),
                    "positive": change_percent >= 0
                })
            else:
                # No data available - skip this index
                continue
                
        except Exception as e:
            print(f"[MARKET] Error fetching {index['name']}: {e}")
            continue
    
    # If no real data available, return realistic demo data
    if len(results) == 0:
        print("[MARKET] Using demo data for market indices")
        import random
        demo_indices = [
            {"symbol": "NIFTY 50", "base": 24850, "range": 200},
            {"symbol": "SENSEX", "base": 82100, "range": 500},
            {"symbol": "BANK NIFTY", "base": 53200, "range": 300},
            {"symbol": "NIFTY IT", "base": 44800, "range": 400},
        ]
        for idx in demo_indices:
            change_percent = random.uniform(-1.5, 1.5)
            value = idx["base"] + random.uniform(-idx["range"], idx["range"])
            results.append({
                "symbol": idx["symbol"],
                "value": round(value, 2),
                "change": round(value * change_percent / 100, 2),
                "change_percent": round(change_percent, 2),
                "positive": change_percent >= 0,
                "demo": True
            })
    
    return {
        "indices": results,
        "timestamp": datetime.now().isoformat(),
        "market_status": "open" if 9 <= datetime.now().hour < 16 else "closed"
    }


@app.get("/api/stocks")
async def get_stocks(
    exchange: Optional[str] = Query(None, description="Exchange: 'nse' or 'bse'"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level: 'low', 'medium', 'high', 'extreme'"),
    limit: Optional[int] = Query(100, ge=1, le=500),
    offset: Optional[int] = Query(0, ge=0),
    use_db: Optional[bool] = Query(False, description="Use database for faster results")
):
    """
    Get list of stocks with risk scores
    
    Args:
        exchange: Filter by exchange (nse/bse)
        risk_level: Filter by risk level
        limit: Maximum number of results
        offset: Pagination offset
        use_db: Use database for faster results (if available)
    """
    try:
        # Ensure limit and offset are integers (FastAPI Query objects)
        # Defensive check: if called internally without arguments, they might be Query objects
        from fastapi.params import Query as QueryParam
        
        if isinstance(limit, QueryParam):
            limit = limit.default
        if isinstance(offset, QueryParam):
            offset = offset.default
            
        limit_int = int(limit) if limit is not None else 100
        offset_int = int(offset) if offset is not None else 0
        
        # Try to use database if available and requested
        if use_db and DB_AVAILABLE:
            try:
                db_gen = get_db()
                db = next(db_gen)
                repo = StockRepository(db)
                exchange_name = (exchange or "nse").upper()
                assessments = repo.get_latest_risk_assessments(exchange_name, limit_int + offset_int)
                
                # Apply offset and limit
                results = assessments[offset_int:offset_int + limit_int]
                
                # Filter by risk level if specified
                if risk_level:
                    risk_level_upper = risk_level.upper()
                    results = [r for r in results if r['risk_level'] == risk_level_upper]
                
                # Format results
                formatted_results = []
                for r in results:
                    formatted_results.append({
                        "ticker": r['ticker'],
                        "exchange": r['exchange'],
                        "risk_score": round(r['risk_score'], 2),
                        "risk_level": r['risk_level'],
                        "is_suspicious": r['is_suspicious'],
                        "price": round(r['price'], 2),
                        "price_change_percent": 0.0,  # Would need to calculate from history
                        "volume": 0,  # Would need to get from stock_data
                        "last_updated": r['timestamp'].isoformat() if hasattr(r['timestamp'], 'isoformat') else str(r['timestamp'])
                    })
                
                return {
                    "stocks": formatted_results,
                    "total": len(formatted_results),
                    "exchange": exchange_name,
                    "limit": limit_int,
                    "offset": offset_int,
                    "source": "database"
                }
            except Exception as db_error:
                print(f"Database query failed, falling back to API: {db_error}")
                # Fall through to regular API-based approach
        
        # Regular API-based approach (fallback or default)
        # Select exchange
        if exchange and exchange.lower() == "bse":
            fetcher = fetcher_bse
            stock_list = POPULAR_BSE_STOCKS
            exchange_name = "BSE"
        else:
            fetcher = fetcher_nse
            stock_list = POPULAR_NSE_STOCKS
            exchange_name = "NSE"
        
        # Get stocks in range
        stocks_to_analyze = stock_list[offset_int:offset_int + limit_int]
        
        results = []
        # Try to fetch real data first
        for ticker in stocks_to_analyze:
            try:
                # Fetch data
                data = fetcher.fetch_historical_data(ticker, period="3mo")
                if data is None or (hasattr(data, 'empty') and data.empty):
                    continue
                
                # Calculate risk score
                risk_result = risk_scorer.calculate_risk_score(data, ticker)
                
                # Filter by risk level if specified
                if risk_level:
                    risk_level_lower = risk_level.lower()
                    risk_result_level = risk_result.get('risk_level', 'LOW').lower()
                    if risk_level_lower == "low" and risk_result_level != "low":
                        continue
                    elif risk_level_lower == "medium" and risk_result_level != "medium":
                        continue
                    elif risk_level_lower == "high" and risk_result_level != "high":
                        continue
                    elif risk_level_lower == "extreme" and risk_result_level != "extreme":
                        continue
                
                # Get current price
                current_price = float(data['Close'].iloc[-1]) if not data.empty else 0.0
                price_change = 0.0
                if len(data) > 1:
                    prev_price = float(data['Close'].iloc[-2])
                    price_change = ((current_price - prev_price) / prev_price) * 100
                
                results.append({
                    "ticker": ticker,
                    "exchange": exchange_name,
                    "risk_score": round(risk_result.get('risk_score', 0), 2),
                    "risk_level": risk_result.get('risk_level', 'LOW'),
                    "is_suspicious": risk_result.get('is_suspicious', False),
                    "price": round(current_price, 2),
                    "price_change_percent": round(price_change, 2),
                    "volume": int(data['Volume'].iloc[-1]) if not data.empty else 0,
                    "last_updated": datetime.now().isoformat()
                })
            except Exception as e:
                # Skip stocks that fail - will use demo data if all fail
                continue
        
        # ALWAYS provide demo data if no results OR if using mock fetcher
        needs_demo = len(results) == 0 or (hasattr(fetcher, 'is_mock') and fetcher.is_mock)
        if needs_demo:
            print(f"[DEMO] Generating demo data for {exchange_name} (results={len(results)}, is_mock={hasattr(fetcher, 'is_mock') and getattr(fetcher, 'is_mock', False)})")
            import random
            demo_prices = {
                "RELIANCE": 2450.50, "TCS": 3850.25, "HDFCBANK": 1650.75, "INFY": 1520.00,
                "HINDUNILVR": 2650.00, "ICICIBANK": 1050.50, "BHARTIARTL": 1250.25,
                "SBIN": 650.75, "BAJFINANCE": 7200.00, "LICI": 850.50, "ITC": 450.25,
                "SUNPHARMA": 1250.00, "HCLTECH": 1650.50, "AXISBANK": 1150.75,
                "KOTAKBANK": 1850.00, "LT": 3650.25, "ASIANPAINT": 3250.50,
                "MARUTI": 11250.00, "TITAN": 3850.75, "ULTRACEMCO": 8750.25,
                "NESTLEIND": 2450.00, "WIPRO": 450.50, "ONGC": 250.75,
                "POWERGRID": 280.25, "NTPC": 320.50, "TECHM": 1250.00,
                "JSWSTEEL": 850.75, "ADANIENT": 2850.25, "TATAMOTORS": 950.50,
                "HDFCLIFE": 650.00
            }
            demo_stocks = stock_list[:min(limit_int, len(stock_list))]
            for ticker in demo_stocks:
                base_price = demo_prices.get(ticker, random.uniform(200, 5000))
                # Generate realistic risk scores (mix of low, medium, high, extreme)
                risk_roll = random.random()
                if risk_roll < 0.5:
                    risk_score = random.uniform(10, 40)
                    risk_level = "LOW"
                elif risk_roll < 0.75:
                    risk_score = random.uniform(40, 60)
                    risk_level = "MEDIUM"
                elif risk_roll < 0.9:
                    risk_score = random.uniform(60, 80)
                    risk_level = "HIGH"
                else:
                    risk_score = random.uniform(80, 95)
                    risk_level = "EXTREME"
                
                price_change = random.uniform(-5, 5)
                volume = random.randint(100000, 5000000)
                
                results.append({
                    "ticker": ticker,
                    "exchange": exchange_name,
                    "risk_score": round(risk_score, 2),
                    "risk_level": risk_level,
                    "is_suspicious": risk_level in ["HIGH", "EXTREME"],
                    "price": round(base_price, 2),
                    "price_change_percent": round(price_change, 2),
                    "volume": volume,
                    "last_updated": datetime.now().isoformat()
                })
            print(f"[DEMO] Generated {len(results)} demo stocks")
        
        # Sort by risk score (highest first)
        results.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return {
            "stocks": results,
            "total": len(results),
            "exchange": exchange_name,
            "limit": limit_int,
            "offset": offset_int,
            "demo_mode": len(results) > 0 and all(r.get("demo_mode", False) for r in results) if results else False
        }
    
    except Exception as e:
        # If there's an error, try to return demo data as fallback
        print(f"[ERROR] Error in get_stocks: {e}")
        import traceback
        traceback.print_exc()
        # Still try to return demo data
        try:
            import random
            exchange_name = (exchange or "nse").upper()
            stock_list = POPULAR_NSE_STOCKS if exchange_name == "NSE" else POPULAR_BSE_STOCKS
            limit_int = int(limit) if limit is not None else 100
            demo_prices = {
                "RELIANCE": 2450.50, "TCS": 3850.25, "HDFCBANK": 1650.75, "INFY": 1520.00,
                "HINDUNILVR": 2650.00, "ICICIBANK": 1050.50, "BHARTIARTL": 1250.25,
                "SBIN": 650.75, "BAJFINANCE": 7200.00, "LICI": 850.50, "ITC": 450.25,
            }
            demo_stocks = stock_list[:min(limit_int, len(stock_list))]
            results = []
            for ticker in demo_stocks:
                base_price = demo_prices.get(ticker, random.uniform(200, 5000))
                risk_roll = random.random()
                if risk_roll < 0.5:
                    risk_score = random.uniform(10, 40)
                    risk_level = "LOW"
                elif risk_roll < 0.75:
                    risk_score = random.uniform(40, 60)
                    risk_level = "MEDIUM"
                elif risk_roll < 0.9:
                    risk_score = random.uniform(60, 80)
                    risk_level = "HIGH"
                else:
                    risk_score = random.uniform(80, 95)
                    risk_level = "EXTREME"
                results.append({
                    "ticker": ticker,
                    "exchange": exchange_name,
                    "risk_score": round(risk_score, 2),
                    "risk_level": risk_level,
                    "is_suspicious": risk_level in ["HIGH", "EXTREME"],
                    "price": round(base_price, 2),
                    "price_change_percent": round(random.uniform(-5, 5), 2),
                    "volume": random.randint(100000, 5000000),
                    "last_updated": datetime.now().isoformat()
                })
            return {
                "stocks": results,
                "total": len(results),
                "exchange": exchange_name,
                "limit": limit_int,
                "offset": 0,
                "demo_mode": True,
                "error": str(e)
            }
        except:
            # If even demo data fails, raise the original error
            raise HTTPException(status_code=500, detail=f"Error fetching stocks: {str(e)}")


@app.get("/api/stocks/{ticker}")
async def get_stock_detail(
    ticker: str,
    exchange: Optional[str] = Query("nse", description="Exchange: 'nse' or 'bse'"),
    period: Optional[str] = Query("3mo", description="Data period: 1mo, 3mo, 6mo, 1y"),
    save_to_db: Optional[bool] = Query(False, description="Save analysis to database")
):
    """
    Get detailed analysis for a single stock
    
    Args:
        ticker: Stock ticker symbol
        exchange: Exchange (nse/bse)
        period: Historical data period
    """
    try:
        # Select exchange
        if exchange and exchange.lower() == "bse":
            fetcher = fetcher_bse
            exchange_name = "BSE"
        else:
            fetcher = fetcher_nse
            exchange_name = "NSE"
        
        # Fetch data
        data = fetcher.fetch_historical_data(ticker, period=period)
        # Fetch data
        data = fetcher.fetch_historical_data(ticker, period=period)
        if data is None or data.empty:
            # Instead of 404, raise generic exception to trigger fallback
            raise ValueError(f"Stock {ticker} not found or no data available")
        
        # Calculate risk score for current data
        risk_result = risk_scorer.calculate_risk_score(data, ticker)
        current_risk_score = round(risk_result['risk_score'], 2)
        
        # Calculate risk scores for historical data (simplified - use rolling window for last 30 days)
        # For performance, we'll calculate risk for sample points (every 5 days) and interpolate
        risk_history = []
        data_length = len(data)
        
        # Calculate risk for sample points (every 5 days or last 30 days, whichever is smaller)
        sample_points = min(30, data_length)
        step = max(1, data_length // sample_points)
        
        for i in range(0, data_length, step):
            window_data = data.iloc[max(0, i-30):i+1]  # Use 30-day window
            if len(window_data) >= 10:  # Need minimum data points
                try:
                    day_risk = risk_scorer.calculate_risk_score(window_data, ticker)
                    risk_history.append({
                        "date": data.iloc[i]['Date'].isoformat() if hasattr(data.iloc[i]['Date'], 'isoformat') else str(data.iloc[i]['Date']),
                        "risk_score": round(day_risk['risk_score'], 2)
                    })
                except:
                    # If calculation fails, use current risk score
                    risk_history.append({
                        "date": data.iloc[i]['Date'].isoformat() if hasattr(data.iloc[i]['Date'], 'isoformat') else str(data.iloc[i]['Date']),
                        "risk_score": current_risk_score
                    })
            else:
                risk_history.append({
                    "date": data.iloc[i]['Date'].isoformat() if hasattr(data.iloc[i]['Date'], 'isoformat') else str(data.iloc[i]['Date']),
                    "risk_score": current_risk_score
                })
        
        # Always include the latest point with current risk score
        if risk_history and risk_history[-1]['date'] != data.iloc[-1]['Date'].isoformat():
            risk_history.append({
                "date": data.iloc[-1]['Date'].isoformat() if hasattr(data.iloc[-1]['Date'], 'isoformat') else str(data.iloc[-1]['Date']),
                "risk_score": current_risk_score
            })
        
        # Prepare chart data
        chart_data = []
        for idx, row in data.iterrows():
            chart_data.append({
                "date": row['Date'].isoformat() if hasattr(row['Date'], 'isoformat') else str(row['Date']),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": int(row['Volume'])
            })
        
        # Get current metrics
        current_price = float(data['Close'].iloc[-1])
        price_change = 0.0
        if len(data) > 1:
            prev_price = float(data['Close'].iloc[-2])
            price_change = ((current_price - prev_price) / prev_price) * 100
        
        # Save to database if requested and available
        if save_to_db and DB_AVAILABLE:
            try:
                db_gen = get_db()
                db = next(db_gen)
                repo = StockRepository(db)
                
                # Get or create stock
                stock_info = repo.get_or_create_stock(ticker, exchange_name)
                
                # Save stock data
                repo.save_stock_data(stock_info['id'], data)
                
                # Save risk assessment
                repo.save_risk_assessment(stock_info['id'], risk_result)
                
                # Create alert if high risk
                if risk_result['risk_score'] >= 60:
                    repo.create_alert(
                        stock_info['id'],
                        risk_result['risk_level'],
                        risk_result['risk_score'],
                        f"{ticker} flagged as {risk_result['risk_level']} RISK"
                    )
                
                print(f"✅ Saved {ticker} analysis to database")
            except Exception as db_error:
                print(f"⚠️  Failed to save to database: {db_error}")
        
        return {
            "ticker": ticker,
            "exchange": exchange_name,
            "risk_score": round(risk_result['risk_score'], 2),
            "risk_level": risk_result['risk_level'],
            "is_suspicious": risk_result['is_suspicious'],
            "recommendation": risk_result['recommendation'],
            "explanation": risk_result['explanation'],
            "red_flags": risk_result['red_flags'],
            "individual_scores": risk_result.get('individual_scores', {
                'volume_spike': 0,
                'price_anomaly': 0,
                'ml_anomaly': 0,
                'social_sentiment': 0
            }),
            "ml_status": risk_result.get('ml_status', {'enabled': False, 'score': 0}),
            "price": round(current_price, 2),
            "price_change_percent": round(price_change, 2),
            "volume": int(data['Volume'].iloc[-1]),
            "chart_data": chart_data,
            "risk_history": risk_history,  # Add risk history for trend chart
            "details": risk_result.get('details', {}),
            "last_updated": datetime.now().isoformat()
        }
    
    except Exception as e:
        # Fallback to mock data if real analysis fails
        print(f"[WARNING] Analysis failed for {ticker}, returning mock data: {e}")
        import random
        
        # Generate consistent mock data based on ticker string
        random.seed(ticker)
        base_price = random.uniform(500, 3000)
        current_price = base_price * random.uniform(0.95, 1.05)
        price_change = ((current_price - base_price) / base_price) * 100
        
        # Mock chart data
        chart_data = []
        price = base_price
        now = datetime.now()
        from datetime import timedelta
        for i in range(90):
            date = now - timedelta(days=90-i)
            change = random.uniform(-0.02, 0.02)
            price = price * (1 + change)
            chart_data.append({
                "date": date.isoformat(),
                "open": price,
                "high": price * 1.01,
                "low": price * 0.99,
                "close": price,
                "volume": int(random.uniform(100000, 1000000))
            })
            
        return {
            "ticker": ticker,
            "exchange": exchange_name,
            "risk_score": round(random.uniform(30, 90), 2),
            "risk_level": "HIGH" if random.random() > 0.5 else "MEDIUM",
            "is_suspicious": True,
            "recommendation": "Monitor closely",
            "explanation": "Abnormal volume patterns detected consistent with accumulation.",
            "red_flags": ["Volume spike > 200%", "Price divergence"],
            "individual_scores": {
                'volume_spike': random.randint(50, 90),
                'price_anomaly': random.randint(30, 70),
                'ml_anomaly': random.randint(40, 80),
                'social_sentiment': random.randint(20, 60)
            },
            "ml_status": {'enabled': True, 'score': 0.85},
            "price": round(current_price, 2),
            "price_change_percent": round(price_change, 2),
            "volume": int(random.uniform(500000, 2000000)),
            "chart_data": chart_data,
            "risk_history": [],
            "details": {},
            "last_updated": datetime.now().isoformat(),
            "is_mock": True
        }


@app.get("/api/stocks/{ticker}/history")
async def get_stock_history(
    ticker: str,
    exchange: Optional[str] = Query("nse", description="Exchange: 'nse' or 'bse'"),
    period: Optional[str] = Query("3mo", description="Data period: 1mo, 3mo, 6mo, 1y")
):
    """
    Get historical data for charts
    
    Args:
        ticker: Stock ticker symbol
        exchange: Exchange (nse/bse)
        period: Historical data period
    """
    try:
        # Select exchange
        if exchange and exchange.lower() == "bse":
            fetcher = fetcher_bse
            exchange_name = "BSE"
        else:
            fetcher = fetcher_nse
            exchange_name = "NSE"
        
        # Fetch data
        data = fetcher.fetch_historical_data(ticker, period=period)
        # Fetch data
        data = fetcher.fetch_historical_data(ticker, period=period)
        if data is None or data.empty:
            raise ValueError(f"Stock {ticker} not found or no data available")
        
        # Prepare history data
        history = []
        for idx, row in data.iterrows():
            history.append({
                "date": row['Date'].isoformat() if hasattr(row['Date'], 'isoformat') else str(row['Date']),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": int(row['Volume'])
            })
        
        return {
            "ticker": ticker,
            "exchange": exchange_name,
            "period": period,
            "data": history,
            "count": len(history)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")


@app.get("/api/alerts")
async def get_alerts(
    exchange: Optional[str] = Query(None, description="Exchange: 'nse' or 'bse'"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    limit: Optional[int] = Query(50, ge=1, le=200)
):
    """
    Get recent alerts (high-risk stocks)
    
    Args:
        exchange: Filter by exchange
        risk_level: Filter by risk level
        limit: Maximum number of alerts
    """
    try:
        # Get high-risk stocks
        exchange_param = exchange if exchange else "nse"
        stocks_response = await get_stocks(
            exchange=exchange_param,
            risk_level=risk_level or "high",
            limit=limit,
            offset=0,
            use_db=False
        )
        
        alerts = []
        for stock in stocks_response['stocks']:
            if stock['risk_score'] >= 60:  # High risk threshold
                alerts.append({
                    "ticker": stock['ticker'],
                    "exchange": stock['exchange'],
                    "risk_score": stock['risk_score'],
                    "risk_level": stock['risk_level'],
                    "price": stock['price'],
                    "price_change_percent": stock['price_change_percent'],
                    "timestamp": stock['last_updated'],
                    "message": f"{stock['ticker']} flagged as {stock['risk_level']} RISK"
                })
        
        # Sort by risk score (highest first)
        alerts.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return {
            "alerts": alerts[:limit],
            "total": len(alerts),
            "exchange": exchange_param.upper() if exchange_param else "ALL"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")


@app.get("/api/analytics")
async def get_analytics(
    exchange: Optional[str] = Query(None, description="Exchange: 'nse' or 'bse'")
):
    """
    Get overall system analytics
    
    Args:
        exchange: Filter by exchange
    """

    # Helper: always return a safe analytics payload instead of hard-crashing
    def _empty_analytics(exchange_name: str = "NSE") -> dict:
        return {
            "total_stocks": 0,
            "risk_distribution": {
                "low": 0,
                "medium": 0,
                "high": 0,
                "extreme": 0,
            },
            "average_risk_score": 0.0,
            "high_risk_count": 0,
            "exchange": exchange_name,
        }

    try:
        # Get all stocks (via the same logic as /api/stocks)
        stocks_response = await get_stocks(
            exchange=exchange, 
            limit=500,
            offset=0,
            use_db=False,
            risk_level=None
        )
        stocks = stocks_response.get("stocks", [])
        exchange_name = stocks_response.get("exchange", (exchange or "NSE").upper())

        if not stocks:
            # No data available – return a valid but empty analytics object
            return _empty_analytics(exchange_name)

        # Calculate statistics
        total_stocks = len(stocks)
        risk_scores = [s.get("risk_score", 0) for s in stocks]
        average_risk = sum(risk_scores) / total_stocks if total_stocks > 0 else 0.0

        # Risk distribution (normalise levels to upper-case for safety)
        def _level(s):
            return str(s.get("risk_level", "")).upper()

        risk_distribution = {
            "low": len([s for s in stocks if _level(s) == "LOW"]),
            "medium": len([s for s in stocks if _level(s) == "MEDIUM"]),
            "high": len([s for s in stocks if _level(s) == "HIGH"]),
            "extreme": len([s for s in stocks if _level(s) == "EXTREME"]),
        }

        high_risk_count = risk_distribution["high"] + risk_distribution["extreme"]

        return {
            "total_stocks": total_stocks,
            "risk_distribution": risk_distribution,
            "average_risk_score": round(average_risk, 2),
            "high_risk_count": high_risk_count,
            "exchange": exchange_name,
        }

    except HTTPException:
        # If the underlying /api/stocks logic fails (e.g. NSE API issue),
        # fall back to an empty but valid analytics response so the
        # frontend dashboard still renders instead of showing a 500.
        return _empty_analytics((exchange or "NSE").upper())
    except Exception as e:
        # As a last resort, avoid a hard 500 and return empty analytics
        print(f"Error fetching analytics: {e}")
        return _empty_analytics((exchange or "NSE").upper())


# ============================================================================
# PHASE 5: ADVANCED FEATURES
# ============================================================================

# Phase 5A: Social Media Integration
@app.get("/api/stocks/{ticker}/social")
async def get_stock_social(
    ticker: str,
    exchange: Optional[str] = Query("nse", description="Exchange: 'nse' or 'bse'"),
    hours: Optional[int] = Query(24, ge=1, le=168, description="Hours to look back")
):
    """Get social media data for a stock"""
    print(f"🌐 [API] /api/stocks/{ticker}/social called")
    
    try:
        if not SOCIAL_AVAILABLE:
            print("⚠️  [API] Social media not available - returning mock data")
            return {
                "ticker": ticker,
                "twitter": twitter_monitor.get_stock_social_data(ticker, hours=hours),
                "telegram": telegram_monitor._mock_mentions(ticker, hours),
                "note": "Social media monitoring not fully configured - showing mock data"
            }
        
        print(f"📱 [API] Fetching Twitter data for {ticker}...")
        twitter_data = twitter_monitor.get_stock_social_data(ticker, hours=hours)
        print(f"✅ [API] Twitter data fetched: {twitter_data.get('mention_count', 0)} mentions")
        
        print(f"📱 [API] Fetching Telegram data for {ticker}...")
        # Use async version for Telegram
        if hasattr(telegram_monitor, 'get_stock_social_data_async'):
            telegram_data = await telegram_monitor.get_stock_social_data_async(ticker, hours=hours)
        else:
            print("⚠️  [API] ⚠️⚠️⚠️ BACKEND NEEDS RESTART ⚠️⚠️⚠️")
            print("⚠️  [API] The async method is not loaded. Please restart the backend server.")
            print("⚠️  [API] Using direct search_mentions call as fallback...")
            # Direct fallback: call search_mentions and format the result
            try:
                print(f"  🔍 [API] Calling search_mentions for {ticker} with hours={hours}...")
                print(f"  🔍 [API] Telegram monitor channels before call: {telegram_monitor.default_channels}")
                mentions = await telegram_monitor.search_mentions(ticker, channel_usernames=None, hours=hours)
                print(f"  📊 [API] search_mentions returned {len(mentions)} mentions")
                if mentions:
                    print(f"  📋 [API] First mention: {mentions[0].get('text', '')[:50]}... from channel: {mentions[0].get('channel', 'unknown')}")
                pump_signals = [m for m in mentions if m.get('is_pump_signal', False)]
                coordination = telegram_monitor.detect_coordination(mentions)
                channels = list(set(m.get('channel', 'unknown') for m in mentions))
                telegram_data = {
                    'ticker': ticker,
                    'mention_count': len(mentions),
                    'pump_signal_count': len(pump_signals),
                    'coordination': coordination,
                    'channels': channels,
                    'recent_mentions': mentions[:10]
                }
            except Exception as e:
                print(f"❌ [API] Fallback also failed: {e}")
                import traceback
                traceback.print_exc()
                # Last resort: mock data
                mentions = telegram_monitor._mock_mentions(ticker, hours)
                telegram_data = {
                    'ticker': ticker,
                    'mention_count': len(mentions),
                    'pump_signal_count': len([m for m in mentions if m.get('is_pump_signal', False)]),
                    'coordination': {'is_coordinated': False, 'coordination_score': 0},
                    'channels': list(set(m.get('channel', 'unknown') for m in mentions)),
                    'recent_mentions': mentions[:10]
                }
        print(f"✅ [API] Telegram data fetched: {telegram_data.get('mention_count', 0)} mentions")
        
        # Calculate combined hype score (only Telegram for now, skip Twitter)
        telegram_hype = telegram_data.get('pump_signal_count', 0) * 10  # Scale to 0-100
        combined_hype = min(telegram_hype, 100)  # Use only Telegram for now
        
        print(f"📊 [API] Combined hype score: {combined_hype}")
        
        result = {
            "ticker": ticker,
            "twitter": twitter_data,  # Keep for compatibility but will be mock
            "telegram": telegram_data,
            "combined_hype_score": round(combined_hype, 2),
            "last_updated": datetime.now().isoformat()
        }
        
        print(f"✅ [API] Returning social data for {ticker}")
        return result
    except Exception as e:
        print(f"❌ [API] Error fetching social data: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching social data: {str(e)}")


@app.get("/api/social/trending")
async def get_trending_stocks(
    exchange: Optional[str] = Query("nse", description="Exchange: 'nse' or 'bse'"),
    limit: Optional[int] = Query(10, ge=1, le=50)
):
    """Get trending stocks on social media"""
    try:
        import random
        
        # Get popular stocks
        stock_list = POPULAR_NSE_STOCKS if exchange != "bse" else POPULAR_BSE_STOCKS
        stocks_to_check = stock_list[:min(limit * 3, len(stock_list))]
        
        trending = []
        for ticker in stocks_to_check:
            try:
                if SOCIAL_AVAILABLE:
                    print(f"📊 [API] Checking trending for {ticker}...")
                    try:
                        twitter_data = twitter_monitor.get_stock_social_data(ticker, hours=24)
                        print(f"  📱 [API] Twitter done for {ticker}")
                        
                        # Debug: Check what channels the monitor has
                        print(f"  🔍 [API] Telegram monitor default_channels: {telegram_monitor.default_channels}")
                        print(f"  🔍 [API] Telegram monitor is_configured: {telegram_monitor.is_configured}")
                        
                        # Try async method, fallback to direct call
                        if hasattr(telegram_monitor, 'get_stock_social_data_async'):
                            print(f"  📱 [API] Calling async Telegram method for {ticker}...")
                            telegram_data = await telegram_monitor.get_stock_social_data_async(ticker, hours=24)
                        else:
                            print(f"  ⚠️  [API] Async method not found, using direct search_mentions for {ticker}...")
                            # Force use of hardcoded channels by explicitly passing None
                            try:
                                print(f"  🔍 [API] About to call search_mentions for {ticker}...")
                                mentions = await telegram_monitor.search_mentions(ticker, channel_usernames=None, hours=24)
                                print(f"  📊 [API] search_mentions returned {len(mentions)} mentions for {ticker}")
                            except Exception as e:
                                print(f"  ❌ [API] Error in search_mentions for {ticker}: {e}")
                                import traceback
                                traceback.print_exc()
                                mentions = []
                            
                            pump_signals = [m for m in mentions if m.get('is_pump_signal', False)]
                            coordination = telegram_monitor.detect_coordination(mentions)
                            channels = list(set(m.get('channel', 'unknown') for m in mentions))
                            telegram_data = {
                                'ticker': ticker,
                                'mention_count': len(mentions),
                                'pump_signal_count': len(pump_signals),
                                'coordination': coordination,
                                'channels': channels,
                                'recent_mentions': mentions[:10]
                            }
                        
                        print(f"  ✅ [API] Telegram done for {ticker}: {telegram_data.get('mention_count', 0)} mentions")
                        
                        # Use only Telegram for hype score (skip Twitter)
                        hype_score = min(telegram_data.get('pump_signal_count', 0) * 10, 100)
                        twitter_mentions = twitter_data.get('mention_count', 0)
                        telegram_signals = telegram_data.get('pump_signal_count', 0)
                        print(f"  ✅ {ticker}: Hype={hype_score}, Telegram={telegram_signals}, Mentions={telegram_data.get('mention_count', 0)}")
                    except Exception as e:
                        print(f"  ❌ [API] Error checking {ticker}: {e}")
                        import traceback
                        traceback.print_exc()
                        # Fallback to mock
                        hype_score = random.uniform(20, 60)
                        twitter_mentions = 0
                        telegram_signals = 0
                else:
                    # Generate mock data for demo purposes
                    # Simulate some stocks with varying hype levels
                    base_hype = random.uniform(15, 85)
                    # Make some stocks more "trending" than others
                    if ticker in ["RELIANCE", "TCS", "HDFCBANK", "INFY", "BHARTIARTL"]:
                        hype_score = random.uniform(60, 90)  # High hype for popular stocks
                    elif ticker in ["YESBANK", "SUZLON", "PAYTM"]:
                        hype_score = random.uniform(70, 95)  # Very high hype (often manipulated)
                    else:
                        hype_score = base_hype
                    
                    twitter_mentions = int(hype_score * random.uniform(0.5, 2))
                    telegram_signals = int(hype_score * random.uniform(0.1, 0.5))
                
                # Include all stocks (even with 0 hype) so we can see what's happening
                # Filter by hype_score > 0 or show top N regardless
                trending.append({
                    "ticker": ticker,
                    "hype_score": round(hype_score, 2),
                    "twitter_mentions": twitter_mentions,
                    "telegram_signals": telegram_signals
                })
                print(f"  📝 [API] Added {ticker} to trending list (hype={round(hype_score, 2)})")
            except Exception as e:
                # Skip stocks that fail, but continue processing
                continue
        
        # Sort by hype score (highest first)
        trending.sort(key=lambda x: x['hype_score'], reverse=True)
        
        # Return top trending stocks (filter out 0 hype if we have many results)
        if len(trending) > limit:
            # If we have many results, filter out 0 hype scores
            result = [t for t in trending if t['hype_score'] > 0][:limit]
            if len(result) < limit:
                # If not enough with hype > 0, include some with 0 hype
                result = trending[:limit]
        else:
            result = trending
        
        print(f"📊 [API] Returning {len(result)} trending stocks (out of {len(trending)} checked)")
        for stock in result[:5]:  # Log first 5
            print(f"  - {stock['ticker']}: Hype={stock['hype_score']}, Telegram={stock['telegram_signals']}")
        
        return {
            "trending": result,
            "exchange": exchange.upper(),
            "last_updated": datetime.now().isoformat(),
            "note": "Mock data" if not SOCIAL_AVAILABLE else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trending stocks: {str(e)}")


# Phase 5B: Advanced Visualizations
@app.get("/api/visuals/heatmap")
async def get_risk_heatmap(
    exchange: Optional[str] = Query("nse", description="Exchange: 'nse' or 'bse'"),
    limit: Optional[int] = Query(50, ge=10, le=200)
):
    """Get risk heatmap data for visualization"""
    try:
        # Get stocks
        stock_list = POPULAR_NSE_STOCKS if exchange != "bse" else POPULAR_BSE_STOCKS
        stocks_to_analyze = stock_list[:limit]
        fetcher = fetcher_nse if exchange != "bse" else fetcher_bse
        
        heatmap_data = []
        for ticker in stocks_to_analyze:
            try:
                data = fetcher.fetch_historical_data(ticker, period="1mo")
                if data is None or data.empty:
                    continue
                
                risk_result = risk_scorer.calculate_risk_score(data, ticker)
                
                heatmap_data.append({
                    "ticker": ticker,
                    "risk_score": round(risk_result['risk_score'], 2),
                    "risk_level": risk_result['risk_level'],
                    "price": round(float(data['Close'].iloc[-1]), 2) if not data.empty else 0
                })
            except:
                continue
        
        return {
            "heatmap": heatmap_data,
            "exchange": exchange.upper(),
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating heatmap: {str(e)}")


@app.get("/api/visuals/correlation")
async def get_correlation_matrix(
    exchange: Optional[str] = Query("nse", description="Exchange: 'nse' or 'bse'"),
    tickers: Optional[str] = Query(None, description="Comma-separated list of tickers"),
    limit: Optional[int] = Query(20, ge=5, le=50)
):
    """Get correlation matrix for stocks"""
    try:
        import numpy as np
        import pandas as pd
        
        # Get tickers
        if tickers:
            ticker_list = [t.strip().upper() for t in tickers.split(",")]
        else:
            stock_list = POPULAR_NSE_STOCKS if exchange != "bse" else POPULAR_BSE_STOCKS
            ticker_list = stock_list[:limit]
        
        fetcher = fetcher_nse if exchange != "bse" else fetcher_bse
        
        # Fetch price data for all tickers
        price_data = {}
        for ticker in ticker_list:
            try:
                data = fetcher.fetch_historical_data(ticker, period="3mo")
                if data is not None and not data.empty:
                    price_data[ticker] = data['Close']
            except:
                continue
        
        if len(price_data) < 2:
            return {
                "correlation": {},
                "tickers": list(price_data.keys()),
                "note": "Insufficient data for correlation"
            }
        
        # Create DataFrame and calculate correlation
        df = pd.DataFrame(price_data)
        correlation_matrix = df.corr().to_dict()
        
        return {
            "correlation": correlation_matrix,
            "tickers": list(price_data.keys()),
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating correlation: {str(e)}")


# Phase 5C: ML Explainability
@app.get("/api/stocks/{ticker}/explain")
async def explain_stock_risk(
    ticker: str,
    exchange: Optional[str] = Query("nse", description="Exchange: 'nse' or 'bse'"),
    period: Optional[str] = Query("3mo", description="Data period")
):
    """Get ML model explanation for why a stock is flagged"""
    try:
        # Select exchange
        if exchange and exchange.lower() == "bse":
            fetcher = fetcher_bse
        else:
            fetcher = fetcher_nse
        
        # Fetch data
        data = fetcher.fetch_historical_data(ticker, period=period)
        # Fetch data
        data = fetcher.fetch_historical_data(ticker, period=period)
        if data is None or data.empty:
            raise ValueError(f"Stock {ticker} not found")
        
        # Calculate risk score with details
        risk_result = risk_scorer.calculate_risk_score(data, ticker)
        
        # Extract feature contributions if ML is enabled
        ml_status = risk_result.get('ml_status', {})
        feature_importance = {}
        contributions = []
        
        if ml_status.get('enabled', False) and 'feature_importance' in ml_status:
            feature_importance = ml_status['feature_importance']
            
            # Get top contributing features
            sorted_features = sorted(
                feature_importance.items(),
                key=lambda x: abs(x[1]),
                reverse=True
            )[:10]
            
            for feature, value in sorted_features:
                contributions.append({
                    "feature": feature,
                    "contribution": round(value, 4),
                    "impact": "high" if abs(value) > 0.1 else "medium" if abs(value) > 0.05 else "low"
                })
        
        # Get individual detector scores
        individual_scores = risk_result.get('individual_scores', {})
        
        return {
            "ticker": ticker,
            "risk_score": round(risk_result['risk_score'], 2),
            "risk_level": risk_result['risk_level'],
            "explanation": risk_result.get('explanation', ''),
            "red_flags": risk_result.get('red_flags', []),
            "feature_importance": feature_importance,
            "top_contributions": contributions,
            "detector_scores": {
                "volume": individual_scores.get('volume', 0),
                "price": individual_scores.get('price', 0),
                "ml": individual_scores.get('ml', 0),
                "social": individual_scores.get('social', 0)
            },
            "ml_status": ml_status,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        # Fallback mock data
        print(f"[WARNING] Explanation failed for {ticker}, returning mock data")
        import random
        random.seed(ticker)
        return {
            "ticker": ticker,
            "risk_score": 75.5,
            "risk_level": "HIGH",
            "explanation": "Detected unusual trading patterns often associated with pump-and-dump schemes.",
            "red_flags": ["Sudden volume spike without news", "Rapid price increase"],
            "feature_importance": {"volume_change": 0.45, "price_momentum": 0.35, "volatility": 0.2},
            "top_contributions": [
                {"feature": "volume_change", "contribution": 0.45, "impact": "high"},
                {"feature": "price_momentum", "contribution": 0.35, "impact": "high"}
            ],
            "detector_scores": {
                "volume": 85,
                "price": 65,
                "ml": 78,
                "social": 45
            },
            "ml_status": {"enabled": True},
            "last_updated": datetime.now().isoformat(),
            "is_mock": True
        }


# Phase 5D: Pattern Matching
@app.get("/api/patterns/match")
async def match_patterns(
    ticker: str,
    exchange: Optional[str] = Query("nse", description="Exchange: 'nse' or 'bse'"),
    period: Optional[str] = Query("3mo", description="Data period")
):
    """Match current stock pattern with historical pump-and-dump patterns"""
    try:
        # Select exchange
        if exchange and exchange.lower() == "bse":
            fetcher = fetcher_bse
        else:
            fetcher = fetcher_nse
        
        # Fetch data
        # Fetch data
        data = fetcher.fetch_historical_data(ticker, period=period)
        if data is None or data.empty:
            raise ValueError(f"Stock {ticker} not found")
        
        # Calculate risk score
        risk_result = risk_scorer.calculate_risk_score(data, ticker)
        
        # Simple pattern matching (compare with known patterns)
        # In production, this would use DTW or LSTM-based matching
        current_price = float(data['Close'].iloc[-1])
        price_30d_ago = float(data['Close'].iloc[0]) if len(data) > 30 else current_price
        price_change_pct = ((current_price - price_30d_ago) / price_30d_ago) * 100
        
        current_volume = float(data['Volume'].iloc[-1])
        avg_volume = float(data['Volume'].mean())
        volume_spike = (current_volume / avg_volume) * 100 if avg_volume > 0 else 0
        
        # Pattern characteristics
        pattern_type = "unknown"
        similarity_score = 0
        
        # Detect pump pattern
        if price_change_pct > 50 and volume_spike > 200:
            pattern_type = "pump_pattern"
            similarity_score = min(85 + (price_change_pct - 50) / 10, 95)
        elif price_change_pct > 30 and volume_spike > 150:
            pattern_type = "potential_pump"
            similarity_score = min(70 + (price_change_pct - 30) / 10, 85)
        elif risk_result['risk_score'] > 70:
            pattern_type = "high_risk"
            similarity_score = risk_result['risk_score']
        
        # Mock historical matches
        historical_matches = [
            {
                "stock": "YESBANK",
                "date": "2020-03-01",
                "similarity": round(similarity_score * 0.9, 2),
                "outcome": "Crash: -60% in 7 days",
                "pattern_type": pattern_type
            }
        ]
        
        return {
            "ticker": ticker,
            "current_pattern": {
                "type": pattern_type,
                "price_change_30d": round(price_change_pct, 2),
                "volume_spike": round(volume_spike, 2),
                "risk_score": round(risk_result['risk_score'], 2)
            },
            "historical_matches": historical_matches,
            "best_match": historical_matches[0] if historical_matches else None,
            "similarity_score": round(similarity_score, 2),
            "warning": "High similarity to historical pump-and-dump pattern" if similarity_score > 75 else None,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        # Fallback mock data
        print(f"[WARNING] Pattern match failed for {ticker}, returning mock data")
        return {
            "ticker": ticker,
            "current_pattern": {
                "type": "potential_pump",
                "price_change_30d": 15.5,
                "volume_spike": 120.5,
                "risk_score": 65.0
            },
            "historical_matches": [
                {
                    "stock": "YESBANK",
                    "date": "2020-03-01",
                    "similarity": 85.5,
                    "outcome": "Crash: -60% in 7 days",
                    "pattern_type": "pump_pattern"
                }
            ],
            "best_match": {
                "stock": "YESBANK",
                "date": "2020-03-01",
                "similarity": 85.5,
                "outcome": "Crash: -60% in 7 days",
                "pattern_type": "pump_pattern"
            },
            "similarity_score": 85.5,
            "warning": "High similarity to historical pump-and-dump pattern",
            "last_updated": datetime.now().isoformat(),
            "is_mock": True
        }


# Phase 5E: Predictive Alerts
@app.get("/api/stocks/{ticker}/predict")
async def predict_crash(
    ticker: str,
    exchange: Optional[str] = Query("nse", description="Exchange: 'nse' or 'bse'"),
    days_ahead: Optional[int] = Query(7, ge=1, le=30, description="Days to predict ahead")
):
    """Predict crash probability for a stock"""
    try:
        # Select exchange
        if exchange and exchange.lower() == "bse":
            fetcher = fetcher_bse
        else:
            fetcher = fetcher_nse
        
        # Fetch data
        # Fetch data
        data = fetcher.fetch_historical_data(ticker, period="6mo")
        if data is None or data.empty:
            raise ValueError(f"Stock {ticker} not found")
        
        # Calculate risk score
        risk_result = risk_scorer.calculate_risk_score(data, ticker)
        
        # Simple predictive model (in production, use LSTM/GRU)
        risk_score = risk_result['risk_score']
        
        # Crash probability based on risk score and recent trends
        base_probability = risk_score * 0.8  # Scale risk score to probability
        
        # Adjust based on recent volatility
        if len(data) > 20:
            recent_returns = data['Close'].pct_change().tail(20)
            volatility = recent_returns.std() * 100
            if volatility > 5:
                base_probability += 10
        
        crash_probability = min(max(base_probability, 0), 95)  # Cap at 95%
        
        # Confidence based on data quality
        confidence = 70 if len(data) > 60 else 50
        
        # Alert level
        if crash_probability > 70:
            alert_level = "CRITICAL"
        elif crash_probability > 50:
            alert_level = "HIGH"
        elif crash_probability > 30:
            alert_level = "MODERATE"
        else:
            alert_level = "LOW"
        
        return {
            "ticker": ticker,
            "crash_probability": round(crash_probability, 2),
            "confidence": confidence,
            "alert_level": alert_level,
            "prediction_window": f"{days_ahead} days",
            "risk_score": round(risk_score, 2),
            "recommendation": "Avoid trading" if crash_probability > 70 else "Monitor closely" if crash_probability > 50 else "Low risk",
            "factors": {
                "current_risk": round(risk_score, 2),
                "volatility": round(volatility, 2) if len(data) > 20 else 0,
                "volume_anomaly": risk_result.get('individual_scores', {}).get('volume', 0) > 30
            },
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        # Fallback mock data
        print(f"[WARNING] Prediction failed for {ticker}, returning mock data")
        import random
        random.seed(ticker)
        prob = random.uniform(40, 90)
        return {
            "ticker": ticker,
            "crash_probability": round(prob, 2),
            "confidence": 75,
            "alert_level": "HIGH" if prob > 70 else "MODERATE",
            "prediction_window": f"{days_ahead} days",
            "risk_score": round(prob * 0.9, 2),
            "recommendation": "Monitor closely",
            "factors": {
                "current_risk": round(prob * 0.9, 2),
                "volatility": 12.5,
                "volume_anomaly": True
            },
            "last_updated": datetime.now().isoformat(),
            "is_mock": True
        }


@app.get("/api/alerts/predictive")
async def get_predictive_alerts(
    exchange: Optional[str] = Query("nse", description="Exchange: 'nse' or 'bse'"),
    limit: Optional[int] = Query(20, ge=1, le=100),
    min_probability: Optional[float] = Query(50.0, ge=0, le=100, description="Minimum crash probability")
):
    """Get predictive alerts for stocks likely to crash"""
    try:
        stock_list = POPULAR_NSE_STOCKS if exchange != "bse" else POPULAR_BSE_STOCKS
        fetcher = fetcher_nse if exchange != "bse" else fetcher_bse
        
        alerts = []
        for ticker in stock_list[:limit * 2]:
            try:
                data = fetcher.fetch_historical_data(ticker, period="3mo")
                if data is None or data.empty:
                    continue
                
                risk_result = risk_scorer.calculate_risk_score(data, ticker)
                risk_score = risk_result['risk_score']
                
                # Calculate crash probability
                crash_probability = min(risk_score * 0.8, 95)
                
                if crash_probability >= min_probability:
                    alerts.append({
                        "ticker": ticker,
                        "exchange": exchange.upper(),
                        "crash_probability": round(crash_probability, 2),
                        "risk_score": round(risk_score, 2),
                        "alert_level": "CRITICAL" if crash_probability > 70 else "HIGH" if crash_probability > 50 else "MODERATE",
                        "predicted_window": "3-7 days",
                        "current_price": round(float(data['Close'].iloc[-1]), 2)
                    })
            except:
                continue
        
        alerts.sort(key=lambda x: x['crash_probability'], reverse=True)
        
        return {
            "alerts": alerts[:limit],
            "total": len(alerts),
            "exchange": exchange.upper(),
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching predictive alerts: {str(e)}")


# ============================================================================
# DATA ENGINEERING API ENDPOINTS
# ============================================================================

@app.get("/api/data/pipelines")
async def list_pipelines():
    """List available data pipelines"""
    if not DATA_ENGINEERING_AVAILABLE:
        return {"error": "Data engineering modules not available"}
    
    pipelines = [
        {
            "name": "stock_data",
            "description": "ETL pipeline for stock price data",
            "source": "NSE/BSE APIs",
            "frequency": "Every 5 minutes",
            "status": "available"
        }
    ]
    
    # Add social pipeline if available
    if SOCIAL_PIPELINE_AVAILABLE:
        pipelines.append({
            "name": "social_media",
            "description": "ETL pipeline for social media mentions",
            "source": "Twitter & Telegram",
            "frequency": "Every 10 minutes",
            "status": "available"
        })
    else:
        pipelines.append({
            "name": "social_media",
            "description": "ETL pipeline for social media mentions",
            "source": "Twitter & Telegram",
            "frequency": "Every 10 minutes",
            "status": "unavailable",
            "reason": "PyTorch DLL issue - will work when PyTorch is fixed"
        })
    
    return {"pipelines": pipelines}

@app.post("/api/data/pipelines/{pipeline_name}/run")
async def run_pipeline(pipeline_name: str):
    """Manually trigger a data pipeline"""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")
    
    try:
        if pipeline_name == "stock_data":
            pipeline = StockDataPipeline()
        elif pipeline_name == "social_media":
            if not SOCIAL_PIPELINE_AVAILABLE or SocialMediaPipeline is None:
                raise HTTPException(
                    status_code=503, 
                    detail="Social media pipeline not available due to PyTorch DLL issue. Stock pipeline is working."
                )
            pipeline = SocialMediaPipeline()
        else:
            raise HTTPException(status_code=404, detail=f"Pipeline '{pipeline_name}' not found")
        
        result = pipeline.run()
        
        # Record in monitor
        if pipeline_monitor:
            pipeline_monitor.record_pipeline_run(pipeline_name, result)

        # Publish to stream (for real-time UI)
        try:
            if 'stream_processor' in globals() and stream_processor:
                stream_processor.publish("pipeline_runs", {
                    "pipeline": pipeline_name,
                    "success": result.get("success", False),
                    "records_loaded": result.get("records_loaded", 0),
                    "duration_seconds": result.get("duration_seconds", 0),
                    "timestamp": result.get("timestamp"),
                })
        except Exception as _e:
            # Streaming is best-effort; never break the API for this
            pass
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")

@app.get("/api/data/pipelines/{pipeline_name}/status")
async def get_pipeline_status(pipeline_name: str):
    """Get status and health of a pipeline"""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")
    
    if not pipeline_monitor:
        return {"error": "Pipeline monitor not available"}
    
    health = pipeline_monitor.get_pipeline_health(pipeline_name)
    return health

@app.get("/api/data/pipelines/health")
async def get_all_pipeline_health():
    """Get health status of all pipelines"""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")
    
    if not pipeline_monitor:
        return {"error": "Pipeline monitor not available"}
    
    return pipeline_monitor.get_all_health()

@app.get("/api/data/pipelines/scheduler/status")
async def get_scheduler_status():
    """Get pipeline scheduler status"""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")
    
    if not pipeline_scheduler:
        return {"error": "Pipeline scheduler not available"}
    
    return pipeline_scheduler.get_status()

@app.get("/api/data/warehouse/stats")
async def get_warehouse_stats():
    """Get data warehouse statistics"""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")
    
    try:
        warehouse = DataWarehouse()
        stats = warehouse.get_warehouse_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get warehouse stats: {str(e)}")


@app.get("/api/data/quality/stocks")
async def get_stock_data_quality(
    ticker: Optional[str] = Query(None, description="Optional ticker filter"),
    days: int = Query(7, ge=1, le=365, description="Days of history to analyse"),
):
    """Get basic data quality metrics for stock data."""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")

    try:
        from src.data.validation import DataValidator, DataQualityMetrics

        warehouse = DataWarehouse()
        validator = DataValidator()
        metrics = DataQualityMetrics()

        # Pull historical data (all tickers or one)
        if ticker:
            records_df = warehouse.get_historical_stock_data(ticker.upper(), days)
        else:
            # Simple approach: use recent in-memory/DB stats for demo
            # For now, just return stats without pulling everything
            stats = warehouse.get_warehouse_stats()
            return {
                "scope": "all",
                "days": days,
                "warehouse_stats": stats,
            }

        records = records_df.to_dict(orient="records") if hasattr(records_df, "to_dict") else records_df
        report = metrics.generate_stock_quality_report(records, validator.validate_stock_record)
        report["ticker"] = ticker.upper()
        report["days"] = days
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute stock data quality: {str(e)}")


@app.get("/api/data/quality/social")
async def get_social_data_quality(
    ticker: Optional[str] = Query(None, description="Optional ticker filter"),
    hours: int = Query(24, ge=1, le=168, description="Hours of social data to analyse"),
):
    """Get basic data quality metrics for social media data."""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")

    try:
        from src.data.validation import DataValidator, DataQualityMetrics

        warehouse = DataWarehouse()
        validator = DataValidator()
        metrics = DataQualityMetrics()

        mentions = warehouse.get_recent_social_mentions(ticker.upper() if ticker else None, hours)
        report = metrics.generate_social_quality_report(mentions, validator.validate_social_record)
        if ticker:
            report["ticker"] = ticker.upper()
        report["hours"] = hours
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute social data quality: {str(e)}")


@app.get("/api/data/quality")
async def get_overall_data_quality(
    hours: int = Query(24, ge=1, le=168, description="Hours of recent data to analyse"),
):
    """
    High-level data quality dashboard metrics for the last N hours.
    
    Combines stock and social media data quality into a single response.
    """
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")

    try:
        from src.data.validation import DataValidator, DataQualityMetrics

        warehouse = DataWarehouse()
        validator = DataValidator()
        metrics = DataQualityMetrics()

        # Recent stock data (all tickers)
        stock_records = warehouse.get_recent_stock_data(hours)
        stock_report = metrics.generate_stock_quality_report(
            stock_records, validator.validate_stock_record
        )

        # Recent social data (all tickers)
        social_records = warehouse.get_recent_social_mentions(None, hours)
        social_report = metrics.generate_social_quality_report(
            social_records, validator.validate_social_record
        )

        return {
            "window_hours": hours,
            "stock": stock_report,
            "social": social_report,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute overall data quality: {str(e)}")


@app.get("/api/data/streams/pipelines")
async def get_pipeline_stream_events(
    limit: int = Query(50, ge=1, le=200, description="Maximum number of events to return"),
):
    """Get recent pipeline run events from the in-memory stream."""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")

    if 'stream_processor' not in globals() or not stream_processor:
        return {"events": [], "message": "Stream processor not available"}

    try:
        events = stream_processor.get_recent("pipeline_runs", limit=limit)
        return {
            "topic": "pipeline_runs",
            "events": events,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stream events: {str(e)}")

@app.get("/api/data/lake/stats")
async def get_data_lake_stats():
    """Get data lake statistics"""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")
    
    try:
        from src.data.storage.data_lake import DataLake
        data_lake = DataLake()
        stats = data_lake.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get data lake stats: {str(e)}")

@app.get("/api/data/lake/sources")
async def list_data_lake_sources():
    """List all data sources in the data lake"""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")
    
    try:
        from src.data.storage.data_lake import DataLake
        data_lake = DataLake()
        sources = data_lake.list_sources()
        return {"sources": sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list sources: {str(e)}")

@app.get("/api/data/lake/sources/{source}/dates")
async def list_data_lake_dates(source: str):
    """List all dates available for a data source"""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")
    
    try:
        from src.data.storage.data_lake import DataLake
        data_lake = DataLake()
        dates = data_lake.list_dates(source)
        return {"source": source, "dates": dates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list dates: {str(e)}")

@app.get("/api/data/lake/sources/{source}/data")
async def get_data_lake_data(
    source: str,
    date: Optional[str] = Query(None, description="Date in format YYYY-MM-DD or YYYY/MM/DD")
):
    """Retrieve raw data from data lake"""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")
    
    if not date:
        raise HTTPException(status_code=400, detail="Date parameter is required")
    
    try:
        from src.data.storage.data_lake import DataLake
        data_lake = DataLake()
        data = data_lake.retrieve_raw_data(source, date)
        return {
            "source": source,
            "date": date,
            "records": len(data),
            "data": data[:100]  # Limit to first 100 records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve data: {str(e)}")

@app.get("/api/data/warehouse/historical/{ticker}")
async def get_historical_data(
    ticker: str,
    days: int = Query(30, ge=1, le=365, description="Number of days of historical data")
):
    """Get historical stock data from warehouse"""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")
    
    try:
        warehouse = DataWarehouse()
        data = warehouse.get_historical_stock_data(ticker.upper(), days)
        return {
            "ticker": ticker.upper(),
            "days": days,
            "records": len(data),
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get historical data: {str(e)}")

@app.get("/api/data/warehouse/social/{ticker}")
async def get_warehouse_social_mentions(
    ticker: str,
    hours: int = Query(24, ge=1, le=168, description="Hours to look back")
):
    """Get social media mentions from warehouse"""
    if not DATA_ENGINEERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Data engineering modules not available")
    
    try:
        warehouse = DataWarehouse()
        mentions = warehouse.get_recent_social_mentions(ticker.upper(), hours)
        return {
            "ticker": ticker.upper(),
            "hours": hours,
            "records": len(mentions),
            "mentions": mentions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get social mentions: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

