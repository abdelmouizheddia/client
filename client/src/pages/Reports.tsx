import { useRef, useState } from 'react';
import { Users, Wallet, CalendarCheck, Banknote, UserCog, Download, Printer, FileBarChart2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Loader';
import { reportsApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, INCOME_CATEGORY_LABELS, EXPENSE_CATEGORY_LABELS } from '../utils/format';
import { exportElementToPdf } from '../utils/pdfExport';

type ReportType = 'members' | 'subscriptions' | 'attendance' | 'finance' | 'coaches';

const REPORT_OPTIONS: { key: ReportType; label: string; icon: any }[] = [
  { key: 'members', label: 'تقرير الأعضاء', icon: Users },
  { key: 'subscriptions', label: 'تقرير الاشتراكات', icon: Wallet },
  { key: 'attendance', label: 'تقرير الحضور', icon: CalendarCheck },
  { key: 'finance', label: 'التقرير المالي', icon: Banknote },
  { key: 'coaches', label: 'تقرير المدربين', icon: UserCog },
];

export default function Reports() {
  const { showToast } = useToast();
  const { clubName } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [activeType, setActiveType] = useState<ReportType | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function loadReport(type: ReportType) {
    setActiveType(type);
    setLoading(true);
    setData(null);
    try {
      const res = await reportsApi[type]();
      setData(res);
    } catch (err) {
      showToast(apiErrorMessage(err, 'تعذر تحميل التقرير'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPdf() {
    if (!printRef.current || !activeType) return;
    setExporting(true);
    try {
      await exportElementToPdf(printRef.current, `${activeType}-report.pdf`);
    } finally {
      setExporting(false);
    }
  }

  const todayLabel = formatDate(new Date());

  return (
    <div>
      <PageHeader title="التقارير" subtitle="إنشاء وتصدير تقارير PDF لكافة جوانب النادي" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 no-print">
        {REPORT_OPTIONS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => loadReport(key)} className={`glass-panel rounded-xl2 p-4 flex flex-col items-center gap-2 text-center transition-all hover:shadow-card ${activeType === key ? 'ring-2 ring-gold-400' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-800/10 text-navy-700 dark:bg-white/10 dark:text-gold-200">
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-navy-700 dark:text-navy-100">{label}</span>
          </button>
        ))}
      </div>

      {!activeType && <EmptyState icon={<FileBarChart2 className="h-7 w-7" />} title="اختر نوع التقرير" description="اختر أحد أنواع التقارير أعلاه لعرضه وتصديره بصيغة PDF" />}

      {loading && <Spinner />}

      {!loading && activeType && data && (
        <>
          <div className="flex justify-end gap-2 mb-4 no-print">
            <Button variant="outline" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>طباعة</Button>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} loading={exporting} onClick={handleExportPdf}>تصدير PDF</Button>
          </div>

          <div ref={printRef} className="bg-white dark:bg-navy-900 rounded-xl2 p-6 shadow-card">
            <div className="flex items-center justify-between border-b-2 border-gold-500 pb-4 mb-5">
              <div>
                <h2 className="font-display text-lg font-bold text-navy-900 dark:text-white">{clubName}</h2>
                <p className="text-xs text-navy-400 dark:text-navy-300">{REPORT_OPTIONS.find((r) => r.key === activeType)?.label}</p>
              </div>
              <p className="text-xs text-navy-400 dark:text-navy-300 font-mono">{todayLabel}</p>
            </div>

            {activeType === 'members' && <MembersTable rows={data} />}
            {activeType === 'subscriptions' && <SubscriptionsTable rows={data} />}
            {activeType === 'attendance' && <AttendanceTable rows={data} />}
            {activeType === 'coaches' && <CoachesTable rows={data} />}
            {activeType === 'finance' && <FinanceTable data={data} />}
          </div>
        </>
      )}
    </div>
  );
}

function ReportTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-xs">
      <thead><tr className="border-b border-navy-200 dark:border-white/10 text-navy-500 dark:text-navy-300">
        {headers.map((h, i) => <th key={i} className="text-right font-semibold px-2 py-2">{h}</th>)}
      </tr></thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function MembersTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <EmptyState icon={<Users className="h-7 w-7" />} title="لا توجد بيانات" />;
  return (
    <ReportTable headers={['#', 'الرمز', 'الاسم الكامل', 'العمر', 'الجنس', 'الرياضة', 'المدرب', 'الهاتف', 'الحالة']}>
      {rows.map((r) => (
        <tr key={r.index} className="border-b border-navy-50 dark:border-white/5 text-navy-700 dark:text-navy-100">
          <td className="px-2 py-1.5">{r.index}</td>
          <td className="px-2 py-1.5 font-mono">{r.memberCode}</td>
          <td className="px-2 py-1.5">{r.fullName}</td>
          <td className="px-2 py-1.5">{r.age}</td>
          <td className="px-2 py-1.5">{r.gender}</td>
          <td className="px-2 py-1.5">{r.sport}</td>
          <td className="px-2 py-1.5">{r.coach}</td>
          <td className="px-2 py-1.5">{r.phone}</td>
          <td className="px-2 py-1.5">{r.status}</td>
        </tr>
      ))}
    </ReportTable>
  );
}

function SubscriptionsTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <EmptyState icon={<Wallet className="h-7 w-7" />} title="لا توجد بيانات" />;
  return (
    <ReportTable headers={['#', 'الرمز', 'الاسم الكامل', 'الباقة', 'السعر', 'البداية', 'النهاية', 'الحالة']}>
      {rows.map((r) => (
        <tr key={r.index} className="border-b border-navy-50 dark:border-white/5 text-navy-700 dark:text-navy-100">
          <td className="px-2 py-1.5">{r.index}</td>
          <td className="px-2 py-1.5 font-mono">{r.memberCode}</td>
          <td className="px-2 py-1.5">{r.fullName}</td>
          <td className="px-2 py-1.5">{r.planLabel}</td>
          <td className="px-2 py-1.5 font-mono">{formatCurrency(r.price)}</td>
          <td className="px-2 py-1.5">{formatDate(r.startDate)}</td>
          <td className="px-2 py-1.5">{formatDate(r.endDate)}</td>
          <td className="px-2 py-1.5">{r.status}</td>
        </tr>
      ))}
    </ReportTable>
  );
}

function AttendanceTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <EmptyState icon={<CalendarCheck className="h-7 w-7" />} title="لا توجد بيانات" />;
  return (
    <ReportTable headers={['#', 'الرمز', 'الاسم الكامل', 'التاريخ', 'الطريقة']}>
      {rows.map((r) => (
        <tr key={r.index} className="border-b border-navy-50 dark:border-white/5 text-navy-700 dark:text-navy-100">
          <td className="px-2 py-1.5">{r.index}</td>
          <td className="px-2 py-1.5 font-mono">{r.memberCode}</td>
          <td className="px-2 py-1.5">{r.fullName}</td>
          <td className="px-2 py-1.5">{formatDate(r.date)}</td>
          <td className="px-2 py-1.5">{r.method}</td>
        </tr>
      ))}
    </ReportTable>
  );
}

function CoachesTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <EmptyState icon={<UserCog className="h-7 w-7" />} title="لا توجد بيانات" />;
  return (
    <ReportTable headers={['#', 'الاسم الكامل', 'التخصص', 'الهاتف', 'الراتب', 'عدد الأعضاء', 'الجدول']}>
      {rows.map((r) => (
        <tr key={r.index} className="border-b border-navy-50 dark:border-white/5 text-navy-700 dark:text-navy-100">
          <td className="px-2 py-1.5">{r.index}</td>
          <td className="px-2 py-1.5">{r.fullName}</td>
          <td className="px-2 py-1.5">{r.specialty}</td>
          <td className="px-2 py-1.5">{r.phone}</td>
          <td className="px-2 py-1.5 font-mono">{formatCurrency(r.salary)}</td>
          <td className="px-2 py-1.5">{r.membersCount}</td>
          <td className="px-2 py-1.5">{r.schedule}</td>
        </tr>
      ))}
    </ReportTable>
  );
}

function FinanceTable({ data }: { data: { incomes: any[]; expenses: any[]; totalIncome: number; totalExpense: number; netProfit: number } }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3 text-center">
          <p className="text-xs text-navy-400">إجمالي المداخيل</p>
          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(data.totalIncome)}</p>
        </div>
        <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 p-3 text-center">
          <p className="text-xs text-navy-400">إجمالي المصاريف</p>
          <p className="font-mono font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(data.totalExpense)}</p>
        </div>
        <div className="rounded-xl bg-gold-50 dark:bg-gold-500/10 p-3 text-center">
          <p className="text-xs text-navy-400">الربح الصافي</p>
          <p className="font-mono font-bold text-gold-700 dark:text-gold-300 mt-1">{formatCurrency(data.netProfit)}</p>
        </div>
      </div>
      <div>
        <h4 className="font-display font-bold text-sm text-navy-800 dark:text-white mb-2">المداخيل</h4>
        {!data.incomes.length ? <p className="text-xs text-navy-400">لا توجد سجلات</p> : (
          <ReportTable headers={['الفئة', 'المبلغ', 'الوصف', 'التاريخ']}>
            {data.incomes.map((i) => (
              <tr key={i.id} className="border-b border-navy-50 dark:border-white/5 text-navy-700 dark:text-navy-100">
                <td className="px-2 py-1.5">{INCOME_CATEGORY_LABELS[i.category] || i.category}</td>
                <td className="px-2 py-1.5 font-mono">{formatCurrency(i.amount)}</td>
                <td className="px-2 py-1.5">{i.description || '-'}</td>
                <td className="px-2 py-1.5">{formatDate(i.date)}</td>
              </tr>
            ))}
          </ReportTable>
        )}
      </div>
      <div>
        <h4 className="font-display font-bold text-sm text-navy-800 dark:text-white mb-2">المصاريف</h4>
        {!data.expenses.length ? <p className="text-xs text-navy-400">لا توجد سجلات</p> : (
          <ReportTable headers={['الفئة', 'المبلغ', 'الوصف', 'التاريخ']}>
            {data.expenses.map((e) => (
              <tr key={e.id} className="border-b border-navy-50 dark:border-white/5 text-navy-700 dark:text-navy-100">
                <td className="px-2 py-1.5">{EXPENSE_CATEGORY_LABELS[e.category] || e.category}</td>
                <td className="px-2 py-1.5 font-mono">{formatCurrency(e.amount)}</td>
                <td className="px-2 py-1.5">{e.description || '-'}</td>
                <td className="px-2 py-1.5">{formatDate(e.date)}</td>
              </tr>
            ))}
          </ReportTable>
        )}
      </div>
    </div>
  );
}
