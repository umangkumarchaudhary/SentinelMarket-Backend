"""
Pipeline Scheduler
Manages scheduled execution of ETL pipelines
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging
import sys
import os

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

# Import pipelines - handle import errors
PIPELINES_AVAILABLE = False
StockDataPipeline = None
SocialMediaPipeline = None

try:
    from src.data.pipeline.stock_pipeline import StockDataPipeline
    from src.data.pipeline.social_pipeline import SocialMediaPipeline
    PIPELINES_AVAILABLE = True
except ImportError as e:
    try:
        # Try alternative import path
        import sys
        import os
        parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)
        from src.data.pipeline.stock_pipeline import StockDataPipeline
        from src.data.pipeline.social_pipeline import SocialMediaPipeline
        PIPELINES_AVAILABLE = True
    except ImportError as import_err:
        PIPELINES_AVAILABLE = False
        logging.warning(f"Pipelines not available: {import_err}")

logger = logging.getLogger(__name__)

class PipelineScheduler:
    """Schedules and manages ETL pipeline execution"""
    
    def __init__(self):
        """Initialize scheduler"""
        self.scheduler = BackgroundScheduler()
        self.is_running = False
        self.pipeline_results = {}  # Store recent pipeline execution results
        
        if PIPELINES_AVAILABLE and StockDataPipeline:
            try:
                self.stock_pipeline = StockDataPipeline()
            except Exception as e:
                logging.error(f"Failed to initialize stock pipeline: {e}")
                self.stock_pipeline = None
        else:
            self.stock_pipeline = None
        
        # Social pipeline may not be available due to PyTorch issues
        if PIPELINES_AVAILABLE and SocialMediaPipeline:
            try:
                self.social_pipeline = SocialMediaPipeline()
            except Exception as e:
                logging.warning(f"Social pipeline not available: {e}")
                self.social_pipeline = None
        else:
            self.social_pipeline = None
    
    def start(self):
        """Start the scheduler and register pipeline jobs"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        if not PIPELINES_AVAILABLE:
            logger.warning("Pipelines not available - scheduler not started")
            return
        
        try:
            # Schedule stock data pipeline every 5 minutes
            self.scheduler.add_job(
                self._run_stock_pipeline,
                trigger=IntervalTrigger(minutes=5),
                id='stock_pipeline',
                name='Stock Data Pipeline',
                replace_existing=True,
                max_instances=1  # Prevent overlapping runs
            )
            
            # Schedule social media pipeline every 10 minutes
            self.scheduler.add_job(
                self._run_social_pipeline,
                trigger=IntervalTrigger(minutes=10),
                id='social_pipeline',
                name='Social Media Pipeline',
                replace_existing=True,
                max_instances=1
            )
            
            self.scheduler.start()
            self.is_running = True
            logger.info("Pipeline scheduler started successfully")
            logger.info("Stock pipeline scheduled: every 5 minutes")
            logger.info("Social pipeline scheduled: every 10 minutes")
            
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
            self.is_running = False
    
    def stop(self):
        """Stop the scheduler"""
        if not self.is_running:
            return
        
        try:
            self.scheduler.shutdown(wait=True)
            self.is_running = False
            logger.info("Pipeline scheduler stopped")
        except Exception as e:
            logger.error(f"Error stopping scheduler: {e}")
    
    def _run_stock_pipeline(self):
        """Execute stock data pipeline"""
        if not self.stock_pipeline:
            return
        
        try:
            logger.info("Executing stock data pipeline...")
            result = self.stock_pipeline.run()
            self.pipeline_results['stock_data'] = {
                **result,
                "last_run": datetime.now().isoformat()
            }
            logger.info(f"Stock pipeline completed: {result.get('success', False)}")
        except Exception as e:
            logger.error(f"Stock pipeline execution failed: {e}")
            self.pipeline_results['stock_data'] = {
                "success": False,
                "error": str(e),
                "last_run": datetime.now().isoformat()
            }
    
    def _run_social_pipeline(self):
        """Execute social media pipeline"""
        if not self.social_pipeline:
            return
        
        try:
            logger.info("Executing social media pipeline...")
            result = self.social_pipeline.run()
            self.pipeline_results['social_media'] = {
                **result,
                "last_run": datetime.now().isoformat()
            }
            logger.info(f"Social pipeline completed: {result.get('success', False)}")
        except Exception as e:
            logger.error(f"Social pipeline execution failed: {e}")
            self.pipeline_results['social_media'] = {
                "success": False,
                "error": str(e),
                "last_run": datetime.now().isoformat()
            }
    
    def run_pipeline_now(self, pipeline_name: str) -> dict:
        """Manually trigger a pipeline"""
        if pipeline_name == "stock_data" and self.stock_pipeline:
            self._run_stock_pipeline()
            return self.pipeline_results.get('stock_data', {})
        elif pipeline_name == "social_media" and self.social_pipeline:
            self._run_social_pipeline()
            return self.pipeline_results.get('social_media', {})
        else:
            return {"error": f"Unknown pipeline: {pipeline_name}"}
    
    def get_status(self) -> dict:
        """Get scheduler status"""
        jobs = []
        if self.scheduler.running:
            for job in self.scheduler.get_jobs():
                jobs.append({
                    "id": job.id,
                    "name": job.name,
                    "next_run": job.next_run_time.isoformat() if job.next_run_time else None
                })
        
        return {
            "is_running": self.is_running,
            "jobs": jobs,
            "pipeline_results": self.pipeline_results,
            "timestamp": datetime.now().isoformat()
        }

