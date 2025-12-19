"""
ETL Pipeline Framework
"""

from .base_pipeline import BasePipeline
from .stock_pipeline import StockDataPipeline

# Don't import SocialMediaPipeline at module level - it causes PyTorch DLL errors
# Import it lazily when needed
try:
    from .social_pipeline import SocialMediaPipeline
except (ImportError, OSError):
    # If import fails (e.g., PyTorch DLL error), create a placeholder
    SocialMediaPipeline = None

__all__ = [
    'BasePipeline',
    'StockDataPipeline',
    'SocialMediaPipeline',
]

