import { useEffect, useState } from 'react';
import { Users, TrendingUp, Award, UserCircle, Phone } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Loader';
import { coachPortalApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import type { CoachPortalSummary, AdminPortalSummary } from '../types';

const tooltipStyle = { background: 'rgba(10,31,68,0.92)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, color: '#fff', fontSize: 12 };

export default function CoachPortal() {
  const { showToast } = useToast();
  const { role } = useAuth();
  const [data, setData] = useState<any>(null); // استخدام any مؤقتاً لتقبل الحقول الجديدة
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coachPortalApi.summary()
      .then(setData)
      .catch((err) => showToast(apiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) return <Spinner />;
  if (!data) return <EmptyState icon={<UserCircle className="h-7 w-7" />} title="تعذر تحميل البيانات" />;

  // ─── عرض المدربة: حسابها الخاص ─────────────────────────────
  if (data.role === 'coach') {
    const d = data;
    return (
      <div>
        <PageHeader title="حسابي" subtitle="ملخص أدائي ومعلومات شهريتي" />

        <Card className="mb-5 gold-edge">
          <div className="flex items-center gap-4">
            <Avatar src={d.coachPhoto} firstName={d.coachName.split(' ')[0]} lastName={d.coachName.split(' ')[1]} size="xl" />
            <div>
              <h2 className="font-display text-xl font-bold text-navy-900 dark:text-white">{d.coachName}</h2>
              {d.specialty && <p className="text-gold-600 dark:text-gold-300 text-sm mt-0.5">{d.specialty}</p>}
              {d.phone && (
                <div className="flex items-center gap-1.5 text-navy-500 dark:text-navy-300 text-sm mt-1">
                  <Phone className="h-3.5 w-3.5" />
                  {d.phone}
                </div>
              )}
              <p className="text-xs text-navy-400 dark:text-navy-300/60 font-mono mt-1">@{d.username}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <StatCard label="العضوات النشطات" value={d.activeFemaleCount} icon={<Users className="h-5 w-5" />} accent="navy" />
          <StatCard label="حصص الزوار (هذا الشهر)" value={d.dropInCount || 0} icon={<TrendingUp className="h-5 w-5" />} accent="emerald" />
          <StatCard label="شهريتي الحالية" value={formatCurrency(d.currentMonthSalary)} icon={<Award className="h-5 w-5" />} accent="gold" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-display font-bold text-navy-900 dark:text-white mb-4">طريقة حساب الشهرية</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-navy-50 dark:bg-white/5">
                <span className="text-navy-600 dark:text-navy-200">العمولة لكل عضوة نشطة</span>
                <span className="font-mono font-bold text-gold-600 dark:text-gold-300">{d.commissionRate} د.ج</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-navy-50 dark:bg-white/5">
                <span className="text-navy-600 dark:text-navy-200">عدد العضوات النشطات</span>
                <span className="font-mono font-bold text-navy-900 dark:text-white">{d.activeFemaleCount}</span>
              </div>
              
              {/* 🔴 خانة مداخيل الزوار الجديدة 🔴 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                <span className="text-emerald-700 dark:text-emerald-300">مداخيل حصص الزوار ({d.dropInCount || 0} حصة)</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(d.dropInTotal || 0)}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gold-50 dark:bg-gold-500/10 border border-gold-200/60 dark:border-gold-500/20">
                <span className="font-semibold text-navy-800 dark:text-white">الشهرية الإجمالية</span>
                <span className="font-mono font-bold text-xl text-gold-700 dark:text-gold-300">{formatCurrency(d.currentMonthSalary)}</span>
              </div>
              <p className="text-xs text-navy-400 dark:text-navy-300/60 leading-relaxed text-center mt-2">
                الراتب الأساسي ({d.activeFemaleCount * d.commissionRate} دج) + الزوار ({d.dropInTotal || 0} دج) = {formatCurrency(d.currentMonthSalary)}
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="font-display font-bold text-navy-900 dark:text-white mb-4">مكاسب الأشهر الستة الماضية</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.monthlyHistory} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B822" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#94A3B8" width={40} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'المكاسب']} />
                  <Bar dataKey="earnings" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ─── عرض المسؤول: نظرة عامة على كل المدربات ──────────────────
  const d = data;
  return (
    <div>
      <PageHeader title="حسابات المدربات — نظرة عامة" subtitle="متابعة شهريات وأداء المدربات من حساب المسؤول" />

      <Card className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-navy-500 dark:text-navy-300">إجمالي العضوات النشطات</p>
            <p className="font-mono font-bold text-3xl text-navy-900 dark:text-white mt-1">{d.totalFemaleMembers}</p>
          </div>
          <Users className="h-10 w-10 text-gold-400/50" />
        </div>
      </Card>

      {!d.coachSummaries?.length ? (
        <EmptyState icon={<UserCircle className="h-7 w-7" />} title="لا يوجد حسابات مدربات بعد" description="اذهب إلى صفحة «حسابات المدربات» لإنشاء حسابات" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {d.coachSummaries.map((acc: any) => (
            <Card key={acc.id} className="animate-fade-up">
              <div className="flex items-center gap-3 mb-4">
                <Avatar src={acc.coachPhoto} firstName={acc.coachName.split(' ')[0]} lastName={acc.coachName.split(' ')[1]} size="md" />
                <div>
                  <p className="font-display font-bold text-navy-900 dark:text-white">{acc.coachName}</p>
                  <p className="text-xs text-navy-400 font-mono">@{acc.username}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-navy-400">العمولة الأساسية</span>
                  <span className="font-mono text-navy-700 dark:text-navy-100">{formatCurrency(acc.activeFemaleCount * acc.commissionRate)}</span>
                </div>
                
                {/* إظهار مداخيل الزوار في شاشة المسؤول أيضاً */}
                <div className="flex justify-between">
                  <span className="text-navy-400">مداخيل الزوار</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">+{formatCurrency(acc.dropInTotal || 0)}</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-navy-100 dark:border-white/10 mt-2">
                  <span className="font-semibold text-navy-800 dark:text-white">الشهرية الإجمالية</span>
                  <span className="font-mono font-bold text-gold-600 dark:text-gold-300">
                    {formatCurrency(acc.monthlyEarnings)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}