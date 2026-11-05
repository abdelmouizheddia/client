import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Pencil, Archive as ArchiveIcon, CreditCard, RefreshCw, Trophy,
  Wallet, CalendarCheck, FileText, User as UserIcon, Plus, Trash2, Phone, Mail, MapPin,
} from 'lucide-react';
import { membersApi, subscriptionsApi } from '../../api/resources';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import MemberFormModal from './MemberFormModal';
import RenewSubscriptionModal from '../../components/RenewSubscriptionModal';
import AchievementFormModal from '../../components/AchievementFormModal';
import {
  STATUS_LABELS, STATUS_COLORS, GENDER_LABELS, PLAN_LABELS, ACHIEVEMENT_TYPE_LABELS,
  formatDate, formatDateTime, formatCurrency,
} from '../../utils/format';
import type { Member } from '../../types';

type Tab = 'overview' | 'subscriptions' | 'attendance' | 'achievements' | 'documents';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'overview', label: 'نظرة عامة', icon: UserIcon },
  { key: 'subscriptions', label: 'الاشتراكات', icon: Wallet },
  { key: 'attendance', label: 'الحضور', icon: CalendarCheck },
  { key: 'achievements', label: 'الإنجازات', icon: Trophy },
  { key: 'documents', label: 'المستندات', icon: FileText },
];

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  const [editOpen, setEditOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [achievementOpen, setAchievementOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [subDeleteId, setSubDeleteId] = useState<number | null>(null);
  const [docDeleteId, setDocDeleteId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    membersApi.get(Number(id)).then(setMember).catch((err) => showToast(apiErrorMessage(err), 'error')).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleArchive() {
    if (!member) return;
    setArchiving(true);
    try {
      await membersApi.archive(member.id);
      showToast('تم نقل العضو إلى الأرشيف', 'success');
      navigate('/members');
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setArchiving(false);
    }
  }

  async function handleDeleteSubscription() {
    if (!subDeleteId) return;
    try {
      await subscriptionsApi.remove(subDeleteId);
      showToast('تم حذف الاشتراك', 'success');
      setSubDeleteId(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  async function handleDeleteDocument() {
    if (!docDeleteId) return;
    try {
      await membersApi.deleteDocument(docDeleteId);
      showToast('تم حذف المستند', 'success');
      setDocDeleteId(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  async function handleUploadDocuments(e: React.ChangeEvent<HTMLInputElement>) {
    if (!member || !e.target.files?.length) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(e.target.files).forEach((f) => fd.append('files', f));
    try {
      await membersApi.uploadDocuments(member.id, fd);
      showToast('تم رفع المستندات بنجاح', 'success');
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  if (loading) return <Spinner />;
  if (!member) return <EmptyState icon={<UserIcon className="h-7 w-7" />} title="العضو غير موجود" />;

  return (
    <div>
      <button onClick={() => navigate('/members')} className="flex items-center gap-1.5 text-sm text-navy-500 dark:text-navy-300 hover:text-navy-800 dark:hover:text-white mb-4">
        <ArrowRight className="h-4 w-4" /> رجوع إلى قائمة الأعضاء
      </button>

      <Card className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={member.photo} firstName={member.firstName} lastName={member.lastName} size="xl" />
            <div>
              <h1 className="font-display text-xl font-bold text-navy-900 dark:text-white">{member.firstName} {member.lastName}</h1>
              <p className="font-mono text-sm text-navy-400 dark:text-navy-300 mt-0.5">{member.memberCode}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={STATUS_COLORS[member.status]}>{STATUS_LABELS[member.status]}</Badge>
                {member.sport && <Badge className="bg-navy-100 text-navy-700 dark:bg-white/10 dark:text-gold-200">{member.sport.name}</Badge>}
                <Badge className="bg-navy-50 text-navy-500 dark:bg-white/5 dark:text-navy-200">{member.age} سنة &middot; {GENDER_LABELS[member.gender]}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" icon={<CreditCard className="h-4 w-4" />} onClick={() => navigate(`/cards?memberId=${member.id}`)}>البطاقة الرقمية</Button>
            <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => setRenewOpen(true)}>تجديد الاشتراك</Button>
            <Button variant="outline" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>تعديل</Button>
            <Button variant="danger" size="sm" icon={<ArchiveIcon className="h-4 w-4" />} onClick={() => setArchiveConfirm(true)}>أرشفة</Button>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-navy-800 text-gold-200 dark:bg-gold-500 dark:text-navy-900' : 'text-navy-500 hover:bg-navy-100/60 dark:text-navy-300 dark:hover:bg-white/5'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-display font-bold text-navy-900 dark:text-white mb-4">معلومات الاتصال</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-navy-600 dark:text-navy-200"><Phone className="h-4 w-4 text-navy-400" /> {member.phone || 'غير محدد'}</div>
              <div className="flex items-center gap-2 text-navy-600 dark:text-navy-200"><Mail className="h-4 w-4 text-navy-400" /> {member.email || 'غير محدد'}</div>
              <div className="flex items-center gap-2 text-navy-600 dark:text-navy-200"><MapPin className="h-4 w-4 text-navy-400" /> {member.address || 'غير محدد'}</div>
            </div>
          </Card>
          <Card>
            <h3 className="font-display font-bold text-navy-900 dark:text-white mb-4">معلومات العضوية</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-navy-400">تاريخ التسجيل</span><span className="text-navy-700 dark:text-navy-100">{formatDate(member.registrationDate)}</span></div>
              <div className="flex justify-between"><span className="text-navy-400">تاريخ الميلاد</span><span className="text-navy-700 dark:text-navy-100">{formatDate(member.birthDate)}</span></div>
              <div className="flex justify-between"><span className="text-navy-400">المدرب</span><span className="text-navy-700 dark:text-navy-100">{member.coach ? `${member.coach.firstName} ${member.coach.lastName}` : 'غير محدد'}</span></div>
              <div className="flex justify-between"><span className="text-navy-400">الباقة الحالية</span><span className="text-navy-700 dark:text-navy-100">{member.currentPlan ? PLAN_LABELS[member.currentPlan] : '-'}</span></div>
              <div className="flex justify-between"><span className="text-navy-400">تاريخ انتهاء الاشتراك</span><span className="text-navy-700 dark:text-navy-100">{formatDate(member.subscriptionEndDate)}</span></div>
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="font-display font-bold text-navy-900 dark:text-white mb-3">ملاحظات المدرب</h3>
            <p className="text-sm text-navy-600 dark:text-navy-200 leading-relaxed whitespace-pre-line">{member.coachNotes || 'لا توجد ملاحظات.'}</p>
          </Card>
        </div>
      )}

      {tab === 'subscriptions' && (
        <Card padded={false}>
          <div className="flex items-center justify-between p-5 pb-0">
            <h3 className="font-display font-bold text-navy-900 dark:text-white">سجل الاشتراكات</h3>
            <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setRenewOpen(true)}>تجديد</Button>
          </div>
          {!member.subscriptions?.length ? (
            <EmptyState icon={<Wallet className="h-7 w-7" />} title="لا يوجد اشتراكات مسجلة" />
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-navy-100 dark:border-white/10 text-navy-400 text-xs">
                  <th className="text-right font-medium px-5 py-3">الباقة</th>
                  <th className="text-right font-medium px-5 py-3">السعر</th>
                  <th className="text-right font-medium px-5 py-3">البداية</th>
                  <th className="text-right font-medium px-5 py-3">النهاية</th>
                  <th className="text-right font-medium px-5 py-3">الحالة</th>
                  <th className="text-left font-medium px-5 py-3"></th>
                </tr></thead>
                <tbody>
                  {member.subscriptions.map((s) => (
                    <tr key={s.id} className="border-b border-navy-50 dark:border-white/5">
                      <td className="px-5 py-3 text-navy-700 dark:text-navy-100">{PLAN_LABELS[s.planType]}</td>
                      <td className="px-5 py-3 font-mono text-navy-700 dark:text-navy-100">{formatCurrency(s.price)}</td>
                      <td className="px-5 py-3 text-navy-600 dark:text-navy-200">{formatDate(s.startDate)}</td>
                      <td className="px-5 py-3 text-navy-600 dark:text-navy-200">{formatDate(s.endDate)}</td>
                      <td className="px-5 py-3"><Badge className={s.status === 'active' ? STATUS_COLORS.active : STATUS_COLORS.expired}>{s.status === 'active' ? 'نشط' : 'منتهي'}</Badge></td>
                      <td className="px-5 py-3 text-left">
                        <button onClick={() => setSubDeleteId(s.id)} className="p-1.5 rounded-lg text-navy-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'attendance' && (
        <Card padded={false}>
          <div className="p-5 pb-0"><h3 className="font-display font-bold text-navy-900 dark:text-white">سجل الحضور (آخر 50 حضور)</h3></div>
          {!member.attendances?.length ? (
            <EmptyState icon={<CalendarCheck className="h-7 w-7" />} title="لا يوجد سجل حضور" />
          ) : (
            <div className="divide-y divide-navy-50 dark:divide-white/5 mt-2">
              {member.attendances.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-navy-700 dark:text-navy-100">{formatDateTime(a.date)}</span>
                  <Badge className="bg-navy-50 text-navy-500 dark:bg-white/5 dark:text-navy-200">{a.method === 'qr' ? 'مسح QR' : 'يدوي'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'achievements' && (
        <Card padded={false}>
          <div className="flex items-center justify-between p-5 pb-0">
            <h3 className="font-display font-bold text-navy-900 dark:text-white">الإنجازات والميداليات</h3>
            <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAchievementOpen(true)}>إضافة إنجاز</Button>
          </div>
          {!member.achievements?.length ? (
            <EmptyState icon={<Trophy className="h-7 w-7" />} title="لا يوجد إنجازات مسجلة" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5">
              {member.achievements.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-xl border border-navy-100 dark:border-white/10 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-300"><Trophy className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-800 dark:text-white">{a.title}</p>
                    <p className="text-xs text-navy-400 dark:text-navy-300/60 mt-0.5">{ACHIEVEMENT_TYPE_LABELS[a.type]} &middot; {formatDate(a.date)}</p>
                    {a.description && <p className="text-xs text-navy-500 dark:text-navy-300 mt-1">{a.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'documents' && (
        <Card padded={false}>
          <div className="flex items-center justify-between p-5 pb-0">
            <h3 className="font-display font-bold text-navy-900 dark:text-white">المستندات والصور</h3>
            <label className="inline-flex">
              <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} loading={uploading} type="button" onClick={(e) => { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLInputElement)?.click(); }}>رفع مستند</Button>
              <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={handleUploadDocuments} />
            </label>
          </div>
          {!member.documents?.length ? (
            <EmptyState icon={<FileText className="h-7 w-7" />} title="لا يوجد مستندات مرفوعة" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-5">
              {member.documents.map((d) => (
                <div key={d.id} className="relative group rounded-xl overflow-hidden border border-navy-100 dark:border-white/10 aspect-square bg-navy-50 dark:bg-white/5">
                  {d.fileType === 'image' ? (
                    <a href={d.fileUrl} target="_blank" rel="noreferrer"><img src={d.fileUrl} className="h-full w-full object-cover" /></a>
                  ) : (
                    <a href={d.fileUrl} target="_blank" rel="noreferrer" className="flex h-full w-full flex-col items-center justify-center gap-2 text-navy-400">
                      <FileText className="h-8 w-8" /><span className="text-xs">PDF</span>
                    </a>
                  )}
                  <button onClick={() => setDocDeleteId(d.id)} className="absolute top-1.5 left-1.5 rounded-full bg-rose-500/90 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <MemberFormModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} member={member} />
      <RenewSubscriptionModal open={renewOpen} onClose={() => setRenewOpen(false)} onSaved={load} memberId={member.id} memberName={`${member.firstName} ${member.lastName}`} />
      <AchievementFormModal open={achievementOpen} onClose={() => setAchievementOpen(false)} onSaved={load} memberId={member.id} memberName={`${member.firstName} ${member.lastName}`} />

      <ConfirmDialog open={archiveConfirm} title="أرشفة العضو" message="هل تريد نقل هذا العضو إلى الأرشيف؟" confirmLabel="نقل إلى الأرشيف" loading={archiving} onConfirm={handleArchive} onClose={() => setArchiveConfirm(false)} />
      <ConfirmDialog open={!!subDeleteId} title="حذف الاشتراك" message="هل تريد حذف هذا الاشتراك بشكل نهائي؟" confirmLabel="حذف" onConfirm={handleDeleteSubscription} onClose={() => setSubDeleteId(null)} />
      <ConfirmDialog open={!!docDeleteId} title="حذف المستند" message="هل تريد حذف هذا المستند بشكل نهائي؟" confirmLabel="حذف" onConfirm={handleDeleteDocument} onClose={() => setDocDeleteId(null)} />
    </div>
  );
}
