"""
Database connection and models for SentinelMarket
Uses Supabase (PostgreSQL)
"""

import os
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import pandas as pd
from sqlalchemy import create_engine, text, MetaData, Table, Column, String, Numeric, Boolean, DateTime, Date, BigInteger, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/postgres"
)

# Debug print removed for production

# Create engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class DatabaseManager:
    """Database manager for SentinelMarket"""
    
    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal
    
    def get_session(self):
        """Get database session"""
        return self.SessionLocal()
    
    def test_connection(self) -> bool:
        """Test database connection"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            print(f"Database connection error: {e}")
            return False
    
    def create_tables(self):
        """Create all tables (if they don't exist)"""
        try:
            Base.metadata.create_all(bind=self.engine)
            return True
        except Exception as e:
            print(f"Error creating tables: {e}")
            return False


# Database operations
class StockRepository:
    """Repository for stock operations"""
    
    def __init__(self, db_session):
        self.db = db_session
    
    def get_or_create_stock(self, ticker: str, exchange: str, name: Optional[str] = None) -> Dict[str, Any]:
        """Get or create a stock record"""
        try:
            # Check if stock exists
            result = self.db.execute(
                text("""
                    SELECT id, ticker, exchange, name, sector, created_at, updated_at
                    FROM stocks
                    WHERE ticker = :ticker AND exchange = :exchange
                """),
                {"ticker": ticker, "exchange": exchange}
            )
            row = result.fetchone()
            
            if row:
                return {
                    "id": str(row[0]),
                    "ticker": row[1],
                    "exchange": row[2],
                    "name": row[3],
                    "sector": row[4],
                    "created_at": row[5],
                    "updated_at": row[6]
                }
            
            # Create new stock
            stock_id = uuid.uuid4()
            self.db.execute(
                text("""
                    INSERT INTO stocks (id, ticker, exchange, name, created_at, updated_at)
                    VALUES (:id, :ticker, :exchange, :name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """),
                {
                    "id": stock_id,
                    "ticker": ticker,
                    "exchange": exchange,
                    "name": name or ticker
                }
            )
            self.db.commit()
            
            return {
                "id": str(stock_id),
                "ticker": ticker,
                "exchange": exchange,
                "name": name or ticker,
                "sector": None,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
        except SQLAlchemyError as e:
            self.db.rollback()
            print(f"Error in get_or_create_stock: {e}")
            raise
    
    def save_stock_data(self, stock_id: str, data: pd.DataFrame) -> int:
        """Save stock price/volume data"""
        try:
            count = 0
            for _, row in data.iterrows():
                self.db.execute(
                    text("""
                        INSERT INTO stock_data 
                        (id, stock_id, date, open, high, low, close, volume, created_at)
                        VALUES 
                        (uuid_generate_v4(), :stock_id, :date, :open, :high, :low, :close, :volume, CURRENT_TIMESTAMP)
                        ON CONFLICT (stock_id, date) 
                        DO UPDATE SET
                            open = EXCLUDED.open,
                            high = EXCLUDED.high,
                            low = EXCLUDED.low,
                            close = EXCLUDED.close,
                            volume = EXCLUDED.volume
                    """),
                    {
                        "stock_id": uuid.UUID(stock_id),
                        "date": row['Date'].date() if hasattr(row['Date'], 'date') else row['Date'],
                        "open": float(row['Open']),
                        "high": float(row['High']),
                        "low": float(row['Low']),
                        "close": float(row['Close']),
                        "volume": int(row['Volume'])
                    }
                )
                count += 1
            self.db.commit()
            return count
        except SQLAlchemyError as e:
            self.db.rollback()
            print(f"Error in save_stock_data: {e}")
            raise
    
    def save_risk_assessment(self, stock_id: str, risk_result: Dict[str, Any]) -> str:
        """Save risk assessment result"""
        try:
            assessment_id = uuid.uuid4()
            
            # Prepare red_flags as JSON
            red_flags = risk_result.get('red_flags', [])
            details = risk_result.get('details', {})
            ml_status = risk_result.get('ml_status', {})
            
            self.db.execute(
                text("""
                    INSERT INTO risk_assessments 
                    (id, stock_id, timestamp, volume_score, price_score, ml_score, social_score,
                     final_risk_score, risk_level, is_suspicious, red_flags, details, explanation,
                     recommendation, ml_status, created_at)
                    VALUES 
                    (:id, :stock_id, CURRENT_TIMESTAMP, :volume_score, :price_score, :ml_score, :social_score,
                     :final_risk_score, :risk_level, :is_suspicious, :red_flags::jsonb, :details::jsonb, 
                     :explanation, :recommendation, :ml_status::jsonb, CURRENT_TIMESTAMP)
                """),
                {
                    "id": assessment_id,
                    "stock_id": uuid.UUID(stock_id),
                    "volume_score": risk_result.get('individual_scores', {}).get('volume_spike', 0),
                    "price_score": risk_result.get('individual_scores', {}).get('price_anomaly', 0),
                    "ml_score": risk_result.get('individual_scores', {}).get('ml_anomaly', 0),
                    "social_score": risk_result.get('individual_scores', {}).get('social_sentiment', 0),
                    "final_risk_score": risk_result.get('risk_score', 0),
                    "risk_level": risk_result.get('risk_level', 'LOW'),
                    "is_suspicious": risk_result.get('is_suspicious', False),
                    "red_flags": str(red_flags).replace("'", '"'),
                    "details": str(details).replace("'", '"'),
                    "explanation": risk_result.get('explanation', ''),
                    "recommendation": risk_result.get('recommendation', ''),
                    "ml_status": str(ml_status).replace("'", '"')
                }
            )
            self.db.commit()
            return str(assessment_id)
        except SQLAlchemyError as e:
            self.db.rollback()
            print(f"Error in save_risk_assessment: {e}")
            raise
    
    def create_alert(self, stock_id: str, risk_level: str, risk_score: float, message: str) -> str:
        """Create an alert"""
        try:
            alert_id = uuid.uuid4()
            self.db.execute(
                text("""
                    INSERT INTO alerts 
                    (id, stock_id, alert_type, risk_level, risk_score, message, created_at)
                    VALUES 
                    (:id, :stock_id, 'HIGH_RISK', :risk_level, :risk_score, :message, CURRENT_TIMESTAMP)
                """),
                {
                    "id": alert_id,
                    "stock_id": uuid.UUID(stock_id),
                    "risk_level": risk_level,
                    "risk_score": risk_score,
                    "message": message
                }
            )
            self.db.commit()
            return str(alert_id)
        except SQLAlchemyError as e:
            self.db.rollback()
            print(f"Error in create_alert: {e}")
            raise
    
    def get_latest_risk_assessments(self, exchange: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get latest risk assessments for all stocks"""
        try:
            query = """
                SELECT 
                    s.ticker,
                    s.exchange,
                    ra.final_risk_score,
                    ra.risk_level,
                    ra.is_suspicious,
                    ra.timestamp,
                    sd.close AS current_price,
                    sd.date AS price_date
                FROM stocks s
                INNER JOIN risk_assessments ra ON s.id = ra.stock_id
                INNER JOIN stock_data sd ON s.id = sd.stock_id
                WHERE ra.timestamp = (
                    SELECT MAX(timestamp)
                    FROM risk_assessments
                    WHERE stock_id = s.id
                )
                AND sd.date = (
                    SELECT MAX(date)
                    FROM stock_data
                    WHERE stock_id = s.id
                )
            """
            
            params = {}
            if exchange:
                query += " AND s.exchange = :exchange"
                params["exchange"] = exchange
            
            query += " ORDER BY ra.final_risk_score DESC LIMIT :limit"
            params["limit"] = limit
            
            result = self.db.execute(text(query), params)
            rows = result.fetchall()
            
            return [
                {
                    "ticker": row[0],
                    "exchange": row[1],
                    "risk_score": float(row[2]),
                    "risk_level": row[3],
                    "is_suspicious": row[4],
                    "timestamp": row[5],
                    "price": float(row[6]),
                    "price_date": row[7]
                }
                for row in rows
            ]
        except SQLAlchemyError as e:
            print(f"Error in get_latest_risk_assessments: {e}")
            raise


# Initialize database manager
db_manager = DatabaseManager()

