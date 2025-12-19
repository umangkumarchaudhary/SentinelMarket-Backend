"""
Data Quality Metrics
Simple metrics for completeness and validity ratios.
"""

from typing import Dict, List, Any, Callable
from datetime import datetime


class DataQualityMetrics:
    """Calculate simple data quality metrics."""

    def calculate_completeness(
        self, data: List[Dict[str, Any]], required_fields: List[str]
    ) -> float:
        """Calculate percentage of non-null required fields."""
        if not data or not required_fields:
            return 0.0

        total_fields = len(data) * len(required_fields)
        filled_fields = sum(
            sum(
                1
                for field in required_fields
                if record.get(field) not in (None, "")
            )
            for record in data
        )
        return (filled_fields / total_fields) * 100 if total_fields > 0 else 0.0

    def calculate_valid_ratio(
        self, data: List[Dict[str, Any]], validator: Callable[[Dict[str, Any]], bool]
    ) -> float:
        """Percentage of records passing a validator function."""
        if not data:
            return 0.0

        valid_count = sum(1 for record in data if validator(record))
        return (valid_count / len(data)) * 100

    def generate_stock_quality_report(
        self, data: List[Dict[str, Any]], validator: Callable[[Dict[str, Any]], bool]
    ) -> Dict[str, Any]:
        """Generate quality report for stock data."""
        required_fields = ["ticker", "price", "volume", "timestamp"]
        completeness = self.calculate_completeness(data, required_fields)
        valid_ratio = self.calculate_valid_ratio(data, validator)

        return {
            "type": "stock",
            "completeness": round(completeness, 2),
            "valid_ratio": round(valid_ratio, 2),
            "total_records": len(data),
            "timestamp": datetime.now().isoformat(),
        }

    def generate_social_quality_report(
        self, data: List[Dict[str, Any]], validator: Callable[[Dict[str, Any]], bool]
    ) -> Dict[str, Any]:
        """Generate quality report for social media data."""
        required_fields = ["ticker", "platform", "text", "timestamp"]
        completeness = self.calculate_completeness(data, required_fields)
        valid_ratio = self.calculate_valid_ratio(data, validator)

        return {
            "type": "social",
            "completeness": round(completeness, 2),
            "valid_ratio": round(valid_ratio, 2),
            "total_records": len(data),
            "timestamp": datetime.now().isoformat(),
        }
