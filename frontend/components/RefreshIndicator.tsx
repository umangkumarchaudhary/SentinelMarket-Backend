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
    <div
      className="flex items-center gap-2 text-sm"
      style={{ color: 'var(--foreground-muted)' }}
    >
      {isRefreshing ? (
        <>
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
          />
          <span>Refreshing...</span>
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden sm:inline">Updated: {formatTime(lastRefresh)}</span>
          <span className="sm:hidden">{formatTime(lastRefresh)}</span>
        </>
      )}
    </div>
  );
}

