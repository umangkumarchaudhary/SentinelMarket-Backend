# Data Engineering Architecture & Implementation Plan

## 🎯 Overview
Transform SentinelMarket into a production-grade data platform with robust data engineering practices.

---

## 📊 DATA ENGINEERING ARCHITECTURE

### Current State
- Direct API calls to data sources
- In-memory processing
- No historical data storage
- No data quality checks
- No pipeline monitoring

### Target State
- **Data Pipeline**: Automated ETL/ELT processes
- **Data Warehouse**: Historical data storage
- **Stream Processing**: Real-time data ingestion
- **Data Quality**: Validation and cleaning
- **Data Lake**: Raw data storage
- **Monitoring**: Pipeline health and data quality metrics

---

## 🏗️ ARCHITECTURE COMPONENTS

### 1. Data Sources Layer
```
┌─────────────────────────────────────────┐
│         DATA SOURCES                    │
├─────────────────────────────────────────┤
│ • Stock Price APIs (NSE/BSE)           │
│ • Twitter API                           │
│ • Telegram API                          │
│ • News APIs                             │
│ • Company Filings                       │
│ • Reddit API                            │
│ • YouTube Comments                      │
└─────────────────────────────────────────┘
```

### 2. Ingestion Layer
```
┌─────────────────────────────────────────┐
│      DATA INGESTION                     │
├─────────────────────────────────────────┤
│ • Real-time Stream (Kafka/RabbitMQ)     │
│ • Batch Jobs (Scheduled)                │
│ • API Polling                           │
│ • Webhook Receivers                     │
└─────────────────────────────────────────┘
```

### 3. Processing Layer
```
┌─────────────────────────────────────────┐
│      DATA PROCESSING                    │
├─────────────────────────────────────────┤
│ • Data Validation                       │
│ • Data Cleaning                         │
│ • Data Transformation                   │
│ • Feature Engineering                   │
│ • Aggregation                           │
└─────────────────────────────────────────┘
```

### 4. Storage Layer
```
┌─────────────────────────────────────────┐
│      DATA STORAGE                       │
├─────────────────────────────────────────┤
│ • Data Lake (Raw Data)                  │
│ • Data Warehouse (Processed)            │
│ • Cache Layer (Redis)                   │
│ • Time-Series DB (InfluxDB/TimescaleDB) │
└─────────────────────────────────────────┘
```

### 5. Serving Layer
```
┌─────────────────────────────────────────┐
│      DATA SERVING                       │
├─────────────────────────────────────────┤
│ • API Endpoints                         │
│ • Real-time Dashboards                  │
│ • ML Model Features                     │
│ • Analytics Queries                     │
└─────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION PHASES

### PHASE 1: Data Pipeline Foundation (Week 1-2)

#### 1.1 ETL Pipeline Framework
**File**: `backend/src/data/pipeline/etl_pipeline.py`

```python
from abc import ABC, abstractmethod
from typing import Dict, List, Any
from datetime import datetime
import logging

