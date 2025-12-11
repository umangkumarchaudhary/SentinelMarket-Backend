import { useEffect, useRef, useState } from 'react';

interface UseAutoRefreshOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
  onRefresh: () => void | Promise<void>;
}

export function useAutoRefresh({
  interval = 30000, // 30 seconds default
  enabled = true,
  onRefresh,
}: UseAutoRefreshOptions) {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Auto-refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      refresh();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval]);

  return {
    lastRefresh,
    isRefreshing,
    refresh,
  };
}

