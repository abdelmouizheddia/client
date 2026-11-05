const CURRENCY_LABEL = 'دج';

export function formatCurrency(value: number | null | undefined): string {
  const n = Number(value || 0);
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${CURRENCY_LABEL}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return `${formatDate(d)} - ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export function daysUntil(date: string | Date): number {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const GENDER_LABELS: Record<string, string> = { male: 'ذكر', female: 'أنثى' };
export const STATUS_LABELS: Record<string, string> = { active: 'نشط', expired: 'منتهي', suspended: 'موقوف' };
export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  expired: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};
export const PLAN_LABELS: Record<string, string> = { month: 'شهر', '3months': '3 أشهر', '6months': '6 أشهر', year: 'سنة' };
export const INCOME_CATEGORY_LABELS: Record<string, string> = {
  subscriptions: 'اشتراكات',
  privateSessions: 'حصص خاصة',
  tournaments: 'بطولات',
  sales: 'مبيعات',
};
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  coachSalaries: 'رواتب المدربين',
  electricity: 'فواتير الكهرباء',
  maintenance: 'الصيانة',
  equipment: 'المعدات',
  other: 'أخرى',
};
export const ACHIEVEMENT_TYPE_LABELS: Record<string, string> = {
  tournament: 'بطولة',
  medal: 'ميدالية',
  certificate: 'شهادة',
};

export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path;
}

export function initials(firstName?: string, lastName?: string): string {
  return `${(firstName || '?').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
}
