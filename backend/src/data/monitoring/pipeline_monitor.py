"""
Pipeline Monitoring
Tracks pipeline execution metrics and health
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class PipelineMonitor:
    """Monitor pipeline health and execution metrics"""
    
    def __init__(self):
        """Initialize monitor"""
        self.metrics = {}  # Store metrics for each pipeline
        self.max_history = 100  # Keep last 100 runs
    
    def record_pipeline_run(self, pipeline_name: str, result: Dict[str, Any]):
        """
        Record pipeline execution result
        
        Args:
            pipeline_name: Name of the pipeline
            result: Pipeline execution result dictionary
        """
        if pipeline_name not in self.metrics:
            self.metrics[pipeline_name] = {
                "runs": [],
                "success_count": 0,
                "failure_count": 0,
                "total_records_processed": 0,
                "total_duration": 0.0
            }
        
        metrics = self.metrics[pipeline_name]
        
        # Add run to history
        run_record = {
            "timestamp": result.get("timestamp", datetime.now().isoformat()),
            "success": result.get("success", False),
            "records_processed": result.get("records_loaded", 0),
            "duration_seconds": result.get("duration_seconds", 0),
            "errors": result.get("errors", [])
        }
        
        metrics["runs"].append(run_record)
        
        # Keep only recent history
        if len(metrics["runs"]) > self.max_history:
            metrics["runs"] = metrics["runs"][-self.max_history:]
        
        # Update counters
        if result.get("success", False):
            metrics["success_count"] += 1
        else:
            metrics["failure_count"] += 1
        
        metrics["total_records_processed"] += result.get("records_loaded", 0)
        metrics["total_duration"] += result.get("duration_seconds", 0)
    
    def get_pipeline_health(self, pipeline_name: str) -> Dict[str, Any]:
        """
        Get health metrics for a pipeline
        
        Args:
            pipeline_name: Name of the pipeline
            
        Returns:
            Health metrics dictionary
        """
        if pipeline_name not in self.metrics:
            return {
                "pipeline": pipeline_name,
                "status": "unknown",
                "message": "No execution history"
            }
        
        metrics = self.metrics[pipeline_name]
        total_runs = metrics["success_count"] + metrics["failure_count"]
        
        if total_runs == 0:
            return {
                "pipeline": pipeline_name,
                "status": "unknown",
                "message": "No runs recorded"
            }
        
        # Calculate success rate
        success_rate = (metrics["success_count"] / total_runs * 100) if total_runs > 0 else 0
        
        # Get recent runs (last 24 hours)
        cutoff = datetime.now() - timedelta(hours=24)
        recent_runs = [
            r for r in metrics["runs"]
            if datetime.fromisoformat(r["timestamp"]) >= cutoff
        ]
        
        # Calculate average duration
        avg_duration = (
            metrics["total_duration"] / total_runs
            if total_runs > 0 else 0
        )
        
        # Determine status
        if success_rate >= 95:
            status = "healthy"
        elif success_rate >= 80:
            status = "degraded"
        else:
            status = "unhealthy"
        
        # Check for recent failures
        recent_failures = [r for r in recent_runs if not r["success"]]
        if recent_failures:
            last_failure = recent_failures[-1]
            last_error = last_failure.get("errors", [])
        else:
            last_error = []
        
        return {
            "pipeline": pipeline_name,
            "status": status,
            "success_rate": round(success_rate, 2),
            "total_runs": total_runs,
            "success_count": metrics["success_count"],
            "failure_count": metrics["failure_count"],
            "total_records_processed": metrics["total_records_processed"],
            "average_duration_seconds": round(avg_duration, 2),
            "runs_last_24h": len(recent_runs),
            "failures_last_24h": len(recent_failures),
            "last_error": last_error[-1] if last_error else None,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_all_health(self) -> Dict[str, Any]:
        """Get health metrics for all pipelines"""
        health = {}
        for pipeline_name in self.metrics.keys():
            health[pipeline_name] = self.get_pipeline_health(pipeline_name)
        
        return {
            "pipelines": health,
            "total_pipelines": len(health),
            "timestamp": datetime.now().isoformat()
        }
    
    def get_recent_runs(self, pipeline_name: str, limit: int = 10) -> List[Dict]:
        """Get recent pipeline runs"""
        if pipeline_name not in self.metrics:
            return []
        
        runs = self.metrics[pipeline_name]["runs"]
        return runs[-limit:] if len(runs) > limit else runs



