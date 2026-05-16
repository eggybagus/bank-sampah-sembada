/**
 * Reusable skeleton components for loading states.
 * Use these to match the shape of actual content while data loads.
 */

export function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div className={`h-12 bg-slate-100 rounded-xl animate-pulse ${className}`} />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-slate-100 rounded-2xl animate-pulse ${className}`} />
  );
}

export function SkeletonText({ className = "" }: { className?: string }) {
  return (
    <div className={`h-4 bg-slate-100 rounded-lg animate-pulse ${className}`} />
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="h-28" />
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonRow key={i} className="h-16" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <SkeletonText className="h-10 w-64" />
      <StatsSkeleton count={4} />
      <div className="space-y-2">
        <SkeletonText className="h-6 w-32" />
        <TableSkeleton rows={5} />
      </div>
    </div>
  );
}
