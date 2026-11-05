import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className = '', id, ...rest }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-navy-700 dark:text-navy-100">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={`w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white/70 dark:bg-navy-900/40 px-3 py-2 text-sm text-navy-900 dark:text-white placeholder:text-navy-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-500/20 outline-none transition-colors resize-none ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </div>
  );
});
Textarea.displayName = 'Textarea';
export default Textarea;
