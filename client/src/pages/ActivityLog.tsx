import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Search,
  RefreshCw,
  CalendarDays,
  Users,
  ShieldCheck,
  UserRound,
  Clock3,
  CreditCard,
  UserPlus,
  LogIn,
  LogOut,
  Pencil,
  Trash2,
  CircleDot,
  X,
  Filter,
  TrendingUp,
} from 'lucide-react';

import PageHeader from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Loader';
import { formatDateTime } from '../utils/format';
import { activitiesApi } from '../api/resources';

interface ActivityRecord {
  id: number;
  actorName: string;
  actorRole: string;
  actionType: string;
  description: string;
  amount: number | null;
  createdAt: string;
}

type ActionFilter =
  | 'all'
  | 'LOGIN'
  | 'LOGOUT'
  | 'ADD_MEMBER'
  | 'SUBSCRIPTION'
  | 'OTHER';

const actionDetails = (action: string) => {
  const value = (action || '').toUpperCase();

  if (value.includes('LOGIN')) {
    return {
      label: 'تسجيل الدخول',
      color: 'text-emerald-400',
      background: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      icon: LogIn,
    };
  }

  if (value.includes('LOGOUT')) {
    return {
      label: 'تسجيل الخروج',
      color: 'text-orange-400',
      background: 'bg-orange-400/10',
      border: 'border-orange-400/20',
      icon: LogOut,
    };
  }

  if (value.includes('ADD_MEMBER')) {
    return {
      label: 'إضافة مشتركة',
      color: 'text-lime-300',
      background: 'bg-lime-300/10',
      border: 'border-lime-300/20',
      icon: UserPlus,
    };
  }

  if (value.includes('SUBSCRIPTION')) {
    return {
      label: 'اشتراك / دفع',
      color: 'text-sky-400',
      background: 'bg-sky-400/10',
      border: 'border-sky-400/20',
      icon: CreditCard,
    };
  }

  if (value.includes('DELETE')) {
    return {
      label: 'حذف',
      color: 'text-rose-400',
      background: 'bg-rose-400/10',
      border: 'border-rose-400/20',
      icon: Trash2,
    };
  }

  if (value.includes('UPDATE') || value.includes('EDIT')) {
    return {
      label: 'تعديل',
      color: 'text-violet-400',
      background: 'bg-violet-400/10',
      border: 'border-violet-400/20',
      icon: Pencil,
    };
  }

  if (value.includes('ADD') || value.includes('CREATE')) {
    return {
      label: 'إضافة',
      color: 'text-emerald-400',
      background: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      icon: UserPlus,
    };
  }

  return {
    label: action || 'نشاط آخر',
    color: 'text-gray-300',
    background: 'bg-white/5',
    border: 'border-white/10',
    icon: Activity,
  };
};

const roleLabel = (role: string) => {
  const value = (role || '').toLowerCase();

  if (value === 'admin' || value === 'administrator') return 'الإدارة';
  if (value === 'coach') return 'مدربة';

  return role || 'غير محدد';
};

const getTodayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const isToday = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return key === getTodayKey();
};

