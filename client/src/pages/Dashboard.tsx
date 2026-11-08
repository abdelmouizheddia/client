import { useEffect, useState } from 'react';
import {
  Users, UserX, AlertTriangle, Wallet, TrendingUp, Cake,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { dashboardApi } from '../api/resources';
import type { DashboardStats, DashboardCharts as ChartsData } from '../types';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import PageHeader from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#0A1F44', '#D4AF37', '#10B981', '#3B82F6', '#94A3B8', '#F43F5E'];

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="animate-fade-up min-w-0">
      <div className="mb-4">
        <h3 className="font-display font-bold text-navy-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-navy-400 dark:text-navy-300/60 mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-64">{children}</div>
    </Card>
  );
}

const tooltipStyle = {
  background: 'rgba(10,31,68,0.92)',
  border: '1px solid rgba(212,175,55,0.3)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
};

export default function Dashboard() {
  const { role } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.stats(), dashboardApi.charts()])
      .then(([s, c]) => {
        setStats(s);
        setCharts(c);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!stats || !charts) return <EmptyState icon={<TrendingUp className="h-7 w-7" />} title="تعذر تحميل البيانات" />;

  return (
    <div>
      <PageHeader title="لوحة التحكم" subtitle="نظرة عامة على أداء النادي الرياضي" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="الأعضاء النشطون" value={stats.activeMembers} icon={<Users className="h-5 w-5" />} accent="navy" />
        <StatCard label="اشتراكات منتهية" value={stats.expiredMembers} icon={<UserX className="h-5 w-5" />} accent="rose" />
        <StatCard label="تنتهي خلال 7 أيام" value={stats.expiringSoonCount} icon={<AlertTriangle className="h-5 w-5" />} accent="gold" />
        <StatCard label="دخل هذا الشهر" value={formatCurrency(stats.incomeThisMonth)} delta={stats.growthPercent} icon={<Wallet className="h-5 w-5" />} accent="emerald" />
        {role !== 'coach' && (
          <StatCard label="دخل هذه السنة"
            value={formatCurrency(stats.incomeThisYear)}
            icon={<TrendingUp className="h-5 w-5" />}
            accent="navy"
          />
        )}
        {!stats.isCoachView && (
          <>
            <StatCard label="دخل الذكور هذه السنة" value={formatCurrency(stats.maleIncomeThisYear || 0)} icon={<Wallet className="h-5 w-5" />} accent="navy" />
            <StatCard label="دخل الإناث هذه السنة" value={formatCurrency(stats.femaleIncomeThisYear || 0)} icon={<Wallet className="h-5 w-5" />} accent="rose" />
            <StatCard label="مداخيل أخرى" value={formatCurrency(stats.otherIncomeThisYear || 0)} icon={<Wallet className="h-5 w-5" />} accent="gold" />
          </>
        )}
        <StatCard label="إجمالي الأعضاء" value={stats.totalMembers} icon={<Users className="h-5 w-5" />} accent="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="المداخيل الشهرية" subtitle="آخر 12 شهراً">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B822" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="توزيع الأعضاء حسب الرياضة">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={charts.sportDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {charts.sportDistribution.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="المسجلون الجدد أسبوعياً" subtitle="آخر 8 أسابيع">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={charts.weeklyNewMembers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B822" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" width={30} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#0A1F44" strokeWidth={2.5} dot={{ fill: '#D4AF37', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="الفئات العمرية">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.ageDistribution} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B822" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
              <YAxis type="category" dataKey="range" tick={{ fontSize: 11 }} stroke="#94A3B8" width={50} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#1F3A6E" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="عدد الرياضيين حسب الرياضة">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.sportDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B822" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" width={30} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {charts.sportDistribution.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="animate-fade-up min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-navy-900 dark:text-white">أعياد الميلاد هذا الشهر</h3>
            <Cake className="h-5 w-5 text-gold-500" />
          </div>
          <div className="flex items-center gap-4 mb-4 px-1">
            {!stats.isCoachView && (
              <div className="flex items-center gap-1.5 text-sm text-navy-600 dark:text-navy-200">
                <span className="text-navy-500 font-bold">&#9794;</span> {stats.maleCount} ذكور
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-navy-600 dark:text-navy-200">
              <span className="text-rose-400 font-bold">&#9792;</span> {stats.femaleCount} إناث
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.birthdaysThisMonth.length === 0 && (
              <p className="text-sm text-navy-400 dark:text-navy-300/60 text-center py-6">لا توجد أعياد ميلاد هذا الشهر</p>
            )}
            {stats.birthdaysThisMonth.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-navy-50/60 dark:hover:bg-white/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-100 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300 font-mono text-xs font-bold shrink-0 overflow-hidden">
                  {m.photo ? <img src={m.photo} className="h-full w-full object-cover" /> : m.day}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-800 dark:text-white truncate">{m.firstName} {m.lastName}</p>
                  <p className="text-xs text-navy-400 dark:text-navy-300/60">{formatDate(m.birthDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
