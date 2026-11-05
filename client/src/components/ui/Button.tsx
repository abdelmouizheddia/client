import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-navy-800 text-gold-200 hover:bg-navy-700 shadow-card border border-gold-500/30 hover:border-gold-400/60',
  secondary:
    'bg-gold-500 text-navy-900 hover:bg-gold-400 shadow-gold font-semibold',
  outline:
    'bg-transparent border border-navy-300 text-navy-700 hover:bg-navy-50 dark:border-gold-500/30 dark:text-gold-200 dark:hover:bg-white/5',
  ghost:
    'bg-transparent text-navy-600 hover:bg-navy-100/70 dark:text-gold-200 dark:hover:bg-white/5',
  danger:
    'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
