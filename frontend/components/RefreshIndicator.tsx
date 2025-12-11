'use client';

interface RefreshIndicatorProps {
  lastRefresh: Date;
  isRefreshing?: boolean;
}

export function RefreshIndicator({
  lastRefresh,
  isRefreshing = false,
}: RefreshIndicatorProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
      return `${seconds}s ago`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      {isRefreshing ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
          <span>Refreshing...</span>
        </>
      ) : (
        <>
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span>Last updated: {formatTime(lastRefresh)}</span>
        </>
      )}
    </div>
  );
}

