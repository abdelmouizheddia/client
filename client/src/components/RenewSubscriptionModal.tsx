import { useState, FormEvent, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Select from './ui/Select';
import Input from './ui/Input';
import { subscriptionsApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';

interface RenewSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  memberId: number | null;
  memberName?: string;
}

const PLAN_PRICES: Record<string, number> = { month: 2000, '3months': 5800, '6months': 11500, year: 23000 };

export default function RenewSubscriptionModal({ open, onClose, onSaved, memberId, memberName }: RenewSubscriptionModalProps) {
  const { showToast } = useToast();
  const [planType, setPlanType] = useState('month');
  const [price, setPrice] = useState(String(PLAN_PRICES.month));
  const [startFromToday, setStartFromToday] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPlanType('month');
      setPrice(String(PLAN_PRICES.month));
      setStartFromToday(false);
      setError('');
    }
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    setSaving(true);
    setError('');
    try {
      await subscriptionsApi.renew(memberId, { planType, price: Number(price), startFromToday });
      showToast('تم تجديد الاشتراك بنجاح', 'success');
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'تعذر تجديد الاشتراك'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`تجديد اشتراك${memberName ? ' - ' + memberName : ''}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button variant="secondary" onClick={handleSubmit} loading={saving}>تجديد الاشتراك</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="باقة الاشتراك" value={planType} onChange={(e) => { setPlanType(e.target.value); setPrice(String(PLAN_PRICES[e.target.value])); }}>
          <option value="month">شهر</option>
          <option value="3months">3 أشهر</option>
          <option value="6months">6 أشهر</option>
          <option value="year">سنة</option>
        </Select>
        <Input type="number" label="السعر (دج)" value={price} onChange={(e) => setPrice(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-navy-600 dark:text-navy-200 cursor-pointer">
          <input type="checkbox" checked={startFromToday} onChange={(e) => setStartFromToday(e.target.checked)} className="rounded border-navy-300 text-gold-500 focus:ring-gold-400" />
          البدء من تاريخ اليوم (بدلاً من تاريخ انتهاء الاشتراك السابق)
        </label>
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </form>
    </Modal>
  );
}
