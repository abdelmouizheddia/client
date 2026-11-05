import { useEffect, useState, useCallback, FormEvent } from 'react';
import { Plus, Pencil, Trash2, UserCircle, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { coachAccountsApi, coachesApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';
import type { CoachAccount, Coach } from '../types';

export default function CoachAccounts() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<CoachAccount[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CoachAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CoachAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([coachAccountsApi.list(), coachesApi.list()])
      .then(([accs, chs]) => { setAccounts(accs); setCoaches(chs); })
      .catch((err) => showToast(apiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  async function handleToggleActive(acc: CoachAccount) {
    try {
      await coachAccountsApi.update(acc.id, { isActive: !acc.isActive });
      showToast(acc.isActive ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب', 'success');
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await coachAccountsApi.remove(deleteTarget.id);
      showToast('تم حذف الحساب بنجاح', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  // الكوتشات الذين ليس لديهم حساب بعد (للقائمة المنسدلة في نموذج الإنشاء)
  const coachesWithoutAccount = coaches.filter(
    (c) => !accounts.some((a) => a.coachId === c.id) || (editing && editing.coachId === c.id)
  );

  return (
    <div>
      <PageHeader
        title="حسابات المدربات"
        subtitle="إنشاء وإدارة حسابات تسجيل دخول المدربات مع تحديد عمولة كل واحدة"
        actions={
          <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            إنشاء حساب مدربة
          </Button>
        }
      />

      {loading ? <Spinner /> : !accounts.length ? (
        <EmptyState
          icon={<UserCircle className="h-7 w-7" />}
          title="لا يوجد حسابات مدربات بعد"
          description="أنشئ حسابات تسجيل دخول للمدربات لتمكينهن من متابعة العضوات الخاصات بهن"
          action={<Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>إنشاء حساب أول مدربة</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <Card key={acc.id} className="animate-fade-up">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar src={acc.coach?.photo} firstName={acc.coach?.firstName} lastName={acc.coach?.lastName} size="md" />
                  <div>
                    <p className="font-display font-bold text-navy-900 dark:text-white">
                      {acc.coach?.firstName} {acc.coach?.lastName}
                    </p>
                    <p className="text-xs text-navy-400 dark:text-navy-300/60 font-mono mt-0.5">@{acc.username}</p>
                  </div>
                </div>
                <Badge className={acc.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}>
                  {acc.isActive ? 'نشط' : 'موقوف'}
                </Badge>
              </div>

              {acc.coach?.specialty && (
                <p className="text-xs text-gold-600 dark:text-gold-300 mb-3">{acc.coach.specialty}</p>
              )}

              {/* إحصاءات العمولة */}
              <div className="rounded-xl bg-navy-50 dark:bg-white/5 p-3 mb-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-navy-400 dark:text-navy-300/60">العمولة لكل عضوة</span>
                  <span className="font-mono font-semibold text-navy-700 dark:text-navy-100">{acc.commissionRate} د.ج</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-400 dark:text-navy-300/60">العضوات النشطات</span>
                  <span className="font-mono font-semibold text-navy-700 dark:text-navy-100">{acc.activeFemaleMembersCount ?? '—'}</span>
                </div>
                <div className="flex justify-between border-t border-navy-200/50 dark:border-white/10 pt-1.5">
                  <span className="font-medium text-navy-700 dark:text-navy-100">الشهرية الحالية</span>
                  <span className="font-mono font-bold text-gold-600 dark:text-gold-300">
                    {acc.currentMonthSalary !== undefined ? formatCurrency(acc.currentMonthSalary) : '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-3 border-t border-navy-50 dark:border-white/10">
                <button
                  onClick={() => handleToggleActive(acc)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                    acc.isActive
                      ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                  }`}
                >
                  {acc.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  {acc.isActive ? 'إيقاف' : 'تفعيل'}
                </button>
                <button
                  onClick={() => { setEditing(acc); setFormOpen(true); }}
                  className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 dark:hover:bg-white/10"
                  title="تعديل"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(acc)}
                  className="p-1.5 rounded-lg text-navy-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CoachAccountFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        editing={editing}
        coachOptions={coachesWithoutAccount}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف حساب المدربة"
        message={`هل تريد حذف حساب "${deleteTarget?.username}"؟ لن تتمكن المدربة من تسجيل الدخول بعدها.`}
        confirmLabel="حذف الحساب"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── نموذج إنشاء / تعديل الحساب ─────────────────────────────────
function CoachAccountFormModal({
  open, onClose, onSaved, editing, coachOptions,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: CoachAccount | null;
  coachOptions: Coach[];
}) {
  const { showToast } = useToast();
  const isEdit = !!editing;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [coachId, setCoachId] = useState('');
  const [commissionRate, setCommissionRate] = useState('500');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setUsername(editing.username);
      setPassword('');
      setCoachId(String(editing.coachId));
      setCommissionRate(String(editing.commissionRate));
    } else {
      setUsername(''); setPassword(''); setCoachId(''); setCommissionRate('500');
    }
    setError('');
  }, [open, editing]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!isEdit && (!username || !password || !coachId)) {
      setError('يرجى تعبئة جميع الحقول الإجبارية');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && editing) {
        const data: any = { commissionRate: Number(commissionRate) };
        if (password) data.password = password;
        await coachAccountsApi.update(editing.id, data);
        showToast('تم تحديث الحساب بنجاح', 'success');
      } else {
        await coachAccountsApi.create({ username, password, coachId: Number(coachId), commissionRate: Number(commissionRate) });
        showToast('تم إنشاء الحساب بنجاح', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'تعذر حفظ الحساب'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `تعديل حساب @${editing?.username}` : 'إنشاء حساب مدربة جديد'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button variant="secondary" onClick={handleSubmit} loading={saving}>
            {isEdit ? 'حفظ التعديلات' : 'إنشاء الحساب'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <>
            <Select
              label="المدرب/ة *"
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
            >
              <option value="">اختر مدرب/ة من القائمة</option>
              {coachOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName} {c.specialty ? `(${c.specialty})` : ''}</option>
              ))}
            </Select>
            <Input
              label="اسم المستخدم *"
              placeholder="مثال: coach_fatima"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
            />
          </>
        )}

        <div className="relative">
          <Input
            type={showPwd ? 'text' : 'password'}
            label={isEdit ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور *'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute left-3 bottom-2.5 text-navy-400 hover:text-navy-700 dark:hover:text-gold-300"
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div>
          <Input
            type="number"
            label="العمولة لكل عضوة نشطة (دج/شهر)"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            min="0"
          />
          <p className="text-xs text-navy-400 dark:text-navy-300/60 mt-1">
            مثال: {commissionRate} دج × عدد العضوات النشطات = الشهرية
          </p>
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}
      </form>
    </Modal>
  );
}
