import { useEffect, useState, useCallback } from 'react';
import { Search, ArchiveRestore, Trash2, Archive as ArchiveIcon, PlayCircle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { archiveApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate } from '../utils/format';
import type { ArchiveEntry } from '../types';

export default function Archive() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreTarget, setRestoreTarget] = useState<ArchiveEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArchiveEntry | null>(null);
  const [runningAuto, setRunningAuto] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    archiveApi.list({ search: debouncedSearch || undefined, page, limit: 15 })
      .then((res) => { setEntries(res.data); setTotalPages(res.totalPages); setTotal(res.total); })
      .catch((err) => showToast(apiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  async function handleRestore() {
    if (!restoreTarget) return;
    try {
      await archiveApi.restore(restoreTarget.id);
      showToast('تم استرجاع العضو بنجاح', 'success');
      setRestoreTarget(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  async function handlePermanentDelete() {
    if (!deleteTarget) return;
    try {
      await archiveApi.remove(deleteTarget.id);
      showToast('تم الحذف النهائي', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  async function handleRunAutoArchive() {
    setRunningAuto(true);
    try {
      const res = await archiveApi.runAutoArchive();
      showToast(res.message, 'success');
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setRunningAuto(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="الأرشيف"
        subtitle={`${total} عضو مؤرشف`}
        actions={<Button variant="outline" icon={<PlayCircle className="h-4 w-4" />} loading={runningAuto} onClick={handleRunAutoArchive}>تشغيل الأرشفة التلقائية</Button>}
      />

      <Card className="mb-4">
        <Input icon={<Search className="h-4 w-4" />} placeholder="بحث بالاسم أو رمز العضوية..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      <Card padded={false}>
        {loading ? <Spinner /> : !entries.length ? (
          <EmptyState icon={<ArchiveIcon className="h-7 w-7" />} title="الأرشيف فارغ" description="لا يوجد أعضاء مؤرشفون حالياً" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100 dark:border-white/10 text-navy-400 text-xs">
                <th className="text-right font-medium px-4 py-3">العضو</th>
                <th className="text-right font-medium px-4 py-3">الرمز</th>
                <th className="text-right font-medium px-4 py-3">الرياضة</th>
                <th className="text-right font-medium px-4 py-3">سبب الأرشفة</th>
                <th className="text-right font-medium px-4 py-3">تاريخ الأرشفة</th>
                <th className="text-left font-medium px-4 py-3">إجراءات</th>
              </tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-navy-50 dark:border-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={e.photo} firstName={e.fullName.split(' ')[0]} lastName={e.fullName.split(' ')[1]} size="sm" />
                        <span className="font-medium text-navy-800 dark:text-white">{e.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-navy-500 dark:text-navy-300">{e.memberCode}</td>
                    <td className="px-4 py-3 text-navy-600 dark:text-navy-200">{e.sport || '-'}</td>
                    <td className="px-4 py-3 text-navy-600 dark:text-navy-200">{e.reason}</td>
                    <td className="px-4 py-3 text-navy-600 dark:text-navy-200">{formatDate(e.archivedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-start">
                        <button onClick={() => setRestoreTarget(e)} className="p-1.5 rounded-lg text-navy-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10" title="استرجاع"><ArchiveRestore className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(e)} className="p-1.5 rounded-lg text-navy-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" title="حذف نهائي"><Trash2 className="h-4 w-4" /></button>
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

      <ConfirmDialog
        open={!!restoreTarget}
        title="استرجاع العضو"
        message={`هل تريد استرجاع "${restoreTarget?.fullName}" من الأرشيف وإعادته إلى قائمة الأعضاء النشطين؟`}
        confirmLabel="استرجاع"
        danger={false}
        onConfirm={handleRestore}
        onClose={() => setRestoreTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف نهائي"
        message={`هل تريد حذف "${deleteTarget?.fullName}" بشكل نهائي من الأرشيف؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف نهائياً"
        onConfirm={handlePermanentDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
