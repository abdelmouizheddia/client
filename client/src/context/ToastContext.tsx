import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }
interface ToastState { showToast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastState | null>(null);

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons: Record<ToastType, JSX.Element> = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-rose-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-gold-500 shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[min(92vw,380px)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="glass-panel animate-pop-in flex items-start gap-2.5 rounded-xl2 px-4 py-3 shadow-card text-sm text-navy-800 dark:text-navy-50"
          >
            {icons[t.type]}
            <p className="flex-1 leading-relaxed">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-navy-400 hover:text-navy-700 dark:hover:text-gold-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
