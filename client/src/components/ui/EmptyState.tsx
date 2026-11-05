import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-navy-50 text-navy-400 dark:bg-white/5 dark:text-gold-400/60">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-navy-800 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-navy-400 dark:text-navy-300/70 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
