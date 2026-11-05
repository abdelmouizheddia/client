export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <div className="h-8 w-8 rounded-full border-2 border-gold-200 border-t-gold-500 animate-spin" />
    </div>
  );
}

export function SkeletonRow() {
  return <div className="h-12 w-full rounded-lg bg-navy-100/60 dark:bg-white/5 animate-pulse" />;
}

export function SkeletonCard() {
  return <div className="h-28 w-full rounded-xl2 bg-navy-100/60 dark:bg-white/5 animate-pulse" />;
}
