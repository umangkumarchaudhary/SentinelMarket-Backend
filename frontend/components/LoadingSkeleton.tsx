'use client';

interface LoadingSkeletonProps {
  rows?: number;
  columns?: number;
}

export function LoadingSkeleton({ rows = 5, columns = 7 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-12 flex-1 animate-pulse rounded bg-gray-200"
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200"></div>
      <div className="h-64 w-full animate-pulse rounded bg-gray-200"></div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200"></div>
      <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
    </div>
  );
}

