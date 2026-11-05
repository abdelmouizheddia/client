import { ChevronRight, ChevronLeft } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="h-8 w-8 flex items-center justify-center rounded-lg border border-navy-200 dark:border-white/10 text-navy-600 dark:text-navy-200 disabled:opacity-40 hover:bg-navy-50 dark:hover:bg-white/5"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
            p === page
              ? 'bg-navy-800 text-gold-200 dark:bg-gold-500 dark:text-navy-900'
              : 'text-navy-600 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-white/5'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="h-8 w-8 flex items-center justify-center rounded-lg border border-navy-200 dark:border-white/10 text-navy-600 dark:text-navy-200 disabled:opacity-40 hover:bg-navy-50 dark:hover:bg-white/5"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}