class ETLPipeline(ABC):
    """Base class for ETL pipelines"""
    
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
        """Execute full ETL pipeline"""
        start_time = datetime.now()
        
        try:
            # Extract
            self.logger.info(f"Starting extraction for {self.name}")
            raw_data = self.extract()
            self.logger.info(f"Extracted {len(raw_data)} records")
            
            # Transform
            self.logger.info(f"Starting transformation for {self.name}")
            transformed_data = self.transform(raw_data)
            self.logger.info(f"Transformed {len(transformed_data)} records")
            
            # Load
            self.logger.info(f"Starting load for {self.name}")
            success = self.load(transformed_data)
            
            duration = (datetime.now() - start_time).total_seconds()
            
            return {
                "success": success,
                "records_processed": len(transformed_data),
                "duration_seconds": duration,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Pipeline {self.name} failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
```

#### 1.2 Stock Data Pipeline
**File**: `backend/src/data/pipeline/stock_pipeline.py`

```python
from .etl_pipeline import ETLPipeline
from src.data.sources.stock_api import StockAPIClient
from src.data.storage.data_warehouse import DataWarehouse
from src.data.validation.data_validator import DataValidator

class StockDataPipeline(ETLPipeline):
    """ETL pipeline for stock price data"""
    
    def __init__(self):
        super().__init__("stock_data")
        self.api_client = StockAPIClient()
        self.warehouse = DataWarehouse()
        self.validator = DataValidator()
    
    def extract(self) -> List[Dict]:
        """Fetch stock data from API"""
        stocks = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK"]
        data = []
        
        for ticker in stocks:
            try:
                stock_data = self.api_client.get_stock_data(ticker)
                data.append(stock_data)
            except Exception as e:
                self.logger.error(f"Failed to fetch {ticker}: {e}")
        
        return data
    
    def transform(self, data: List[Dict]) -> List[Dict]:
        """Clean and transform stock data"""
        transformed = []
        
        for record in data:
            # Validate
            if not self.validator.validate_stock_data(record):
                self.logger.warning(f"Invalid data for {record.get('ticker')}")
                continue
            
            # Transform
            transformed_record = {
                "ticker": record["ticker"],
                "price": float(record["price"]),
                "volume": int(record["volume"]),
                "change_percent": float(record.get("change_percent", 0)),
                "timestamp": record["timestamp"],
                "exchange": record.get("exchange", "NSE"),
                "processed_at": datetime.now().isoformat()
            }
            transformed.append(transformed_record)
        
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

#### 1.3 Social Media Pipeline
**File**: `backend/src/data/pipeline/social_pipeline.py`

```python
class SocialMediaPipeline(ETLPipeline):
    """ETL pipeline for social media data"""
    
    def extract(self) -> List[Dict]:
        """Fetch from Twitter and Telegram"""
        # Implementation
        pass
    
    def transform(self, data: List[Dict]) -> List[Dict]:
        """Clean, deduplicate, extract features"""
        # Implementation
        pass
    
    def load(self, data: List[Dict]) -> bool:
        """Load to data warehouse"""
        # Implementation
        pass
```

---

### PHASE 2: Data Storage (Week 2-3)

#### 2.1 Data Warehouse
**File**: `backend/src/data/storage/data_warehouse.py`

```python
from sqlalchemy import create_engine, Table, Column, String, Float, Integer, DateTime, MetaData
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import pandas as pd

class DataWarehouse:
    """Data warehouse for processed data"""
    
    def __init__(self):
        self.engine = create_engine(DATABASE_URL)
        self.metadata = MetaData()
        self._create_tables()
    
    def _create_tables(self):
        """Create data warehouse tables"""
        # Stock data table
        self.stock_data = Table(
            'stock_data_warehouse',
            self.metadata,
            Column('id', Integer, primary_key=True),
            Column('ticker', String, index=True),
            Column('price', Float),
            Column('volume', Integer),
            Column('change_percent', Float),
            Column('timestamp', DateTime, index=True),
            Column('exchange', String),
            Column('processed_at', DateTime),
            Column('raw_data', JSONB)  # Store raw data for audit
        )
        
        # Social mentions table
        self.social_mentions = Table(
            'social_mentions_warehouse',
            self.metadata,
            Column('id', Integer, primary_key=True),
            Column('ticker', String, index=True),
            Column('platform', String),
            Column('text', String),
            Column('sentiment', String),
            Column('is_pump_signal', Boolean),
            Column('timestamp', DateTime, index=True),
            Column('metadata', JSONB)
        )
        
        self.metadata.create_all(self.engine)
    
    def insert_stock_data(self, data: List[Dict]):
        """Insert stock data"""
        df = pd.DataFrame(data)
        df.to_sql('stock_data_warehouse', self.engine, if_exists='append', index=False)
    
    def get_historical_data(self, ticker: str, days: int = 30):
        """Query historical data"""
        query = f"""
        SELECT * FROM stock_data_warehouse
        WHERE ticker = '{ticker}'
        AND timestamp >= NOW() - INTERVAL '{days} days'
        ORDER BY timestamp DESC
        """
        return pd.read_sql(query, self.engine)
```

#### 2.2 Data Lake (Raw Data Storage)
**File**: `backend/src/data/storage/data_lake.py`

```python
import json
from datetime import datetime
from pathlib import Path
import gzip

class DataLake:
    """Data lake for raw, unprocessed data"""
    
    def __init__(self, base_path: str = "data_lake"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)
    
    def store_raw_data(self, source: str, data: Dict, timestamp: datetime = None):
        """Store raw data in data lake"""
        if timestamp is None:
            timestamp = datetime.now()
        
        # Organize by date and source
        date_str = timestamp.strftime("%Y/%m/%d")
        file_path = self.base_path / source / date_str / f"{timestamp.isoformat()}.json.gz"
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Compress and store
        with gzip.open(file_path, 'wt') as f:
            json.dump(data, f)
        
        return str(file_path)
    
    def retrieve_raw_data(self, source: str, date: str):
        """Retrieve raw data from data lake"""
        file_path = self.base_path / source / date
        data = []
        
        for file in file_path.glob("*.json.gz"):
            with gzip.open(file, 'rt') as f:
                data.append(json.load(f))
        
        return data
```

---

### PHASE 3: Data Quality & Validation (Week 3-4)

#### 3.1 Data Validator
**File**: `backend/src/data/validation/data_validator.py`

```python
from typing import Dict, List, Optional
import re

class DataValidator:
    """Validate data quality"""
    
    def validate_stock_data(self, data: Dict) -> bool:
        """Validate stock data"""
        required_fields = ['ticker', 'price', 'volume', 'timestamp']
        
        # Check required fields
        if not all(field in data for field in required_fields):
            return False
        
        # Validate types
        try:
            float(data['price'])
            int(data['volume'])
        except (ValueError, TypeError):
            return False
        
        # Validate ranges
        if float(data['price']) <= 0:
            return False
        
        if int(data['volume']) < 0:
            return False
        
        return True
    
    def validate_social_mention(self, data: Dict) -> bool:
        """Validate social media mention"""
        required_fields = ['text', 'platform', 'timestamp']
        
        if not all(field in data for field in required_fields):
            return False
        
        # Validate text length
        if len(data['text']) > 10000:  # Too long
            return False
        
        if len(data['text']) < 5:  # Too short
            return False
        
        return True
    
    def detect_duplicates(self, data: List[Dict], key_fields: List[str]) -> List[Dict]:
        """Detect duplicate records"""
        seen = set()
        duplicates = []
        
        for record in data:
            key = tuple(record.get(field) for field in key_fields)
            if key in seen:
                duplicates.append(record)
            else:
                seen.add(key)
        
        return duplicates
```

#### 3.2 Data Quality Metrics
**File**: `backend/src/data/validation/quality_metrics.py`

```python
class DataQualityMetrics:
    """Calculate data quality metrics"""
    
    def calculate_completeness(self, data: List[Dict], required_fields: List[str]) -> float:
        """Calculate data completeness percentage"""
        total_fields = len(data) * len(required_fields)
        filled_fields = sum(
            sum(1 for field in required_fields if field in record and record[field] is not None)
            for record in data
        )
        return (filled_fields / total_fields) * 100 if total_fields > 0 else 0
    
    def calculate_accuracy(self, data: List[Dict], validation_rules: Dict) -> float:
        """Calculate data accuracy percentage"""
        # Implementation
        pass
    
    def calculate_consistency(self, data: List[Dict]) -> float:
        """Calculate data consistency"""
        # Implementation
        pass
    
    def generate_quality_report(self, data: List[Dict]) -> Dict:
        """Generate comprehensive quality report"""
        return {
            "completeness": self.calculate_completeness(data, ['ticker', 'price']),
            "accuracy": self.calculate_accuracy(data, {}),
            "consistency": self.calculate_consistency(data),
            "total_records": len(data),
            "timestamp": datetime.now().isoformat()
        }
```

---

### PHASE 4: Stream Processing (Week 4-5)

#### 4.1 Real-time Stream Processor
**File**: `backend/src/data/streaming/stream_processor.py`

```python
from kafka import KafkaConsumer, KafkaProducer
import json
from typing import Callable

class StreamProcessor:
    """Process real-time data streams"""
    
    def __init__(self, bootstrap_servers: List[str]):
        self.consumer = KafkaConsumer(
            'stock_data',
            'social_mentions',
            bootstrap_servers=bootstrap_servers,
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
    
    def process_stream(self, topic: str, processor: Callable):
        """Process messages from a topic"""
        for message in self.consumer:
            if message.topic == topic:
                try:
                    result = processor(message.value)
                    # Send to output topic
                    self.producer.send(f"{topic}_processed", result)
                except Exception as e:
                    self.logger.error(f"Processing error: {e}")
    
    def start(self):
        """Start stream processing"""
        # Start processing threads
        pass
```

---

### PHASE 5: Data Monitoring & Observability (Week 5-6)

#### 5.1 Pipeline Monitoring
**File**: `backend/src/data/monitoring/pipeline_monitor.py`

```python
from datetime import datetime, timedelta
from typing import Dict, List

class PipelineMonitor:
    """Monitor data pipeline health"""
    
    def __init__(self):
        self.metrics = {}
    
    def record_pipeline_run(self, pipeline_name: str, success: bool, duration: float, records: int):
        """Record pipeline execution"""
        if pipeline_name not in self.metrics:
            self.metrics[pipeline_name] = {
                "runs": [],
                "success_count": 0,
                "failure_count": 0,
                "total_records": 0
            }
        
        self.metrics[pipeline_name]["runs"].append({
            "timestamp": datetime.now().isoformat(),
            "success": success,
            "duration": duration,
            "records": records
        })
        
        if success:
            self.metrics[pipeline_name]["success_count"] += 1
            self.metrics[pipeline_name]["total_records"] += records
        else:
            self.metrics[pipeline_name]["failure_count"] += 1
    
    def get_pipeline_health(self, pipeline_name: str) -> Dict:
        """Get pipeline health metrics"""
        if pipeline_name not in self.metrics:
            return {"status": "unknown"}
        
        metrics = self.metrics[pipeline_name]
        total_runs = metrics["success_count"] + metrics["failure_count"]
        success_rate = (metrics["success_count"] / total_runs * 100) if total_runs > 0 else 0
        
        # Check last 24 hours
        recent_runs = [
            r for r in metrics["runs"]
            if datetime.fromisoformat(r["timestamp"]) > datetime.now() - timedelta(hours=24)
        ]
        
        return {
            "pipeline": pipeline_name,
            "success_rate": success_rate,
            "total_runs": total_runs,
            "total_records": metrics["total_records"],
            "runs_last_24h": len(recent_runs),
            "status": "healthy" if success_rate > 95 else "degraded" if success_rate > 80 else "unhealthy"
        }
    
    def get_all_health(self) -> Dict:
        """Get health for all pipelines"""
        return {
            pipeline: self.get_pipeline_health(pipeline)
            for pipeline in self.metrics.keys()
        }
```

#### 5.2 Data Quality Dashboard
**File**: `backend/src/data/monitoring/quality_dashboard.py`

```python
@app.get("/api/data/quality")
async def get_data_quality():
    """Get data quality metrics"""
    validator = DataValidator()
    quality_metrics = DataQualityMetrics()
    
    # Get recent data
    recent_data = warehouse.get_recent_data(hours=24)
    
    return {
        "completeness": quality_metrics.calculate_completeness(recent_data, ['ticker', 'price']),
        "accuracy": quality_metrics.calculate_accuracy(recent_data, {}),
        "duplicates": len(validator.detect_duplicates(recent_data, ['ticker', 'timestamp'])),
        "total_records": len(recent_data),
        "timestamp": datetime.now().isoformat()
    }
```

---

## 🛠️ TOOLS & TECHNOLOGIES

### Data Pipeline
- **Apache Airflow**: Workflow orchestration
- **Prefect**: Modern workflow engine
- **Luigi**: Pipeline framework

### Stream Processing
- **Apache Kafka**: Message queue
- **RabbitMQ**: Alternative message broker
- **Apache Flink**: Stream processing

### Data Storage
- **PostgreSQL**: Data warehouse
- **TimescaleDB**: Time-series data
- **Redis**: Caching
- **S3/MinIO**: Data lake

### Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **ELK Stack**: Logging

---

## 📊 INTERVIEW TALKING POINTS

### Data Engineering Architecture
- "We built a robust ETL pipeline framework for ingesting data from multiple sources"
- "Implemented data lake architecture for raw data storage and data warehouse for processed data"
- "Real-time stream processing for live social media monitoring"
- "Comprehensive data quality validation and monitoring"

### Scalability
- "Pipeline-based architecture allows horizontal scaling"
- "Data lake stores raw data for reprocessing and audit trails"
- "Caching layer reduces database load"

### Data Quality
- "Automated data validation at ingestion"
- "Data quality metrics and monitoring"
- "Duplicate detection and data cleaning"

### Production Ready
- "Pipeline monitoring and alerting"
- "Error handling and retry logic"
- "Data lineage tracking"

---

## 🚀 QUICK START IMPLEMENTATION

### Step 1: Create Pipeline Framework (2 hours)
- Create base ETLPipeline class
- Implement StockDataPipeline
- Add basic error handling

### Step 2: Data Warehouse Setup (3 hours)
- Create warehouse tables
- Implement insert/query methods
- Add indexes

### Step 3: Data Validation (2 hours)
- Create DataValidator
- Add validation rules
- Implement quality metrics

### Step 4: Monitoring (2 hours)
- Add pipeline monitoring
- Create quality dashboard endpoint
- Add logging

**Total**: ~9 hours for basic data engineering infrastructure

---

## 📈 FUTURE ENHANCEMENTS

1. **Airflow Integration**: Full workflow orchestration
2. **Kafka Streams**: Real-time processing
3. **Data Versioning**: Track data changes
4. **Feature Store**: ML feature management
5. **Data Catalog**: Metadata management
6. **Automated Testing**: Data pipeline tests

