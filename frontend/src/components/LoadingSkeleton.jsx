/**
 * Skeleton loading placeholders for cards and content.
 */
export function SkeletonCard() {
  return (
    <div className="card p-6 space-y-4 animate-pulse">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-20 w-full rounded-lg" />
      <div className="flex gap-2">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="skeleton h-10 w-full rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-6 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}
