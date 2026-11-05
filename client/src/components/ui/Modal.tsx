import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm animate-fade-up" onClick={onClose} />
      <div
        className={`relative w-full ${sizeClasses[size]} glass-panel gold-edge rounded-xl2 shadow-glass dark:shadow-glass-dark animate-pop-in max-h-[88vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100 dark:border-white/10 shrink-0">
          <h3 className="font-display text-lg font-bold text-navy-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-700 dark:hover:bg-white/10 dark:hover:text-gold-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-navy-100 dark:border-white/10 flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
