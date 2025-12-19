"""
Data Lake
Stores raw, unprocessed data for audit and reprocessing
"""

import json
import gzip
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import logging
import os

logger = logging.getLogger(__name__)

class DataLake:
    """Data lake for raw, unprocessed data storage"""
    
    def __init__(self, base_path: str = "data_lake"):
        """
        Initialize data lake
        
        Args:
            base_path: Base directory for data lake storage
        """
        # Use absolute path relative to backend directory
        if not os.path.isabs(base_path):
            backend_dir = Path(__file__).parent.parent.parent.parent
            self.base_path = backend_dir / base_path
        else:
            self.base_path = Path(base_path)
        
        self.base_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Data lake initialized at: {self.base_path}")
    
    def store_raw_data(self, source: str, data: Dict[str, Any], timestamp: Optional[datetime] = None) -> str:
        """
        Store raw data in data lake
        
        Args:
            source: Data source identifier (e.g., 'nse_api', 'telegram', 'twitter')
            data: Raw data dictionary to store
            timestamp: Timestamp for the data (defaults to now)
            
        Returns:
            Path to stored file
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        # Organize by date and source: data_lake/source/YYYY/MM/DD/timestamp.json.gz
        date_str = timestamp.strftime("%Y/%m/%d")
        file_path = self.base_path / source / date_str / f"{timestamp.isoformat().replace(':', '-')}.json.gz"
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Compress and store
        try:
            with gzip.open(file_path, 'wt', encoding='utf-8') as f:
                json.dump({
                    "source": source,
                    "timestamp": timestamp.isoformat(),
                    "data": data
                }, f, indent=2, ensure_ascii=False)
            
            logger.debug(f"Stored raw data: {file_path}")
            return str(file_path)
        except Exception as e:
            logger.error(f"Error storing raw data: {e}")
            raise
    
    def retrieve_raw_data(self, source: str, date: str) -> List[Dict[str, Any]]:
        """
        Retrieve raw data from data lake for a specific date
        
        Args:
            source: Data source identifier
            date: Date string in format 'YYYY/MM/DD' or 'YYYY-MM-DD'
            
        Returns:
            List of raw data records
        """
        # Normalize date format
        if '-' in date:
            date = date.replace('-', '/')
        
        file_path = self.base_path / source / date
        data = []
        
        if not file_path.exists():
            logger.warning(f"Data lake path does not exist: {file_path}")
            return data
        
        try:
            for file in file_path.glob("*.json.gz"):
                try:
                    with gzip.open(file, 'rt', encoding='utf-8') as f:
                        data.append(json.load(f))
                except Exception as e:
                    logger.warning(f"Error reading {file}: {e}")
                    continue
            
            logger.info(f"Retrieved {len(data)} records from {file_path}")
            return data
        except Exception as e:
            logger.error(f"Error retrieving raw data: {e}")
            return []
    
    def list_sources(self) -> List[str]:
        """List all data sources in the data lake"""
        sources = []
        if self.base_path.exists():
            for item in self.base_path.iterdir():
                if item.is_dir():
                    sources.append(item.name)
        return sorted(sources)
    
    def list_dates(self, source: str) -> List[str]:
        """
        List all dates available for a source
        
        Args:
            source: Data source identifier
            
        Returns:
            List of date strings in format 'YYYY/MM/DD'
        """
        source_path = self.base_path / source
        dates = []
        
        if source_path.exists():
            # Walk through year/month/day structure
            for year_dir in source_path.iterdir():
                if year_dir.is_dir():
                    for month_dir in year_dir.iterdir():
                        if month_dir.is_dir():
                            for day_dir in month_dir.iterdir():
                                if day_dir.is_dir():
                                    dates.append(f"{year_dir.name}/{month_dir.name}/{day_dir.name}")
        
        return sorted(dates)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get data lake statistics"""
        stats = {
            "base_path": str(self.base_path),
            "sources": [],
            "total_files": 0,
            "total_size_bytes": 0
        }
        
        if not self.base_path.exists():
            return stats
        
        sources = self.list_sources()
        stats["sources"] = sources
        
        for source in sources:
            source_path = self.base_path / source
            for file_path in source_path.rglob("*.json.gz"):
                stats["total_files"] += 1
                try:
                    stats["total_size_bytes"] += file_path.stat().st_size
                except Exception:
                    pass
        
        # Convert to human-readable sizes
        size_mb = stats["total_size_bytes"] / (1024 * 1024)
        stats["total_size_mb"] = round(size_mb, 2)
        
        return stats
    
    def cleanup_old_data(self, days: int = 90) -> int:
        """
        Clean up data older than specified days
        
        Args:
            days: Number of days to keep (default 90)
            
        Returns:
            Number of files deleted
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        deleted_count = 0
        
        if not self.base_path.exists():
            return 0
        
        try:
            for file_path in self.base_path.rglob("*.json.gz"):
                try:
                    # Extract timestamp from filename
                    filename = file_path.stem.replace('.json', '')
                    file_timestamp = datetime.fromisoformat(filename.replace('-', ':'))
                    
                    if file_timestamp < cutoff_date:
                        file_path.unlink()
                        deleted_count += 1
                except Exception as e:
                    logger.warning(f"Error processing {file_path}: {e}")
                    continue
            
            logger.info(f"Cleaned up {deleted_count} old data files")
            return deleted_count
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            return deleted_count

