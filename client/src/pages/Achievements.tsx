import { useEffect, useState, useCallback } from 'react';
import { Plus, Trophy, Trash2, Medal, Award, FileBadge } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AchievementFormModal from '../components/AchievementFormModal';
import { achievementsApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ACHIEVEMENT_TYPE_LABELS, formatDate } from '../utils/format';
import type { Achievement, AchievementType } from '../types';

type FilterType = 'all' | AchievementType;

const TYPE_ICONS: Record<AchievementType, any> = { medal: Medal, tournament: Trophy, certificate: FileBadge };

export default function Achievements() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    achievementsApi.list(filter === 'all' ? {} : { type: filter })
      .then(setAchievements)
      .catch((err) => showToast(apiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await achievementsApi.remove(deleteTarget.id);
      showToast('تم حذف الإنجاز', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  return (
    <div>
      <PageHeader title="الإنجازات" subtitle="ميداليات وبطولات وشهادات الأعضاء" actions={
        <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>إضافة إنجاز</Button>
      } />

      <Card className="mb-4">
        <div className="flex items-center gap-1 flex-wrap">
          {(['all', 'medal', 'tournament', 'certificate'] as FilterType[]).map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${filter === t ? 'bg-navy-800 text-gold-200 dark:bg-gold-500 dark:text-navy-900' : 'text-navy-500 hover:bg-navy-100/60 dark:text-navy-300'}`}>
              {t === 'all' ? 'الكل' : ACHIEVEMENT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </Card>

      {loading ? <Spinner /> : !achievements.length ? (
        <EmptyState icon={<Trophy className="h-7 w-7" />} title="لا يوجد إنجازات مسجلة" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a) => {
            const Icon = TYPE_ICONS[a.type] || Trophy;
            return (
              <Card key={a.id} className="animate-fade-up">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded-lg text-navy-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                </div>
                <p className="font-display font-bold text-navy-900 dark:text-white">{a.title}</p>
                <p className="text-xs text-gold-600 dark:text-gold-300 mt-0.5">{ACHIEVEMENT_TYPE_LABELS[a.type]} &middot; {formatDate(a.date)}</p>
                {a.description && <p className="text-sm text-navy-500 dark:text-navy-300 mt-2">{a.description}</p>}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-navy-50 dark:border-white/10">
                  <Avatar src={a.member?.photo} firstName={a.member?.firstName} lastName={a.member?.lastName} size="sm" />
                  <div>
                    <p className="text-xs font-medium text-navy-700 dark:text-navy-100">{a.member?.firstName} {a.member?.lastName}</p>
                    <p className="font-mono text-[11px] text-navy-400">{a.member?.memberCode}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AchievementFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
      <ConfirmDialog open={!!deleteTarget} title="حذف الإنجاز" message={`هل تريد حذف إنجاز "${deleteTarget?.title}"؟`} confirmLabel="حذف" onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
