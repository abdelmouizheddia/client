import { useState, useEffect, FormEvent } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import { achievementsApi, membersApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import type { Member } from '../types';

interface AchievementFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  memberId?: number | null;
  memberName?: string;
}

export default function AchievementFormModal({ open, onClose, onSaved, memberId, memberName }: AchievementFormModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('medal');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [memberSearch, setMemberSearch] = useState('');
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(memberId || null);
  const debouncedSearch = useDebounce(memberSearch, 350);

  useEffect(() => {
    if (open) {
      setTitle(''); setType('medal'); setDate(''); setDescription(''); setFile(null); setError('');
      setSelectedMemberId(memberId || null);
      setMemberSearch('');
    }
  }, [open, memberId]);

  useEffect(() => {
    if (memberId || !open || !debouncedSearch) { setMemberOptions([]); return; }
    membersApi.list({ search: debouncedSearch, limit: 6 }).then((r) => setMemberOptions(r.data)).catch(() => {});
  }, [debouncedSearch, memberId, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedMemberId) { setError('يرجى اختيار العضو'); return; }
    if (!title) { setError('يرجى إدخال عنوان الإنجاز'); return; }
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('memberId', String(selectedMemberId));
      fd.append('title', title);
      fd.append('type', type);
      if (date) fd.append('date', date);
      fd.append('description', description);
      if (file) fd.append('file', file);
      await achievementsApi.create(fd);
      showToast('تم إضافة الإنجاز بنجاح', 'success');
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'تعذر إضافة الإنجاز'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="إضافة إنجاز جديد" size="md" footer={
      <>
        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button variant="secondary" onClick={handleSubmit} loading={saving}>حفظ الإنجاز</Button>
      </>
    }>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!memberId && (
          <div className="relative">
            <Input label="العضو" placeholder="ابحث عن العضو بالاسم أو الرمز..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
            {memberOptions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-navy-100 dark:border-white/10 bg-white dark:bg-navy-900 shadow-card max-h-44 overflow-y-auto">
                {memberOptions.map((m) => (
                  <button key={m.id} type="button" onClick={() => { setSelectedMemberId(m.id); setMemberSearch(`${m.firstName} ${m.lastName}`); setMemberOptions([]); }}
                    className="w-full text-right px-3 py-2 text-sm hover:bg-navy-50 dark:hover:bg-white/5 text-navy-700 dark:text-navy-100">
                    {m.firstName} {m.lastName} <span className="font-mono text-xs text-navy-400">({m.memberCode})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {memberId && memberName && <p className="text-sm text-navy-500 dark:text-navy-300">العضو: <span className="font-medium text-navy-800 dark:text-white">{memberName}</span></p>}

        <Input label="عنوان الإنجاز *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: الميدالية الذهبية - بطولة السباحة" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="النوع" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="medal">ميدالية</option>
            <option value="tournament">بطولة</option>
            <option value="certificate">شهادة</option>
          </Select>
          <Input type="date" label="التاريخ" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Textarea label="وصف" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-navy-700 dark:text-navy-100 mb-1.5 block">ملف / صورة الإنجاز (اختياري)</label>
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-navy-600 dark:text-navy-200" />
        </div>
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </form>
    </Modal>
  );
}