const moneyFormat = new Intl.NumberFormat('ar-DZ', {
  maximumFractionDigits: 2,
});

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchLogs = async () => {
    setRefreshing(true);
    setError('');

    try {
      const data = await activitiesApi.list();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('تعذر جلب النشاطات', err);
      setError('تعذر تحديث سجل النشاطات. تحقق من اتصالك ثم حاول مجدداً.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const statistics = useMemo(() => {
    const today = logs.filter((log) => isToday(log.createdAt));

    return {
      total: logs.length,
      today: today.length,
      admins: logs.filter(
        (log) =>
          ['admin', 'administrator'].includes(
            (log.actorRole || '').toLowerCase()
          )
      ).length,
      coaches: logs.filter(
        (log) => (log.actorRole || '').toLowerCase() === 'coach'
      ).length,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return logs.filter((log) => {
      const action = (log.actionType || '').toUpperCase();

      const matchesSearch =
        !query ||
        [
          log.actorName,
          log.actorRole,
          log.actionType,
          log.description,
        ].some((value) =>
          String(value || '').toLocaleLowerCase().includes(query)
        );

      const matchesAction =
        actionFilter === 'all' ||
        (actionFilter === 'OTHER'
          ? ![
              'LOGIN',
              'LOGOUT',
              'ADD_MEMBER',
              'SUBSCRIPTION',
            ].some((item) => action.includes(item))
          : action.includes(actionFilter));

      const role = (log.actorRole || '').toLowerCase();

      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'admin'
          ? role === 'admin' || role === 'administrator'
          : role === roleFilter);

      return matchesSearch && matchesAction && matchesRole;
    });
  }, [logs, search, actionFilter, roleFilter]);

  const clearFilters = () => {
    setSearch('');
    setActionFilter('all');
    setRoleFilter('all');
  };

  const hasFilters =
    search.trim() !== '' ||
    actionFilter !== 'all' ||
    roleFilter !== 'all';

  const statCards = [
    {
      title: 'إجمالي النشاطات',
      value: statistics.total,
      detail: 'آخر 100 عملية مسجلة',
      icon: Activity,
      color: 'text-lime-300',
      background: 'bg-lime-300/10',
    },
    {
      title: 'نشاطات اليوم',
      value: statistics.today,
      detail: 'العمليات خلال اليوم',
      icon: TrendingUp,
      color: 'text-emerald-400',
      background: 'bg-emerald-400/10',
    },
    {
      title: 'نشاط الإدارة',
      value: statistics.admins,
      detail: 'عمليات حسابات الإدارة',
      icon: ShieldCheck,
      color: 'text-sky-400',
      background: 'bg-sky-400/10',
    },
    {
      title: 'نشاط المدربات',
      value: statistics.coaches,
      detail: 'عمليات حسابات المدربات',
      icon: Users,
      color: 'text-pink-400',
      background: 'bg-pink-400/10',
    },
  ];

  return (
    <div dir="rtl" className="space-y-6 pb-8 text-white">

      <PageHeader
        title="مراقبة النشاطات"
        subtitle="متابعة وتوثيق العمليات والحركات داخل منصة AZZOUZ GYM"
      />

      {/* Main heading */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-l from-[#222a16] via-[#171b17] to-[#111513] p-5 sm:p-7">
        <div className="absolute -left-12 -top-16 h-52 w-52 rounded-full bg-[#ddf500]/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-[#ddf500]">
              <span className="h-2 w-2 rounded-full bg-[#ddf500] shadow-[0_0_12px_#ddf500]" />
              SYSTEM MONITORING
            </div>

            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              مركز مراقبة النشاطات
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-7 text-gray-400">
              جميع الحركات المسجلة في المنصة في مكان واحد،
              مع إمكانية البحث والتصفية ومتابعة تفاصيل العمليات.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={refreshing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ddf500] px-5 py-3 text-sm font-black text-black shadow-lg shadow-[#ddf500]/10 transition hover:bg-[#efff55] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </button>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="group rounded-2xl border border-white/10 bg-[#171a1d] p-5 transition hover:border-[#ddf500]/30 hover:bg-[#1b1f21]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {item.title}
                  </p>
                  <p className="mt-3 text-3xl font-black tabular-nums text-white">
                    {item.value}
                  </p>
                </div>

                <div className={`rounded-xl p-3 ${item.background}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500">{item.detail}</p>
            </div>
          );
        })}
      </section>

      {/* Activity list */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#171a1d] shadow-xl shadow-black/10">

        <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#ddf500]/10 p-2">
                <Activity className="h-5 w-5 text-[#ddf500]" />
              </div>
              <h3 className="text-lg font-black">سجل العمليات</h3>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              عرض ومراجعة أحدث الحركات المسجلة في النظام
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-400 sm:self-auto">
            <Clock3 className="h-4 w-4 text-[#ddf500]" />
            آخر 100 حركة
          </div>
        </div>

        {/* Search and filters */}
        <div className="space-y-4 border-b border-white/10 bg-black/10 p-5">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم المستخدم أو تفاصيل العملية..."
              className="w-full rounded-xl border border-white/10 bg-[#101315] py-3.5 pr-11 pl-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#ddf500]/60 focus:ring-2 focus:ring-[#ddf500]/10"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <Filter className="h-4 w-4 text-[#ddf500]" />
              تصفية النتائج
            </div>

            <select
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(event.target.value as ActionFilter)
              }
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101315] px-3 py-3 text-sm text-gray-200 outline-none focus:border-[#ddf500]/50"
              aria-label="تصفية حسب نوع العملية"
            >
              <option value="all">جميع أنواع العمليات</option>
              <option value="LOGIN">تسجيل الدخول</option>
              <option value="LOGOUT">تسجيل الخروج</option>
              <option value="ADD_MEMBER">إضافة مشتركة</option>
              <option value="SUBSCRIPTION">الاشتراكات والمدفوعات</option>
              <option value="OTHER">عمليات أخرى</option>
            </select>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101315] px-3 py-3 text-sm text-gray-200 outline-none focus:border-[#ddf500]/50"
              aria-label="تصفية حسب الدور"
            >
              <option value="all">جميع المستخدمين</option>
              <option value="admin">الإدارة</option>
              <option value="coach">المدربات</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 px-4 py-3 text-sm text-rose-300 transition hover:bg-rose-400/10"
              >
                <X className="h-4 w-4" />
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <p className="text-xs text-gray-400">
            النتائج المعروضة
            <span className="mx-1 font-black text-[#ddf500]">
              {filteredLogs.length}
            </span>
            من {logs.length}
          </p>

          <span className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            سجل النشاطات
          </span>
        </div>

        {error && (
          <div className="mx-5 mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4">
            <Spinner />
            <p className="text-sm text-gray-500">جاري تحميل النشاطات...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <Activity className="h-9 w-9 text-gray-500" />
            </div>

            <h4 className="font-bold text-gray-200">
              {logs.length === 0
                ? 'لا توجد نشاطات مسجلة بعد'
                : 'لا توجد نتائج مطابقة'}
            </h4>

            <p className="mt-2 max-w-sm text-xs leading-6 text-gray-500">
              {logs.length === 0
                ? 'ستظهر هنا العمليات فور تسجيلها داخل المنصة.'
                : 'جرّب تغيير كلمات البحث أو إزالة بعض عوامل التصفية.'}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-[#ddf500]/10 px-4 py-2 text-xs font-bold text-[#ddf500] hover:bg-[#ddf500]/20"
              >
                عرض جميع النشاطات
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-right">
                <thead>
                  <tr className="border-y border-white/10 bg-white/[0.025] text-xs text-gray-500">
                    <th className="px-5 py-4 font-bold">نوع العملية</th>
                    <th className="px-5 py-4 font-bold">المستخدم</th>
                    <th className="px-5 py-4 font-bold">التفاصيل</th>
                    <th className="px-5 py-4 font-bold">المبلغ</th>
                    <th className="px-5 py-4 font-bold">التاريخ والوقت</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {filteredLogs.map((log) => {
                    const meta = actionDetails(log.actionType);
                    const Icon = meta.icon;

                    return (
                      <tr
                        key={log.id}
                        className="group transition hover:bg-white/[0.025]"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${meta.color} ${meta.background} ${meta.border}`}>
                            <Icon className="h-4 w-4" />
                            {meta.label}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                              <UserRound className="h-4 w-4 text-gray-300" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">
                                {log.actorName || 'غير معروف'}
                              </p>
                              <p className="mt-1 text-[11px] text-gray-500">
                                {roleLabel(log.actorRole)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <p className="text-sm leading-6 text-gray-300">
                            {log.description || 'لا توجد تفاصيل إضافية'}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          {log.amount !== null && log.amount !== undefined ? (
                            <span className="text-sm font-bold text-[#ddf500]">
                              {moneyFormat.format(log.amount)} دج
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <CalendarDays className="h-4 w-4 text-gray-600" />
                            {formatDateTime(log.createdAt)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 md:hidden">
              {filteredLogs.map((log) => {
                const meta = actionDetails(log.actionType);
                const Icon = meta.icon;

                return (
                  <article
                    key={log.id}
                    className="rounded-xl border border-white/10 bg-[#101315] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                          <Icon className={`h-5 w-5 ${meta.color}`} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {log.actorName || 'غير معروف'}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {roleLabel(log.actorRole)}
                          </p>
                        </div>
                      </div>

                      <span className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold ${meta.color} ${meta.background} ${meta.border}`}>
                        {meta.label}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-gray-300">
                      {log.description || 'لا توجد تفاصيل إضافية'}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                      <span className="flex items-center gap-2 text-[11px] text-gray-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDateTime(log.createdAt)}
                      </span>

                      {log.amount !== null && log.amount !== undefined && (
                        <span className="text-xs font-bold text-[#ddf500]">
                          {moneyFormat.format(log.amount)} دج
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/10 px-5 py-4">
          <span className="text-[11px] text-gray-500">
            AZZOUZ GYM · ACTIVITY MONITOR
          </span>

          <span className="text-[11px] text-gray-500">
            عرض أحدث 100 عملية
          </span>
        </div>
      </section>
    </div>
  );
}
