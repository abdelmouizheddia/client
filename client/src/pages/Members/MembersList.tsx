import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Download, Upload, Pencil, Trash2, Eye, Ticket } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import MemberFormModal from './MemberFormModal';
import { membersApi, sportsApi, excelApi } from '../../api/resources';
import client, { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { STATUS_LABELS, STATUS_COLORS, GENDER_LABELS, formatDate } from '../../utils/format';
import type { Member, Sport } from '../../types';


export default function MembersList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportId, setSportId] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Member | null>(null);
  const [archiving, setArchiving] = useState(false);

  // متغيرات نافذة تسجيل حصة زائر (Drop-in)
  const [showDropInModal, setShowDropInModal] = useState(false);
  const [dropInAmount, setDropInAmount] = useState('');
  const [dropInLoading, setDropInLoading] = useState(false);

  const loadMembers = useCallback(() => {
    setLoading(true);
    membersApi
      .list({ search: debouncedSearch || undefined, sportId: sportId ? Number(sportId) : undefined, gender: gender || undefined, status: status || undefined, page, limit: 15 })
      .then((res) => {
        setMembers(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch((err) => showToast(apiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, sportId, gender, status, page, showToast]);

  useEffect(() => { loadMembers(); }, [loadMembers]);
  useEffect(() => { sportsApi.list().then(setSports).catch(() => {}); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, sportId, gender, status]);

  // دالة إرسال مبلغ حصة الزائر إلى المالية
  // ─── دالة إرسال مبلغ حصة الزائر إلى المالية (عبر Axios Client المعتمد) ───
  const handleDropInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropInAmount || isNaN(Number(dropInAmount))) return;
    
    setDropInLoading(true);
    try {
      // الـ client سيقوم تلقائياً بإرفاق التوكن الصحيح والتعامل مع الرابط
      await client.post('/finance/drop-in', { 
        amount: Number(dropInAmount) 
      });

      showToast('تم إضافة مبلغ الحصة إلى المالية بنجاح!', 'success');
      setShowDropInModal(false);
      setDropInAmount('');
    } catch (error: any) {
      console.error('Frontend Axios Error:', error);
      showToast(apiErrorMessage(error, 'حدث خطأ أثناء تسجيل الحصة في المالية'), 'error');
    } finally {
      setDropInLoading(false);
    }
  };

  async function handleArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await membersApi.archive(archiveTarget.id);
      showToast('تم نقل العضو إلى الأرشيف', 'success');
      setArchiveTarget(null);
      loadMembers();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setArchiving(false);
    }
  }

  async function handleExport() {
    try {
      const blob = await excelApi.exportMembers();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'members-export.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(apiErrorMessage(err, 'تعذر تصدير الملف'), 'error');
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await excelApi.importMembers(fd);
      showToast(res.message || 'تم الاستيراد بنجاح', 'success');
      loadMembers();
    } catch (err) {
      showToast(apiErrorMessage(err, 'تعذر استيراد الملف'), 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div>
      <PageHeader
        title="الأعضاء"
        subtitle={`${total} عضو مسجل`}
        actions={
          <>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            <Button variant="outline" size="md" icon={<Upload className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()}>استيراد Excel</Button>
            <Button variant="outline" size="md" icon={<Download className="h-4 w-4" />} onClick={handleExport}>تصدير Excel</Button>
            
            <button
              onClick={() => setShowDropInModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0A0F1C] text-navy-900 dark:text-[#D4AF37] border-2 border-[#D4AF37] font-bold rounded-lg hover:bg-[#D4AF37]/10 transition-colors shadow-sm text-sm h-10"
            >
              <Ticket className="h-4 w-4" />
              حصة زائر
            </button>

            <Button variant="secondary" size="md" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditingMember(null); setFormOpen(true); }}>إضافة عضو</Button>
          </>
        }
      />

      <Card className="mb-4" padded>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input icon={<Search className="h-4 w-4" />} placeholder="بحث بالاسم، اللقب، أو الرمز..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={sportId} onChange={(e) => setSportId(e.target.value)}>
            <option value="">كل الرياضات</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">الجنس (الكل)</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">الحالة (الكل)</option>
            <option value="active">نشط</option>
            <option value="expired">منتهي</option>
            <option value="suspended">موقوف</option>
          </Select>
        </div>
      </Card>

      <Card padded={false}>
        {loading ? (
          <Spinner />
        ) : members.length === 0 ? (
          <EmptyState icon={<Users className="h-7 w-7" />} title="لا يوجد أعضاء مطابقون" description="حاول تعديل عوامل التصفية أو إضافة عضو جديد" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 dark:border-white/10 text-navy-400 dark:text-navy-300/60 text-xs">
                  <th className="text-right font-medium px-4 py-3">العضو</th>
                  <th className="text-right font-medium px-4 py-3">الرمز</th>
                  <th className="text-right font-medium px-4 py-3">العمر / الجنس</th>
                  <th className="text-right font-medium px-4 py-3">الرياضة</th>
                  <th className="text-right font-medium px-4 py-3">تاريخ الانتهاء</th>
                  <th className="text-right font-medium px-4 py-3">الحالة</th>
                  <th className="text-left font-medium px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-navy-50 dark:border-white/5 hover:bg-navy-50/40 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/members/${m.id}`)} className="flex items-center gap-2.5 text-right">
                        <Avatar src={m.photo} firstName={m.firstName} lastName={m.lastName} size="sm" />
                        <span className="font-medium text-navy-800 dark:text-white">{m.firstName} {m.lastName}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-navy-500 dark:text-navy-300">{m.memberCode}</td>
                    <td className="px-4 py-3 text-navy-600 dark:text-navy-200">{m.age} سنة &middot; {GENDER_LABELS[m.gender]}</td>
                    <td className="px-4 py-3 text-navy-600 dark:text-navy-200">{m.sport?.name || '-'}</td>
                    <td className="px-4 py-3 text-navy-600 dark:text-navy-200">{formatDate(m.subscriptionEndDate)}</td>
                    <td className="px-4 py-3"><Badge className={STATUS_COLORS[m.status]}>{STATUS_LABELS[m.status]}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-start">
                        <button onClick={() => navigate(`/members/${m.id}`)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 dark:hover:bg-white/10"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => { setEditingMember(m); setFormOpen(true); }} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setArchiveTarget(m)} className="p-1.5 rounded-lg text-navy-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <MemberFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={loadMembers} member={editingMember} />
      <ConfirmDialog
        open={!!archiveTarget}
        title="أرشفة العضو"
        message={`هل تريد نقل "${archiveTarget?.firstName} ${archiveTarget?.lastName}" إلى الأرشيف؟ يمكن استرجاعه في أي وقت من قسم الأرشيف.`}
        confirmLabel="نقل إلى الأرشيف"
        loading={archiving}
        onConfirm={handleArchive}
        onClose={() => setArchiveTarget(null)}
      />

      {showDropInModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/60 dark:bg-black/60 backdrop-blur-sm p-4 font-sans" dir="rtl">
          <div className="bg-white dark:bg-[#0A0F1C] border border-gray-100 dark:border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-up">
            <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-2">تسجيل حصة زائر</h3>
            <p className="text-sm text-gray-500 dark:text-white/50 mb-6">سيتم إضافة المبلغ مباشرة إلى قسم المالية كإيراد حصة فردية.</p>
            
            <form onSubmit={handleDropInSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-800 dark:text-white/80 mb-2">سعر الحصة (دج)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={dropInAmount}
                  onChange={(e) => setDropInAmount(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-navy-900 dark:text-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all"
                  placeholder="مثال: 300"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDropInModal(false)}
                  className="flex-1 h-12 bg-gray-100 dark:bg-white/10 text-navy-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={dropInLoading}
                  className="flex-1 h-12 bg-[#D4AF37] text-[#0A0F1C] font-bold rounded-xl hover:bg-[#D4AF37]/90 transition-colors disabled:opacity-50"
                >
                  {dropInLoading ? 'جاري التسجيل...' : 'تأكيد وإضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}