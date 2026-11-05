import { useEffect, useState, FormEvent, useCallback } from 'react';
import { Plus, Pencil, Trash2, Phone, Users, UserCog, Camera, Wallet } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { coachesApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';
import type { Coach } from '../types';

type CoachWithSalaryType = Coach & { salaryType?: 'FIXED' | 'PERCENTAGE' };

export default function Coaches() {
  const { showToast } = useToast();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coach | null>(null);
  const [viewing, setViewing] = useState<Coach | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coach | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    coachesApi.list().then(setCoaches).catch((err) => showToast(apiErrorMessage(err), 'error')).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await coachesApi.remove(deleteTarget.id);
      showToast('تم حذف المدرب بنجاح', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  return (
    <div>
      <PageHeader title="المدربون" subtitle="إدارة فريق المدربين في النادي" actions={
        <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>إضافة مدرب</Button>
      } />

      {loading ? <Spinner /> : !coaches.length ? (
        <EmptyState icon={<UserCog className="h-7 w-7" />} title="لا يوجد مدربون مسجلون" action={<Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>إضافة مدرب</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((c) => (
            <Card key={c.id} className="animate-fade-up">
              <div className="flex items-start gap-3">
                <Avatar src={c.photo} firstName={c.firstName} lastName={c.lastName} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-navy-900 dark:text-white truncate">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-gold-600 dark:text-gold-300 mt-0.5">{c.specialty || 'غير محدد'}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-navy-500 dark:text-navy-300">
                    <Phone className="h-3.5 w-3.5" /> {c.phone || 'غير محدد'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-navy-500 dark:text-navy-300">
                    <Wallet className="h-3.5 w-3.5" /> 
                    {/* تحديث العرض حسب نوع الراتب */}
                    {(c as CoachWithSalaryType).salaryType === 'PERCENTAGE' 
                      ? `${c.salary}% / نسبة من الاشتراكات`
                      : `${formatCurrency(c.salary || 0)} / شهرياً`}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-navy-50 dark:border-white/10">
                <button onClick={() => setViewing(c)} className="flex items-center gap-1.5 text-xs font-medium text-navy-500 hover:text-navy-800 dark:text-navy-300 dark:hover:text-white">
                  <Users className="h-3.5 w-3.5" /> {c._count?.members ?? 0} عضو مسجل
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditing(c); setFormOpen(true); }} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-navy-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CoachFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} coach={editing} />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`أعضاء المدرب: ${viewing?.firstName || ''} ${viewing?.lastName || ''}`} size="sm">
        {!viewing?.members?.length ? (
          <EmptyState icon={<Users className="h-7 w-7" />} title="لا يوجد أعضاء مسجلون لدى هذا المدرب" />
        ) : (
          <div className="space-y-2">
            {viewing.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5 px-1 py-1.5">
                <Avatar src={m.photo} firstName={m.firstName} lastName={m.lastName} size="sm" />
                <span className="text-sm text-navy-700 dark:text-navy-100">{m.firstName} {m.lastName}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="حذف المدرب" message={`هل تريد حذف المدرب "${deleteTarget?.firstName} ${deleteTarget?.lastName}"؟`} confirmLabel="حذف" onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}

function CoachFormModal({ open, onClose, onSaved, coach }: { open: boolean; onClose: () => void; onSaved: () => void; coach: Coach | null }) {
  const { showToast } = useToast();
  const isEdit = !!coach;
  
  // تم تصحيح state ليشمل salaryType
  const [form, setForm] = useState({ 
    firstName: '', 
    lastName: '', 
    specialty: '', 
    phone: '', 
    salaryType: 'FIXED', // افتراضي
    salary: '', 
    schedule: '' 
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (coach) {
      // جلب بيانات المدرب وإضافتها لـ form
      setForm({ 
        firstName: coach.firstName, 
        lastName: coach.lastName, 
        specialty: coach.specialty || '', 
        phone: coach.phone || '', 
        salaryType: (coach as CoachWithSalaryType).salaryType || 'FIXED', // جلب النوع
        salary: String(coach.salary || ''), 
        schedule: coach.schedule || '' 
      });
      setPhotoPreview(coach.photo || null);
    } else {
      setForm({ firstName: '', lastName: '', specialty: '', phone: '', salaryType: 'FIXED', salary: '', schedule: '' });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setError('');
  }, [open, coach]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { setError('يرجى إدخال الاسم واللقب'); return; }
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append('photo', photoFile);
      if (isEdit && coach) await coachesApi.update(coach.id, fd);
      else await coachesApi.create(fd);
      showToast('تم حفظ بيانات المدرب بنجاح', 'success');
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'تعذر حفظ بيانات المدرب'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'تعديل بيانات المدرب' : 'إضافة مدرب جديد'} size="md" footer={
      <>
        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button variant="secondary" onClick={handleSubmit} loading={saving}>حفظ</Button>
      </>
    }>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden bg-navy-100 dark:bg-white/10 flex items-center justify-center">
            {photoPreview ? <img src={photoPreview} className="h-full w-full object-cover" /> : <Camera className="h-5 w-5 text-navy-400" />}
            <label className="absolute inset-0 flex items-center justify-center bg-navy-900/0 hover:bg-navy-900/40 text-transparent hover:text-white text-[10px] cursor-pointer transition-colors">
              تغيير
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); } }} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="الاسم *" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
          <Input label="اللقب *" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
          <Input label="التخصص" value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} placeholder="مثال: سباحة" />
          <Input label="الهاتف" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>

        {/* ─── نظام الدفع والراتب/النسبة ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-navy-50 dark:border-white/10 pt-4 mt-2">
          {/* اختيار نوع الراتب */}
          <div>
            <label className="block text-sm font-medium text-navy-800 dark:text-white/80 mb-1.5">
              نظام الدفع
            </label>
            <select
              value={form.salaryType}
              onChange={(e) => setForm((f) => ({ ...f, salaryType: e.target.value }))}
              className="w-full h-11 px-3 border border-navy-200 dark:border-white/10 rounded-xl bg-white dark:bg-navy-900 text-navy-900 dark:text-white outline-none focus:ring-2 focus:ring-gold-500 transition-shadow"
            >
              <option value="FIXED">راتب شهري ثابت</option>
              <option value="PERCENTAGE">نسبة من الاشتراكات (%)</option>
            </select>
          </div>

          {/* حقل القيمة (يتغير حسب الاختيار) */}
          <div>
            <label className="block text-sm font-medium text-navy-800 dark:text-white/80 mb-1.5">
              {form.salaryType === 'PERCENTAGE' ? 'نسبة المدربة (%)' : 'الراتب الشهري (دج)'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.salary}
                onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                placeholder={form.salaryType === 'PERCENTAGE' ? 'مثال: 35' : 'مثال: 40000'}
                className="w-full h-11 px-4 border border-navy-200 dark:border-white/10 rounded-xl bg-white dark:bg-navy-900 text-navy-900 dark:text-white outline-none focus:ring-2 focus:ring-gold-500 transition-shadow"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 font-bold text-sm">
                {form.salaryType === 'PERCENTAGE' ? '%' : 'دج'}
              </div>
            </div>
          </div>
        </div>

        <Textarea label="جدول الحصص" rows={2} value={form.schedule} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))} placeholder="مثال: السبت والثلاثاء 17:00 - 19:00" />
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </form>
    </Modal>
  );
}