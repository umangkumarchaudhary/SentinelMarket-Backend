"""
Data Validator
Simple data quality validator for stock and social data.
"""

from typing import Dict, List, Any


class DataValidator:
    """Validate stock and social media records."""

    def validate_stock_record(self, record: Dict[str, Any]) -> bool:
        """Basic validation for a single stock record."""
        required_fields = ["ticker", "price", "volume", "timestamp"]

        # Check required fields
        if not all(field in record for field in required_fields):
            return False

        # Validate types and ranges
        try:
            price = float(record.get("price", 0))
            volume = int(record.get("volume", 0))
        except (ValueError, TypeError):
            return False

        if price <= 0 or volume < 0:
            return False

        return True

    def validate_social_record(self, record: Dict[str, Any]) -> bool:
        """Basic validation for a single social media record."""
        required_fields = ["text", "platform", "timestamp"]

        if not all(field in record for field in required_fields):
            return False

        text = record.get("text") or ""
        if len(text) < 5 or len(text) > 10000:
            return False

        return True

    def detect_duplicates(
        self, data: List[Dict[str, Any]], key_fields: List[str]
    ) -> List[Dict[str, Any]]:
        """Detect duplicate records based on key fields."""
        seen = set()
        duplicates: List[Dict[str, Any]] = []

        for record in data:
            key = tuple(record.get(field) for field in key_fields)
            if key in seen:
                duplicates.append(record)
            else:
                seen.add(key)

        return duplicates
