"""
Data Warehouse
Stores processed, queryable data for analytics
"""

import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text, MetaData, Table, Column, Integer, String, Float, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import JSONB
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class DataWarehouse:
    """Data warehouse for processed stock and social media data"""
    
    def __init__(self):
        """Initialize data warehouse connection"""
        database_url = self._get_database_url()
        
        if not database_url:
            logger.warning("No database URL configured - warehouse will use in-memory storage")
            self.engine = None
            self._in_memory_storage = {
                "stock_data": [],
                "social_mentions": []
            }
        else:
            try:
                self.engine = create_engine(database_url, pool_pre_ping=True)
                self._create_tables()
                logger.info("Data warehouse initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize warehouse: {e}")
                self.engine = None
                self._in_memory_storage = {
                    "stock_data": [],
                    "social_mentions": []
                }
    
    def _get_database_url(self) -> Optional[str]:
        """Get database URL from environment"""
        # Try direct DATABASE_URL first
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            return database_url
        
        # Try Supabase components
        db_user = os.getenv("SUPABASE_DB_USER")
        db_password = os.getenv("SUPABASE_DB_PASSWORD")
        db_host = os.getenv("SUPABASE_DB_HOST")
        db_port = os.getenv("SUPABASE_DB_PORT", "5432")
        db_name = os.getenv("SUPABASE_DB_NAME")
        
        if all([db_user, db_password, db_host, db_name]):
            return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        return None
    
    def _create_tables(self):
        """Create data warehouse tables if they don't exist"""
        if not self.engine:
            return
        
        try:
            with self.engine.connect() as conn:
                # Stock data warehouse table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS stock_data_warehouse (
                        id SERIAL PRIMARY KEY,
                        ticker VARCHAR(20) NOT NULL,
                        price DECIMAL(12, 2),
                        volume BIGINT,
                        change_percent DECIMAL(6, 2),
                        timestamp TIMESTAMP,
                        exchange VARCHAR(10),
                        source VARCHAR(50),
                        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        raw_data JSONB
                    )
                """))
                
                # Create indexes
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_stock_ticker_timestamp 
                    ON stock_data_warehouse(ticker, timestamp DESC)
                """))
                
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_stock_processed_at 
                    ON stock_data_warehouse(processed_at DESC)
                """))
                
                # Social mentions warehouse table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS social_mentions_warehouse (
                        id SERIAL PRIMARY KEY,
                        ticker VARCHAR(20),
                        platform VARCHAR(20),
                        text TEXT,
                        sentiment VARCHAR(20),
                        is_pump_signal BOOLEAN DEFAULT FALSE,
                        channel VARCHAR(100),
                        views INTEGER DEFAULT 0,
                        timestamp TIMESTAMP,
                        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        metadata JSONB
                    )
                """))
                
                # Create indexes
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_social_ticker_timestamp 
                    ON social_mentions_warehouse(ticker, timestamp DESC)
                """))
                
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_social_platform 
                    ON social_mentions_warehouse(platform)
                """))
                
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_social_pump_signal 
                    ON social_mentions_warehouse(is_pump_signal)
                """))
                
                conn.commit()
                logger.info("Data warehouse tables created/verified")
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
    
    def insert_stock_data(self, data: List[Dict[str, Any]]):
        """Insert stock data into warehouse"""
        if not data:
            return
        
        if not self.engine:
            # Use in-memory storage
            self._in_memory_storage["stock_data"].extend(data)
            logger.info(f"Stored {len(data)} stock records in memory")
            return
        
        try:
            with self.engine.connect() as conn:
                for record in data:
                    raw_data = record.get("raw_data", {})
                    conn.execute(text("""
                        INSERT INTO stock_data_warehouse 
                        (ticker, price, volume, change_percent, timestamp, exchange, source, raw_data)
                        VALUES (:ticker, :price, :volume, :change_percent, :timestamp, :exchange, :source, :raw_data)
                    """), {
                        "ticker": record["ticker"],
                        "price": float(record["price"]),
                        "volume": int(record.get("volume", 0)),
                        "change_percent": float(record.get("change_percent", 0)),
                        "timestamp": record.get("timestamp", datetime.now()),
                        "exchange": record.get("exchange", "NSE"),
                        "source": record.get("source", "api"),
                        "raw_data": json.dumps(raw_data) if raw_data else None
                    })
                conn.commit()
                logger.info(f"Inserted {len(data)} stock records into warehouse")
        except Exception as e:
            logger.error(f"Error inserting stock data: {e}")
            raise
    
    def insert_social_mentions(self, data: List[Dict[str, Any]]):
        """Insert social media mentions into warehouse"""
        if not data:
            return
        
        if not self.engine:
            # Use in-memory storage
            self._in_memory_storage["social_mentions"].extend(data)
            logger.info(f"Stored {len(data)} social mentions in memory")
            return
        
        try:
            with self.engine.connect() as conn:
                for record in data:
                    metadata = record.get("metadata", {})
                    conn.execute(text("""
                        INSERT INTO social_mentions_warehouse 
                        (ticker, platform, text, sentiment, is_pump_signal, channel, views, timestamp, metadata)
                        VALUES (:ticker, :platform, :text, :sentiment, :is_pump_signal, :channel, :views, :timestamp, :metadata)
                    """), {
                        "ticker": record["ticker"],
                        "platform": record["platform"],
                        "text": record["text"][:5000],  # Limit text length
                        "sentiment": record.get("sentiment", "neutral"),
                        "is_pump_signal": record.get("is_pump_signal", False),
                        "channel": record.get("channel", "unknown"),
                        "views": int(record.get("views", 0)),
                        "timestamp": record.get("timestamp", datetime.now()),
                        "metadata": json.dumps(metadata) if metadata else None
                    })
                conn.commit()
                logger.info(f"Inserted {len(data)} social mentions into warehouse")
        except Exception as e:
            logger.error(f"Error inserting social mentions: {e}")
            raise
    
    def get_historical_stock_data(self, ticker: str, days: int = 30) -> List[Dict]:
        """Query historical stock data"""
        if not self.engine:
            # Return from in-memory storage
            cutoff = datetime.now() - timedelta(days=days)
            return [
                r for r in self._in_memory_storage["stock_data"]
                if r["ticker"] == ticker and 
                datetime.fromisoformat(r["timestamp"].replace('Z', '+00:00')) >= cutoff
            ]
        
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT ticker, price, volume, change_percent, timestamp, exchange, source
                    FROM stock_data_warehouse
                    WHERE ticker = :ticker
                    AND timestamp >= NOW() - INTERVAL ':days days'
                    ORDER BY timestamp DESC
                """), {"ticker": ticker, "days": days})
                
                rows = result.fetchall()
                return [dict(row._mapping) for row in rows]
        except Exception as e:
            logger.error(f"Error querying historical data: {e}")
            return []
    
    def get_recent_social_mentions(self, ticker: Optional[str] = None, hours: int = 24) -> List[Dict]:
        """Query recent social media mentions"""
        if not self.engine:
            # Return from in-memory storage
            cutoff = datetime.now() - timedelta(hours=hours)
            mentions = self._in_memory_storage["social_mentions"]
            if ticker:
                mentions = [m for m in mentions if m["ticker"] == ticker]
            return [
                m for m in mentions
                if datetime.fromisoformat(m["timestamp"].replace('Z', '+00:00')) >= cutoff
            ]
        
        try:
            with self.engine.connect() as conn:
                query = """
                    SELECT ticker, platform, text, sentiment, is_pump_signal, channel, views, timestamp
                    FROM social_mentions_warehouse
                    WHERE timestamp >= NOW() - INTERVAL ':hours hours'
                """
                params = {"hours": hours}
                
                if ticker:
                    query += " AND ticker = :ticker"
                    params["ticker"] = ticker
                
                query += " ORDER BY timestamp DESC LIMIT 1000"
                
                result = conn.execute(text(query), params)
                rows = result.fetchall()
                return [dict(row._mapping) for row in rows]
        except Exception as e:
            logger.error(f"Error querying social mentions: {e}")
            return []
    
    def get_warehouse_stats(self) -> Dict[str, Any]:
        """Get warehouse statistics"""
        if not self.engine:
            return {
                "stock_records": len(self._in_memory_storage["stock_data"]),
                "social_mentions": len(self._in_memory_storage["social_mentions"]),
                "storage_type": "in_memory"
            }
        
        try:
            with self.engine.connect() as conn:
                stock_count = conn.execute(text("SELECT COUNT(*) FROM stock_data_warehouse")).scalar()
                social_count = conn.execute(text("SELECT COUNT(*) FROM social_mentions_warehouse")).scalar()
                
                return {
                    "stock_records": stock_count or 0,
                    "social_mentions": social_count or 0,
                    "storage_type": "database",
                    "timestamp": datetime.now().isoformat()
                }
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {"error": str(e)}



