"""
Stream Processor (Phase 4)
--------------------------

This is a lightweight, in-memory implementation that mimics a Kafka-style
stream processor without requiring external infrastructure.

It is designed for demo/interview purposes:
  - Pipelines can publish "events" when they run
  - The backend exposes a simple API to read recent events
  - The frontend shows a faux "real-time" stream using polling
"""

from collections import deque
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any, Deque, Dict, List
import logging

logger = logging.getLogger(__name__)


@dataclass
class StreamEvent:
    """Represents a single event in the stream."""

    topic: str
    payload: Dict[str, Any]
    timestamp: str


class StreamProcessor:
    """
    Simple in-memory stream processor.

    Internally maintains a bounded deque per topic so we can:
      - append events when pipelines run
      - read back the most recent N events for the UI/API
    """

    def __init__(self, max_events_per_topic: int = 200):
        self.max_events_per_topic = max_events_per_topic
        self._topics: Dict[str, Deque[StreamEvent]] = {}
        logger.info("StreamProcessor initialized (in-memory, max=%d)", max_events_per_topic)

    def publish(self, topic: str, payload: Dict[str, Any]) -> None:
        """Publish an event to a topic."""
        if topic not in self._topics:
            self._topics[topic] = deque(maxlen=self.max_events_per_topic)

        event = StreamEvent(
            topic=topic,
            payload=payload,
            timestamp=datetime.now().isoformat(),
        )
        self._topics[topic].append(event)
        logger.debug("Stream event published: %s", event)

    def get_recent(self, topic: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent events for a topic (most recent first)."""
        if topic not in self._topics:
            return []

        events = list(self._topics[topic])[-limit:]
        # Most recent first for UI
        events.reverse()
        return [asdict(e) for e in events]

    def list_topics(self) -> List[str]:
        """List all topics with events."""
        return sorted(self._topics.keys())


