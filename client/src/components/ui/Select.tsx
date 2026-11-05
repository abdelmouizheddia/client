import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, className = '', id, children, ...rest }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-navy-700 dark:text-navy-100">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`w-full h-10 rounded-xl border border-navy-200 dark:border-white/10 bg-white/70 dark:bg-navy-900/40 px-3 text-sm text-navy-900 dark:text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-500/20 outline-none transition-colors ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </div>
  );
});
Select.displayName = 'Select';
export default Select;
