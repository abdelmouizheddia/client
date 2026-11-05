import { useEffect, useState, useCallback, FormEvent } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Banknote } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { financeApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  INCOME_CATEGORY_LABELS, EXPENSE_CATEGORY_LABELS, formatCurrency, formatDate,
} from '../utils/format';
import type { FinanceIncome, FinanceExpense, FinanceReport, MonthlyTrendPoint } from '../types';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
type ListTab = 'income' | 'expense';

const PIE_COLORS = ['#0A1F44', '#D4AF37', '#10B981', '#3B82F6', '#94A3B8'];
const tooltipStyle = { background: 'rgba(10,31,68,0.92)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, color: '#fff', fontSize: 12 };

export default function Finance() {
  const { showToast } = useToast();
  const [period, setPeriod] = useState<Period>('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [report, setReport] = useState<FinanceReport | null>(null);
  const [trend, setTrend] = useState<MonthlyTrendPoint[]>([]);

  const [listTab, setListTab] = useState<ListTab>('income');
  const [incomes, setIncomes] = useState<FinanceIncome[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: ListTab } | null>(null);

  const params = period === 'custom' ? { from: from || undefined, to: to || undefined } : { period };

  const loadReport = useCallback(() => {
    financeApi.report(params).then(setReport).catch((err) => showToast(apiErrorMessage(err), 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, from, to]);

  const loadLists = useCallback(() => {
    setLoadingList(true);
    Promise.all([financeApi.income(params), financeApi.expenses(params)])
      .then(([inc, exp]) => { setIncomes(inc.data); setExpenses(exp.data); })
      .catch((err) => showToast(apiErrorMessage(err), 'error'))
      .finally(() => setLoadingList(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, from, to]);

  useEffect(() => { loadReport(); loadLists(); }, [loadReport, loadLists]);
  useEffect(() => { financeApi.monthlyTrend().then(setTrend).catch(() => {}); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'income') await financeApi.removeIncome(deleteTarget.id);
      else await financeApi.removeExpense(deleteTarget.id);
      showToast('تم الحذف بنجاح', 'success');
      setDeleteTarget(null);
      loadReport(); loadLists();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  const incomeBreakdown = report ? Object.entries(report.incomeByCategory).map(([k, v]) => ({ name: INCOME_CATEGORY_LABELS[k] || k, value: v })) : [];
  const expenseBreakdown = report ? Object.entries(report.expenseByCategory).map(([k, v]) => ({ name: EXPENSE_CATEGORY_LABELS[k] || k, value: v })) : [];

  return (
    <div>
      <PageHeader
        title="المالية"
        subtitle="تتبّع المداخيل والمصاريف والأرباح الصافية"
        actions={<Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>إضافة {listTab === 'income' ? 'دخل' : 'مصروف'}</Button>}
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${period === p ? 'bg-navy-800 text-gold-200 dark:bg-gold-500 dark:text-navy-900' : 'text-navy-500 hover:bg-navy-100/60 dark:text-navy-300'}`}>
              {{ daily: 'اليوم', weekly: 'الأسبوع', monthly: 'الشهر', yearly: 'السنة', custom: 'مخصص' }[p]}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <span className="text-navy-400 text-sm">إلى</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <StatCard label="إجمالي المداخيل" value={formatCurrency(report?.totalIncome)} icon={<TrendingUp className="h-5 w-5" />} accent="emerald" />
        <StatCard label="إجمالي المصاريف" value={formatCurrency(report?.totalExpense)} icon={<TrendingDown className="h-5 w-5" />} accent="rose" />
        <StatCard label="الربح الصافي" value={formatCurrency(report?.netProfit)} icon={<Wallet className="h-5 w-5" />} accent="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <h3 className="font-display font-bold text-navy-900 dark:text-white mb-4">تطور المداخيل والمصاريف (آخر 12 شهراً)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B822" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" width={36} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="income" name="مداخيل" stroke="#10B981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="expense" name="مصاريف" stroke="#F43F5E" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-bold text-navy-900 dark:text-white mb-4">المداخيل حسب الفئة</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={incomeBreakdown} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {incomeBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-1">
            <button onClick={() => setListTab('income')} className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${listTab === 'income' ? 'bg-navy-800 text-gold-200 dark:bg-gold-500 dark:text-navy-900' : 'text-navy-500 hover:bg-navy-100/60 dark:text-navy-300'}`}>المداخيل</button>
            <button onClick={() => setListTab('expense')} className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${listTab === 'expense' ? 'bg-navy-800 text-gold-200 dark:bg-gold-500 dark:text-navy-900' : 'text-navy-500 hover:bg-navy-100/60 dark:text-navy-300'}`}>المصاريف</button>
          </div>
        </div>

        {loadingList ? <Spinner /> : (
          <div className="overflow-x-auto mt-3">
            {listTab === 'income' ? (
              incomes.length === 0 ? <EmptyState icon={<Banknote className="h-7 w-7" />} title="لا يوجد مداخيل في هذه الفترة" /> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-navy-100 dark:border-white/10 text-navy-400 text-xs">
                    <th className="text-right font-medium px-5 py-3">الفئة</th>
                    <th className="text-right font-medium px-5 py-3">المبلغ</th>
                    <th className="text-right font-medium px-5 py-3">الوصف</th>
                    <th className="text-right font-medium px-5 py-3">التاريخ</th>
                    <th className="text-left font-medium px-5 py-3"></th>
                  </tr></thead>
                  <tbody>
                    {incomes.map((inc) => (
                      <tr key={inc.id} className="border-b border-navy-50 dark:border-white/5">
                        <td className="px-5 py-3 text-navy-700 dark:text-navy-100">{INCOME_CATEGORY_LABELS[inc.category]}</td>
                        <td className="px-5 py-3 font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(inc.amount)}</td>
                        <td className="px-5 py-3 text-navy-500 dark:text-navy-300">{inc.description || '-'}</td>
                        <td className="px-5 py-3 text-navy-500 dark:text-navy-300">{formatDate(inc.date)}</td>
                        <td className="px-5 py-3 text-left"><button onClick={() => setDeleteTarget({ id: inc.id, type: 'income' })} className="p-1.5 rounded-lg text-navy-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              expenses.length === 0 ? <EmptyState icon={<Banknote className="h-7 w-7" />} title="لا يوجد مصاريف في هذه الفترة" /> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-navy-100 dark:border-white/10 text-navy-400 text-xs">
                    <th className="text-right font-medium px-5 py-3">الفئة</th>
                    <th className="text-right font-medium px-5 py-3">المبلغ</th>
                    <th className="text-right font-medium px-5 py-3">الوصف</th>
                    <th className="text-right font-medium px-5 py-3">التاريخ</th>
                    <th className="text-left font-medium px-5 py-3"></th>
                  </tr></thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-navy-50 dark:border-white/5">
                        <td className="px-5 py-3 text-navy-700 dark:text-navy-100">{EXPENSE_CATEGORY_LABELS[exp.category]}</td>
                        <td className="px-5 py-3 font-mono text-rose-600 dark:text-rose-400">{formatCurrency(exp.amount)}</td>
                        <td className="px-5 py-3 text-navy-500 dark:text-navy-300">{exp.description || '-'}</td>
                        <td className="px-5 py-3 text-navy-500 dark:text-navy-300">{formatDate(exp.date)}</td>
                        <td className="px-5 py-3 text-left"><button onClick={() => setDeleteTarget({ id: exp.id, type: 'expense' })} className="p-1.5 rounded-lg text-navy-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        )}
      </Card>

      <FinanceFormModal open={formOpen} onClose={() => setFormOpen(false)} type={listTab} onSaved={() => { loadReport(); loadLists(); }} />
      <ConfirmDialog open={!!deleteTarget} title="تأكيد الحذف" message="هل تريد حذف هذا السجل المالي بشكل نهائي؟" confirmLabel="حذف" onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}

function FinanceFormModal({ open, onClose, onSaved, type }: { open: boolean; onClose: () => void; onSaved: () => void; type: ListTab }) {
  const { showToast } = useToast();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = type === 'income' ? INCOME_CATEGORY_LABELS : EXPENSE_CATEGORY_LABELS;

  useEffect(() => {
    if (open) {
      setCategory(Object.keys(categories)[0]);
      setAmount(''); setDescription(''); setDate(new Date().toISOString().slice(0, 10)); setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { setError('يرجى إدخال مبلغ صحيح'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { category, amount: Number(amount), description, date };
      if (type === 'income') await financeApi.addIncome(payload as any);
      else await financeApi.addExpense(payload as any);
      showToast('تم الحفظ بنجاح', 'success');
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'تعذر حفظ السجل'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={type === 'income' ? 'إضافة دخل جديد' : 'إضافة مصروف جديد'} size="sm" footer={
      <>
        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button variant="secondary" onClick={handleSubmit} loading={saving}>حفظ</Button>
      </>
    }>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="الفئة" value={category} onChange={(e) => setCategory(e.target.value)}>
          {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input type="number" label="المبلغ (دج)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input label="الوصف (اختياري)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input type="date" label="التاريخ" value={date} onChange={(e) => setDate(e.target.value)} />
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </form>
    </Modal>
  );
}
