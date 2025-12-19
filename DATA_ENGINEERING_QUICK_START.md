# Data Engineering Quick Start - Implementation Guide

## 🚀 Quick Implementation (4-6 hours)

### Step 1: Create Pipeline Framework (1 hour)

**File**: `backend/src/data/pipeline/__init__.py`
```python
# Empty init file
```

**File**: `backend/src/data/pipeline/base_pipeline.py`
```python
from abc import ABC, abstractmethod
from typing import Dict, List, Any
from datetime import datetime
import logging

class BasePipeline(ABC):
    """Base ETL pipeline class"""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"pipeline.{name}")
    
    @abstractmethod
    def extract(self) -> List[Dict[str, Any]]:
        """Extract data from source"""
        pass
    
    @abstractmethod
    def transform(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform raw data"""
        pass
    
    @abstractmethod
    def load(self, data: List[Dict[str, Any]]) -> bool:
        """Load data to destination"""
        pass
    
    def run(self) -> Dict[str, Any]:
        """Execute full pipeline"""
        start_time = datetime.now()
        
        try:
            self.logger.info(f"Starting {self.name} pipeline")
            
            # Extract
            raw_data = self.extract()
            self.logger.info(f"Extracted {len(raw_data)} records")
            
            # Transform
            transformed_data = self.transform(raw_data)
            self.logger.info(f"Transformed {len(transformed_data)} records")
            
            # Load
            success = self.load(transformed_data)
            
            duration = (datetime.now() - start_time).total_seconds()
            
            return {
                "pipeline": self.name,
                "success": success,
                "records_processed": len(transformed_data),
                "duration_seconds": round(duration, 2),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Pipeline {self.name} failed: {e}")
            return {
                "pipeline": self.name,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
```

### Step 2: Implement Stock Data Pipeline (1.5 hours)

**File**: `backend/src/data/pipeline/stock_pipeline.py`
```python
from .base_pipeline import BasePipeline
from src.data.fetch_stock_data import fetch_stock_data  # Your existing function
from src.data.storage.warehouse import DataWarehouse
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

class StockDataPipeline(BasePipeline):
    """ETL pipeline for stock price data"""
    
    def __init__(self):
        super().__init__("stock_data")
        self.warehouse = DataWarehouse()
    
    def extract(self) -> List[Dict]:
        """Fetch stock data from API"""
        stocks = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", 
                  "HINDUNILVR", "BHARTIARTL", "ITC", "SBIN", "BAJFINANCE"]
        data = []
        
        for ticker in stocks:
            try:
                stock_data = fetch_stock_data(ticker, "nse")
                if stock_data:
                    data.append(stock_data)
            except Exception as e:
                self.logger.warning(f"Failed to fetch {ticker}: {e}")
        
        return data
    
    def transform(self, data: List[Dict]) -> List[Dict]:
        """Clean and transform stock data"""
        transformed = []
        
        for record in data:
            try:
                # Validate required fields
                if not all(k in record for k in ['ticker', 'price']):
                    continue
                
                # Transform
                transformed_record = {
                    "ticker": record["ticker"],
                    "price": float(record.get("price", 0)),
                    "volume": int(record.get("volume", 0)),
                    "change_percent": float(record.get("change_percent", 0)),
                    "timestamp": record.get("timestamp", datetime.now().isoformat()),
                    "exchange": record.get("exchange", "NSE"),
                    "processed_at": datetime.now().isoformat(),
                    "raw_data": record  # Store raw for audit
                }
                transformed.append(transformed_record)
            except Exception as e:
                self.logger.warning(f"Transform failed for record: {e}")
                continue
        
        return transformed
    
    def load(self, data: List[Dict]) -> bool:
        """Load to data warehouse"""
        try:
            self.warehouse.insert_stock_data(data)
            return True
        except Exception as e:
            self.logger.error(f"Load failed: {e}")
            return False
```

