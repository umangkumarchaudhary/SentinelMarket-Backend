"""
FastAPI Backend for SentinelMarket
Main API server
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import sys
import os
from datetime import datetime
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add SentinelMarket to path
sentinel_path = os.path.join(os.path.dirname(__file__), '..', 'SentinelMarket')
sys.path.append(sentinel_path)

# Import ML modules (type: ignore for linter - path is added dynamically)
from src.data.stock_data_fetcher import StockDataFetcher  # type: ignore
from src.detectors.risk_scorer import RiskScorer  # type: ignore

# Import database (optional - will work without it)
try:
    from database import db_manager, StockRepository
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("⚠️  Database module not available - running without database")

# Import social media monitoring (optional)
try:
    import sys
    social_path = os.path.join(os.path.dirname(__file__), 'src', 'social')
    sys.path.append(os.path.dirname(__file__))
    from src.social import twitter_monitor, telegram_monitor
    SOCIAL_AVAILABLE = True
except ImportError as e:
    SOCIAL_AVAILABLE = False
    print(f"⚠️  Social media monitoring not available: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="SentinelMarket API",
    description="AI-Powered Stock Anomaly Detection API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js default
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
        for ticker in stocks_to_analyze:
            try:
                # Fetch data
                data = fetcher.fetch_historical_data(ticker, period="3mo")
                if data is None or data.empty:
                    continue
                
                # Calculate risk score
                risk_result = risk_scorer.calculate_risk_score(data, ticker)
                
                # Filter by risk level if specified
                if risk_level:
                    risk_level_lower = risk_level.lower()
                    risk_result_level = risk_result['risk_level'].lower()
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
                    "risk_score": round(risk_result['risk_score'], 2),
                    "risk_level": risk_result['risk_level'],
                    "is_suspicious": risk_result['is_suspicious'],
                    "price": round(current_price, 2),
                    "price_change_percent": round(price_change, 2),
                    "volume": int(data['Volume'].iloc[-1]) if not data.empty else 0,
                    "last_updated": datetime.now().isoformat()
                })
            except Exception as e:
                # Skip stocks that fail
                continue
        
        # Sort by risk score (highest first)
        results.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return {
            "stocks": results,
            "total": len(results),
            "exchange": exchange_name,
            "limit": limit_int,
            "offset": offset_int
        }
    
    except Exception as e:
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
        if data is None or data.empty:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found or no data available")
        
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
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing stock: {str(e)}")


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
        if data is None or data.empty:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found or no data available")
        
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
    
    except HTTPException:
        raise
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
            limit=limit
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
        stocks_response = await get_stocks(exchange=exchange, limit=500)
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
    try:
        if not SOCIAL_AVAILABLE:
            return {
                "ticker": ticker,
                "twitter": twitter_monitor.get_stock_social_data(ticker, hours=hours),
                "telegram": telegram_monitor.get_stock_social_data(ticker, hours=hours),
                "note": "Social media monitoring not fully configured - showing mock data"
            }
        
        twitter_data = twitter_monitor.get_stock_social_data(ticker, hours=hours)
        telegram_data = telegram_monitor.get_stock_social_data(ticker, hours=hours)
        
        # Calculate combined hype score
        twitter_hype = twitter_data.get('hype_score', 0)
        telegram_hype = telegram_data.get('pump_signal_count', 0) * 10  # Scale to 0-100
        combined_hype = (twitter_hype * 0.6 + min(telegram_hype, 100) * 0.4)
        
        return {
            "ticker": ticker,
            "twitter": twitter_data,
            "telegram": telegram_data,
            "combined_hype_score": round(combined_hype, 2),
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
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
                    twitter_data = twitter_monitor.get_stock_social_data(ticker, hours=24)
                    telegram_data = telegram_monitor.get_stock_social_data(ticker, hours=24)
                    hype_score = (twitter_data.get('hype_score', 0) * 0.6 + 
                                 min(telegram_data.get('pump_signal_count', 0) * 10, 100) * 0.4)
                    twitter_mentions = twitter_data.get('mention_count', 0)
                    telegram_signals = telegram_data.get('pump_signal_count', 0)
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
                
                # Include stocks with hype_score > 15 (lower threshold to show more results)
                if hype_score > 15:
                    trending.append({
                        "ticker": ticker,
                        "hype_score": round(hype_score, 2),
                        "twitter_mentions": twitter_mentions,
                        "telegram_signals": telegram_signals
                    })
            except Exception as e:
                # Skip stocks that fail, but continue processing
                continue
        
        # Sort by hype score (highest first)
        trending.sort(key=lambda x: x['hype_score'], reverse=True)
        
        # Return top trending stocks
        result = trending[:limit]
        
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
        if data is None or data.empty:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
        
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating explanation: {str(e)}")


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
        data = fetcher.fetch_historical_data(ticker, period=period)
        if data is None or data.empty:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
        
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error matching patterns: {str(e)}")


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
        data = fetcher.fetch_historical_data(ticker, period="6mo")
        if data is None or data.empty:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
        
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating prediction: {str(e)}")


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

