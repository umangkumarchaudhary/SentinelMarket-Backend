"""
Base ETL Pipeline Framework
Provides abstract base class for all data pipelines
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any
from datetime import datetime
import logging

class BasePipeline(ABC):
    """Base class for ETL pipelines following best practices"""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"pipeline.{name}")
        self.logger.setLevel(logging.INFO)
    
    @abstractmethod
    def extract(self) -> List[Dict[str, Any]]:
        """
        Extract data from source systems
        
        Returns:
            List of raw data records
        """
        pass
    
    @abstractmethod
    def transform(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Transform and clean raw data
        
        Args:
            data: Raw data from extract stage
            
        Returns:
            List of transformed data records
        """
        pass
    
    @abstractmethod
    def load(self, data: List[Dict[str, Any]]) -> bool:
        """
        Load transformed data to destination
        
        Args:
            data: Transformed data from transform stage
            
        Returns:
            True if load successful, False otherwise
        """
        pass
    
    def run(self) -> Dict[str, Any]:
        """
        Execute full ETL pipeline with error handling and metrics
        
        Returns:
            Dictionary with pipeline execution results
        """
        start_time = datetime.now()
        metrics = {
            "pipeline": self.name,
            "start_time": start_time.isoformat(),
            "success": False,
            "records_extracted": 0,
            "records_transformed": 0,
            "records_loaded": 0,
            "duration_seconds": 0,
            "errors": []
        }
        
        try:
            # Extract stage
            self.logger.info(f"[{self.name}] Starting extraction stage")
            raw_data = self.extract()
            metrics["records_extracted"] = len(raw_data)
            self.logger.info(f"[{self.name}] Extracted {len(raw_data)} records")
            
            if not raw_data:
                self.logger.warning(f"[{self.name}] No data extracted")
                metrics["errors"].append("No data extracted from source")
                return metrics
            
            # Transform stage
            self.logger.info(f"[{self.name}] Starting transformation stage")
            transformed_data = self.transform(raw_data)
            metrics["records_transformed"] = len(transformed_data)
            self.logger.info(f"[{self.name}] Transformed {len(transformed_data)} records")
            
            if not transformed_data:
                self.logger.warning(f"[{self.name}] No data after transformation")
                metrics["errors"].append("All records filtered out during transformation")
                return metrics
            
            # Load stage
            self.logger.info(f"[{self.name}] Starting load stage")
            success = self.load(transformed_data)
            metrics["records_loaded"] = len(transformed_data) if success else 0
            metrics["success"] = success
            
            if success:
                self.logger.info(f"[{self.name}] Successfully loaded {len(transformed_data)} records")
            else:
                self.logger.error(f"[{self.name}] Load stage failed")
                metrics["errors"].append("Load stage failed")
            
        except Exception as e:
            self.logger.error(f"[{self.name}] Pipeline failed with error: {e}", exc_info=True)
            metrics["errors"].append(str(e))
            metrics["success"] = False
        
        finally:
            # Calculate duration
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            metrics["duration_seconds"] = round(duration, 2)
            metrics["end_time"] = end_time.isoformat()
            metrics["timestamp"] = end_time.isoformat()
            
            self.logger.info(
                f"[{self.name}] Pipeline completed in {duration:.2f}s. "
                f"Success: {metrics['success']}, "
                f"Records: {metrics['records_loaded']}/{metrics['records_extracted']}"
            )
        
        return metrics