### Step 3: Create Data Warehouse (1.5 hours)

**File**: `backend/src/data/storage/__init__.py`
```python
# Empty init
```

**File**: `backend/src/data/storage/warehouse.py`
```python
from sqlalchemy import create_engine, text
from datetime import datetime
import os
from dotenv import load_dotenv
import json

load_dotenv()

class DataWarehouse:
    """Data warehouse for processed data"""
    
    def __init__(self):
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            # Fallback to Supabase URL
            database_url = (
                f"postgresql://{os.getenv('SUPABASE_DB_USER')}:"
                f"{os.getenv('SUPABASE_DB_PASSWORD')}@"
                f"{os.getenv('SUPABASE_DB_HOST')}:"
                f"{os.getenv('SUPABASE_DB_PORT', '5432')}/"
                f"{os.getenv('SUPABASE_DB_NAME')}"
            )
        
        self.engine = create_engine(database_url)
        self._create_tables()
    
    def _create_tables(self):
        """Create data warehouse tables"""
        with self.engine.connect() as conn:
            # Stock data warehouse table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS stock_data_warehouse (
                    id SERIAL PRIMARY KEY,
                    ticker VARCHAR(20) NOT NULL,
                    price DECIMAL(10, 2),
                    volume BIGINT,
                    change_percent DECIMAL(5, 2),
                    timestamp TIMESTAMP,
                    exchange VARCHAR(10),
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    raw_data JSONB,
                    INDEX idx_ticker_timestamp (ticker, timestamp)
                )
            """))
            
            # Social mentions warehouse table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS social_mentions_warehouse (
                    id SERIAL PRIMARY KEY,
                    ticker VARCHAR(20),
                    platform VARCHAR(20),
                    text TEXT,
                    sentiment VARCHAR(20),
                    is_pump_signal BOOLEAN,
                    channel VARCHAR(100),
                    timestamp TIMESTAMP,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    metadata JSONB,
                    INDEX idx_ticker_timestamp (ticker, timestamp),
                    INDEX idx_platform (platform)
                )
            """))
            
            conn.commit()
    
    def insert_stock_data(self, data: List[Dict]):
        """Insert stock data"""
        with self.engine.connect() as conn:
            for record in data:
                conn.execute(text("""
                    INSERT INTO stock_data_warehouse 
                    (ticker, price, volume, change_percent, timestamp, exchange, raw_data)
                    VALUES (:ticker, :price, :volume, :change_percent, :timestamp, :exchange, :raw_data)
                """), {
                    "ticker": record["ticker"],
                    "price": record["price"],
                    "volume": record.get("volume", 0),
                    "change_percent": record.get("change_percent", 0),
                    "timestamp": record["timestamp"],
                    "exchange": record.get("exchange", "NSE"),
                    "raw_data": json.dumps(record.get("raw_data", {}))
                })
            conn.commit()
    
    def get_historical_data(self, ticker: str, days: int = 30):
        """Query historical data"""
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT * FROM stock_data_warehouse
                WHERE ticker = :ticker
                AND timestamp >= NOW() - INTERVAL ':days days'
                ORDER BY timestamp DESC
            """), {"ticker": ticker, "days": days})
            return [dict(row) for row in result]
```

### Step 4: Add Pipeline Scheduler (1 hour)

