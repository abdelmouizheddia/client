import { useEffect, useRef, useState, FormEvent } from 'react';
import { Camera, Nfc, ScanLine } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { membersApi, sportsApi, coachesApi } from '../../api/resources';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import type { Member, Sport, Coach } from '../../types';

interface MemberFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  member?: Member | null;
}

const PLAN_PRICES: Record<string, number> = { month: 2000, '3months': 5800, '6months': 11500, year: 23000 };

export default function MemberFormModal({ open, onClose, onSaved, member }: MemberFormModalProps) {
  const { showToast } = useToast();
  const isEdit = !!member;

  const [sports, setSports] = useState<Sport[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  // حقول النموذج
  const [form, setForm] = useState({
    firstName: '', lastName: '', birthDate: '', gender: 'male',
    phone: '', email: '', address: '',
    sportId: '', coachId: '', registrationDate: '', coachNotes: '',
    planType: '', price: '',
    rfidTag: '',             // رمز بطاقة RFID
    notificationsOptIn: false, // موافقة على إشعارات واتساب
  });

  // مسح RFID عبر الكيبورد
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const [scanningRfid, setScanningRfid] = useState(false);
  const rfidBufferRef = useRef('');
  const rfidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) { setScanningRfid(false); return; }
    sportsApi.list().then(setSports).catch(() => {});
    coachesApi.list().then(setCoaches).catch(() => {});

    if (member) {
      setForm({
        firstName: member.firstName,
        lastName: member.lastName,
        birthDate: member.birthDate?.slice(0, 10) || '',
        gender: member.gender,
        phone: member.phone || '',
        email: member.email || '',
        address: member.address || '',
        sportId: member.sportId ? String(member.sportId) : '',
        coachId: member.coachId ? String(member.coachId) : '',
        registrationDate: member.registrationDate?.slice(0, 10) || '',
        coachNotes: member.coachNotes || '',
        planType: '', price: '',
        rfidTag: member.rfidTag || '',
        notificationsOptIn: member.notificationsOptIn ?? false,
      });
      setPhotoPreview(member.photo || null);
    } else {
      setForm({
        firstName: '', lastName: '', birthDate: '', gender: 'male',
        phone: '', email: '', address: '',
        sportId: '', coachId: '',
        registrationDate: new Date().toISOString().slice(0, 10),
        coachNotes: '', planType: '', price: '',
        rfidTag: '', notificationsOptIn: false,
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setError('');
  }, [open, member]);

  // مستمع لوحة المفاتيح في وضع مسح RFID
  useEffect(() => {
    if (!scanningRfid || !open) return;
    rfidInputRef.current?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === '\n') {
        const tag = rfidBufferRef.current.trim();
        rfidBufferRef.current = '';
        if (rfidTimerRef.current) clearTimeout(rfidTimerRef.current);
        if (tag.length >= 4) {
          setForm((f) => ({ ...f, rfidTag: tag }));
          setScanningRfid(false);
          showToast(`تم قراءة رمز البطاقة: ${tag}`, 'success');
        }
        return;
      }
      if (e.key.length === 1) {
        rfidBufferRef.current += e.key;
        if (rfidTimerRef.current) clearTimeout(rfidTimerRef.current);
        rfidTimerRef.current = setTimeout(() => {
          const tag = rfidBufferRef.current.trim();
          rfidBufferRef.current = '';
          if (tag.length >= 4) {
            setForm((f) => ({ ...f, rfidTag: tag }));
            setScanningRfid(false);
            showToast(`تم قراءة رمز البطاقة: ${tag}`, 'success');
          }
        }, 300);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (rfidTimerRef.current) clearTimeout(rfidTimerRef.current);
      rfidBufferRef.current = '';
    };
  }, [scanningRfid, open, showToast]);

  function handlePlanChange(planType: string) {
    setForm((f) => ({ ...f, planType, price: planType ? String(PLAN_PRICES[planType] || '') : '' }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName || !form.birthDate) {
      setError('يرجى تعبئة الاسم واللقب وتاريخ الميلاد');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('firstName', form.firstName);
      fd.append('lastName', form.lastName);
      fd.append('birthDate', form.birthDate);
      fd.append('gender', form.gender);
      fd.append('phone', form.phone);
      fd.append('email', form.email);
      fd.append('address', form.address);
      if (form.sportId) fd.append('sportId', form.sportId);
      if (form.coachId) fd.append('coachId', form.coachId);
      fd.append('coachNotes', form.coachNotes);
      fd.append('rfidTag', form.rfidTag);
      fd.append('notificationsOptIn', String(form.notificationsOptIn));
      if (photoFile) fd.append('photo', photoFile);

      if (isEdit && member) {
        await membersApi.update(member.id, fd);
        showToast('تم تحديث بيانات العضو بنجاح', 'success');
      } else {
        fd.append('registrationDate', form.registrationDate);
        if (form.planType && form.price) {
          fd.append('planType', form.planType);
          fd.append('price', form.price);
        }
        await membersApi.create(fd);
        showToast('تم إضافة العضو بنجاح', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'تعذر حفظ بيانات العضو'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button variant="secondary" onClick={handleSubmit} loading={saving}>
            {isEdit ? 'حفظ التغييرات' : 'إضافة العضو'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* صورة شخصية */}
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden bg-navy-100 dark:bg-white/10 flex items-center justify-center">
            {photoPreview
              ? <img src={photoPreview} className="h-full w-full object-cover" alt="" />
              : <Camera className="h-6 w-6 text-navy-400" />}
            <label className="absolute inset-0 flex items-center justify-center bg-navy-900/0 hover:bg-navy-900/40 text-transparent hover:text-white text-xs cursor-pointer transition-colors">
              تغيير
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
              }} />
            </label>
          </div>
          <p className="text-xs text-navy-400 dark:text-navy-300/60">صورة شخصية للعضو (اختياري)</p>
        </div>

        {/* الحقول الأساسية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="الاسم *" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
          <Input label="اللقب *" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
          <Input type="date" label="تاريخ الميلاد *" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} />
          <Select label="الجنس" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </Select>
          <Input label="الهاتف" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input type="email" label="البريد الإلكتروني" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Select label="الرياضة" value={form.sportId} onChange={(e) => setForm((f) => ({ ...f, sportId: e.target.value }))}>
            <option value="">بدون تحديد</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select label="المدرب" value={form.coachId} onChange={(e) => setForm((f) => ({ ...f, coachId: e.target.value }))}>
            <option value="">بدون تحديد</option>
            {coaches.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </Select>
          {!isEdit && (
            <Input type="date" label="تاريخ التسجيل" value={form.registrationDate}
              onChange={(e) => setForm((f) => ({ ...f, registrationDate: e.target.value }))} />
          )}
          <Input label="العنوان" value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="sm:col-span-2" />
        </div>

        {/* ─── حقل RFID ─── */}
        <div className="rounded-xl border border-navy-100 dark:border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-navy-700 dark:text-navy-100">
              <Nfc className="h-4 w-4 text-gold-500" />
              بطاقة RFID (للدخول التلقائي)
            </div>
            <button
              type="button"
              onClick={() => setScanningRfid((s) => !s)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                scanningRfid
                  ? 'bg-gold-500 text-navy-900'
                  : 'bg-navy-100 dark:bg-white/10 text-navy-600 dark:text-navy-200'
              }`}
            >
              <ScanLine className="h-3.5 w-3.5" />
              {scanningRfid ? 'في انتظار المسح...' : 'مسح بطاقة RFID'}
            </button>
          </div>
          {scanningRfid && (
            <div className="text-xs text-gold-600 dark:text-gold-300 bg-gold-50 dark:bg-gold-500/10 rounded-lg px-3 py-2">
              مرّر بطاقة RFID على القارئ الآن — سيُقرأ الرمز تلقائياً.
            </div>
          )}
          <Input
            ref={rfidInputRef}
            placeholder="الرمز سيُملأ تلقائياً عند المسح، أو أدخله يدوياً"
            value={form.rfidTag}
            onChange={(e) => setForm((f) => ({ ...f, rfidTag: e.target.value }))}
          />
        </div>

        {/* ─── الاشتراك الأول (للتسجيل الجديد فقط) ─── */}
        {!isEdit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-gold-50/60 dark:bg-gold-500/5 border border-gold-200/50 dark:border-gold-500/15">
            <Select label="باقة الاشتراك الأولى (اختياري)" value={form.planType} onChange={(e) => handlePlanChange(e.target.value)}>
              <option value="">بدون اشتراك الآن</option>
              <option value="month">شهر</option>
              <option value="3months">3 أشهر</option>
              <option value="6months">6 أشهر</option>
              <option value="year">سنة</option>
            </Select>
            <Input type="number" label="السعر (دج)" value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              disabled={!form.planType} />
          </div>
        )}

        {/* ─── إشعارات واتساب ─── */}
        <div className="rounded-xl border border-navy-100 dark:border-white/10 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.notificationsOptIn}
              onChange={(e) => setForm((f) => ({ ...f, notificationsOptIn: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-navy-300 text-gold-500 focus:ring-gold-400"
            />
            <div>
              <p className="text-sm font-medium text-navy-700 dark:text-navy-100">
                تفعيل إشعارات واتساب للعضو
              </p>
              <p className="text-xs text-navy-400 dark:text-navy-300/60 mt-0.5">
                عند التفعيل: يتلقى العضو تذكيراً يوم قبل انتهاء اشتراكه، وبرنامجاً غذائياً صحياً
                عند التسجيل. يشترط وجود رقم هاتف مسجَّل وربط حساب واتساب من صفحة الإعدادات.
              </p>
            </div>
          </label>
        </div>

        <Textarea label="ملاحظات المدرب" rows={3} value={form.coachNotes}
          onChange={(e) => setForm((f) => ({ ...f, coachNotes: e.target.value }))} />

        {error && <p className="text-sm text-rose-500">{error}</p>}
      </form>
    </Modal>
  );
}
