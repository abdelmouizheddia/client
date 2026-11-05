import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Trash2, Wallet, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RenewSubscriptionModal from '../components/RenewSubscriptionModal';
import { subscriptionsApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { STATUS_COLORS, PLAN_LABELS, formatDate, formatCurrency } from '../utils/format';
import type { Subscription } from '../types';

type FilterTab = 'all' | 'active' | 'expired' | 'expiring';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'expired', label: 'منتهي' },
  { key: 'expiring', label: 'تنتهي قريباً' },
];

export default function Subscriptions() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [renewTarget, setRenewTarget] = useState<Subscription | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    if (tab === 'expiring') {
      subscriptionsApi.expiring().then((data) => { setSubs(data); setTotalPages(1); }).catch((err) => showToast(apiErrorMessage(err), 'error')).finally(() => setLoading(false));
    } else {
      subscriptionsApi.list({ status: tab === 'all' ? undefined : tab, search: debouncedSearch || undefined, page, limit: 15 })
        .then((res) => { setSubs(res.data); setTotalPages(res.totalPages); })
        .catch((err) => showToast(apiErrorMessage(err), 'error'))
        .finally(() => setLoading(false));
    }
  }, [tab, debouncedSearch, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab, debouncedSearch]);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await subscriptionsApi.remove(deleteId);
      showToast('تم حذف الاشتراك', 'success');
      setDeleteId(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  return (
    <div>
      <PageHeader title="الاشتراكات" subtitle="إدارة اشتراكات الأعضاء وتجديدها" />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)} className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${tab === key ? 'bg-navy-800 text-gold-200 dark:bg-gold-500 dark:text-navy-900' : 'text-navy-500 hover:bg-navy-100/60 dark:text-navy-300'}`}>
                {label}
              </button>
            ))}
          </div>
          {tab !== 'expiring' && (
            <div className="w-full sm:w-64">
              <Input icon={<Search className="h-4 w-4" />} placeholder="بحث عن عضو..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
        </div>
      </Card>

      <Card padded={false}>
        {loading ? <Spinner /> : !subs.length ? (
          <EmptyState icon={<Wallet className="h-7 w-7" />} title="لا يوجد اشتراكات مطابقة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100 dark:border-white/10 text-navy-400 text-xs">
                <th className="text-right font-medium px-4 py-3">العضو</th>
                <th className="text-right font-medium px-4 py-3">الباقة</th>
                <th className="text-right font-medium px-4 py-3">السعر</th>
                <th className="text-right font-medium px-4 py-3">تاريخ الانتهاء</th>
                {tab === 'expiring' && <th className="text-right font-medium px-4 py-3">الأيام المتبقية</th>}
                <th className="text-right font-medium px-4 py-3">الحالة</th>
                <th className="text-left font-medium px-4 py-3">إجراءات</th>
              </tr></thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-navy-50 dark:border-white/5 hover:bg-navy-50/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={s.member?.photo} firstName={s.member?.firstName} lastName={s.member?.lastName} size="sm" />
                        <div>
                          <p className="font-medium text-navy-800 dark:text-white">{s.member?.firstName} {s.member?.lastName}</p>
                          <p className="font-mono text-xs text-navy-400">{s.member?.memberCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy-600 dark:text-navy-200">{s.planLabel || PLAN_LABELS[s.planType]}</td>
                    <td className="px-4 py-3 font-mono text-navy-600 dark:text-navy-200">{formatCurrency(s.price)}</td>
                    <td className="px-4 py-3 text-navy-600 dark:text-navy-200">{formatDate(s.endDate)}</td>
                    {tab === 'expiring' && (
                      <td className="px-4 py-3">
                        <Badge className={s.daysLeft! <= 3 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}>
                          <AlertTriangle className="h-3 w-3 ml-1 inline" /> {s.daysLeft} يوم
                        </Badge>
                      </td>
                    )}
                    <td className="px-4 py-3"><Badge className={s.status === 'active' ? STATUS_COLORS.active : STATUS_COLORS.expired}>{s.status === 'active' ? 'نشط' : 'منتهي'}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-start">
                        <button onClick={() => setRenewTarget(s)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 dark:hover:bg-white/10" title="تجديد"><RefreshCw className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg text-navy-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" title="حذف"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {tab !== 'expiring' && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}

      <RenewSubscriptionModal
        open={!!renewTarget}
        onClose={() => setRenewTarget(null)}
        onSaved={load}
        memberId={renewTarget?.memberId || null}
        memberName={renewTarget?.member ? `${renewTarget.member.firstName} ${renewTarget.member.lastName}` : undefined}
      />
      <ConfirmDialog open={!!deleteId} title="حذف الاشتراك" message="هل تريد حذف هذا الاشتراك بشكل نهائي؟" confirmLabel="حذف" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
    </div>
  );
}