**File**: `backend/src/data/scheduler/pipeline_scheduler.py`
```python
from apscheduler.schedulers.background import BackgroundScheduler
from src.data.pipeline.stock_pipeline import StockDataPipeline
from src.data.pipeline.social_pipeline import SocialMediaPipeline
import logging

logger = logging.getLogger(__name__)

class PipelineScheduler:
    """Schedule and run data pipelines"""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.stock_pipeline = StockDataPipeline()
        self.social_pipeline = SocialMediaPipeline()
    
    def start(self):
        """Start scheduled pipelines"""
        # Run stock pipeline every 5 minutes
        self.scheduler.add_job(
            self._run_stock_pipeline,
            'interval',
            minutes=5,
            id='stock_pipeline',
            name='Stock Data Pipeline'
        )
        
        # Run social pipeline every 10 minutes
        self.scheduler.add_job(
            self._run_social_pipeline,
            'interval',
            minutes=10,
            id='social_pipeline',
            name='Social Media Pipeline'
        )
        
        self.scheduler.start()
        logger.info("Pipeline scheduler started")
    
    def _run_stock_pipeline(self):
        """Run stock data pipeline"""
        try:
            result = self.stock_pipeline.run()
            logger.info(f"Stock pipeline result: {result}")
        except Exception as e:
            logger.error(f"Stock pipeline failed: {e}")
    
    def _run_social_pipeline(self):
        """Run social media pipeline"""
        try:
            result = self.social_pipeline.run()
            logger.info(f"Social pipeline result: {result}")
        except Exception as e:
            logger.error(f"Social pipeline failed: {e}")
    
    def stop(self):
        """Stop scheduler"""
        self.scheduler.shutdown()
```

### Step 5: Add API Endpoints (30 min)

**File**: `backend/main.py` (add these endpoints)

```python
from src.data.pipeline.stock_pipeline import StockDataPipeline
from src.data.storage.warehouse import DataWarehouse

@app.get("/api/data/pipeline/run")
async def run_pipeline(pipeline: str = "stock"):
    """Manually trigger a pipeline"""
    if pipeline == "stock":
        pipeline_instance = StockDataPipeline()
    else:
        return {"error": "Unknown pipeline"}
    
    result = pipeline_instance.run()
    return result

@app.get("/api/data/warehouse/historical/{ticker}")
async def get_historical_data(ticker: str, days: int = 30):
    """Get historical data from warehouse"""
    warehouse = DataWarehouse()
    data = warehouse.get_historical_data(ticker, days)
    return {"ticker": ticker, "data": data, "count": len(data)}

@app.get("/api/data/warehouse/health")
async def warehouse_health():
    """Check warehouse health"""
    warehouse = DataWarehouse()
    try:
        # Simple health check
        with warehouse.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

### Step 6: Update Requirements (5 min)

**File**: `requirements.txt` (add these)
```
apscheduler>=3.10.0
pandas>=2.0.0
sqlalchemy>=2.0.0
```

---

## 🎯 INTERVIEW TALKING POINTS

### Data Engineering Architecture
- "We implemented an ETL pipeline framework following best practices"
- "Data warehouse stores processed, queryable data"
- "Scheduled pipelines ensure data freshness"
- "Separation of concerns: extract, transform, load"

### Scalability
- "Pipeline-based architecture allows easy addition of new data sources"
- "Data warehouse enables fast analytical queries"
- "Can scale horizontally by adding more pipeline workers"

### Production Ready
- "Error handling and logging at each pipeline stage"
- "Data validation and quality checks"
- "Historical data storage for trend analysis"

---

## 📊 QUICK DEMO SCRIPT

1. **Show Pipeline**: "We have automated ETL pipelines that run every 5 minutes"
2. **Show Warehouse**: "All processed data is stored in our data warehouse"
3. **Show Historical**: "We can query historical data for analysis"
4. **Show Health**: "Pipeline monitoring ensures data quality"

---

## ✅ CHECKLIST

- [ ] Pipeline framework created
- [ ] Stock pipeline implemented
- [ ] Data warehouse tables created
- [ ] Scheduler running
- [ ] API endpoints working
- [ ] Historical data queryable
- [ ] Error handling in place
- [ ] Logging configured

---

## 🚀 NEXT STEPS

1. **Today**: Implement basic pipeline (2-3 hours)
2. **This Week**: Add social media pipeline
3. **Next Week**: Add monitoring and quality metrics
4. **Future**: Add Airflow, Kafka, advanced features

