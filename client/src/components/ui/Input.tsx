import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, icon, className = '', id, ...rest }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-navy-700 dark:text-navy-100">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">{icon}</span>}
        <input
          ref={ref}
          id={id}
          className={`w-full h-10 rounded-xl border border-navy-200 dark:border-white/10 bg-white/70 dark:bg-navy-900/40 px-3 ${
            icon ? 'pr-9' : ''
          } text-sm text-navy-900 dark:text-white placeholder:text-navy-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-500/20 outline-none transition-colors ${className}`}
          {...rest}
        />
      </div>
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';
export default Input;
