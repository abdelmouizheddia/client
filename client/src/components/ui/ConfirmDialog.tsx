import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'تأكيد', danger = true, loading = false, onConfirm, onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={
      <>
        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button variant={danger ? 'danger' : 'secondary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>
    }>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${danger ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-gold-100 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300'}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-navy-600 dark:text-navy-100 leading-relaxed pt-1">{message}</p>
      </div>
    </Modal>
  );
}
