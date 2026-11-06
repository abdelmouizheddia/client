import client from './client';
import type {
  Member, Sport, Coach, Subscription, AttendanceRecord, FinanceIncome, FinanceExpense,
  Achievement, ArchiveEntry, Settings, Paginated, DashboardStats, DashboardCharts,
  FinanceReport, MonthlyTrendPoint, BackupFile, VirtualCardData, CoachAccount,
} from '../types';

// ----- Auth -----
export const authApi = {
  login: (password: string, username?: string) =>
    client.post('/auth/login', username ? { password, username } : { password }).then((r) => r.data),
  me: () => client.get('/auth/me').then((r) => r.data),
};

// ----- Dashboard -----
export const dashboardApi = {
  stats: () => client.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
  charts: () => client.get<DashboardCharts>('/dashboard/charts').then((r) => r.data),
};

// ----- Sports -----
export const sportsApi = {
  list: () => client.get<Sport[]>('/sports').then((r) => r.data),
  create: (data: Partial<Sport>) => client.post<Sport>('/sports', data).then((r) => r.data),
  update: (id: number, data: Partial<Sport>) => client.put<Sport>(`/sports/${id}`, data).then((r) => r.data),
  remove: (id: number) => client.delete(`/sports/${id}`).then((r) => r.data),
};

// ----- Coaches -----
export const coachesApi = {
  list: () => client.get<Coach[]>('/coaches').then((r) => r.data),
  get: (id: number) => client.get<Coach>(`/coaches/${id}`).then((r) => r.data),
  create: (formData: FormData) => client.post<Coach>('/coaches', formData).then((r) => r.data),
  update: (id: number, formData: FormData) => client.put<Coach>(`/coaches/${id}`, formData).then((r) => r.data),
  remove: (id: number) => client.delete(`/coaches/${id}`).then((r) => r.data),
};

// ----- Members -----
export interface MemberQuery {
  search?: string; sportId?: number; gender?: string; status?: string;
  dateFrom?: string; dateTo?: string; page?: number; limit?: number;
}
export const membersApi = {
  list: (query: MemberQuery = {}) => client.get<Paginated<Member>>('/members', { params: query }).then((r) => r.data),
  get: (id: number) => client.get<Member>(`/members/${id}`).then((r) => r.data),
  create: (formData: FormData) => client.post<Member>('/members', formData).then((r) => r.data),
  update: (id: number, formData: FormData) => client.put<Member>(`/members/${id}`, formData).then((r) => r.data),
  setStatus: (id: number, status: string) => client.patch(`/members/${id}/status`, { status }).then((r) => r.data),
  uploadDocuments: (id: number, formData: FormData) => client.post(`/members/${id}/documents`, formData).then((r) => r.data),
  deleteDocument: (docId: number) => client.delete(`/members/documents/${docId}`).then((r) => r.data),
  archive: (id: number) => client.delete(`/members/${id}`).then((r) => r.data),
  setPortalPassword: (id: number, password: string) =>
    client.post(`/members/${id}/portal-password`, { password }).then((r) => r.data),
};

// ----- Virtual Cards -----
export const cardsApi = {
  get: (id: number) => client.get<VirtualCardData>(`/cards/${id}`).then((r) => r.data),
  lookup: (code: string) => client.get(`/cards/lookup/${code}`).then((r) => r.data),
};

// ----- Subscriptions -----
export const subscriptionsApi = {
  list: (params: any = {}) => client.get<Paginated<Subscription>>('/subscriptions', { params }).then((r) => r.data),
  expiring: () => client.get<Subscription[]>('/subscriptions/alerts/expiring').then((r) => r.data),
  renew: (memberId: number, data: { planType: string; price: number; startFromToday?: boolean }) =>
    client.post(`/subscriptions/${memberId}/renew`, data).then((r) => r.data),
  remove: (id: number) => client.delete(`/subscriptions/${id}`).then((r) => r.data),
};

// ----- Attendance -----
export const attendanceApi = {
  checkIn: (data: { memberId?: number; memberCode?: string; rfidTag?: string; method?: string }) =>
    client.post('/attendance', data).then((r) => r.data),
  list: (params: any = {}) => client.get<Paginated<AttendanceRecord>>('/attendance', { params }).then((r) => r.data),
  summary: (range: string) => client.get('/attendance/summary', { params: { range } }).then((r) => r.data),
  display: () => client.get('/attendance/display').then((r) => r.data),
};

// ----- Finance -----
export const financeApi = {
  income: (params: any = {}) => client.get<Paginated<FinanceIncome>>('/finance/income', { params }).then((r) => r.data),
  addIncome: (data: Partial<FinanceIncome>) => client.post('/finance/income', data).then((r) => r.data),
  removeIncome: (id: number) => client.delete(`/finance/income/${id}`).then((r) => r.data),
  expenses: (params: any = {}) => client.get<Paginated<FinanceExpense>>('/finance/expenses', { params }).then((r) => r.data),
  addExpense: (data: Partial<FinanceExpense>) => client.post('/finance/expenses', data).then((r) => r.data),
  removeExpense: (id: number) => client.delete(`/finance/expenses/${id}`).then((r) => r.data),
  report: (params: any = {}) => client.get<FinanceReport>('/finance/report', { params }).then((r) => r.data),
  monthlyTrend: () => client.get<MonthlyTrendPoint[]>('/finance/monthly-trend').then((r) => r.data),
};

// ----- Achievements -----
export const achievementsApi = {
  list: (params: any = {}) => client.get<Achievement[]>('/achievements', { params }).then((r) => r.data),
  create: (formData: FormData) => client.post('/achievements', formData).then((r) => r.data),
  remove: (id: number) => client.delete(`/achievements/${id}`).then((r) => r.data),
};

// ----- Archive -----
export const archiveApi = {
  list: (params: any = {}) => client.get<Paginated<ArchiveEntry>>('/archive', { params }).then((r) => r.data),
  get: (id: number) => client.get(`/archive/${id}`).then((r) => r.data),
  restore: (id: number) => client.post(`/archive/${id}/restore`).then((r) => r.data),
  remove: (id: number) => client.delete(`/archive/${id}`).then((r) => r.data),
  runAutoArchive: () => client.post('/archive/run-auto-archive').then((r) => r.data),
};

// ----- Settings -----
export const settingsApi = {
  get: () => client.get<Settings>('/settings').then((r) => r.data),
  update: (formData: FormData) => client.put<Settings>('/settings', formData).then((r) => r.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.put('/settings/password', data).then((r) => r.data),
  generateRfidApiKey: () => client.post('/settings/rfid-api-key').then((r) => r.data),
  listBackups: () => client.get<BackupFile[]>('/settings/backups').then((r) => r.data),
  createBackup: () => client.post('/settings/backups').then((r) => r.data),
  restoreBackup: (fileName: string) => client.post(`/settings/backups/${fileName}/restore`).then((r) => r.data),
  deleteBackup: (fileName: string) => client.delete(`/settings/backups/${fileName}`).then((r) => r.data),
};

// ----- Coach Accounts (admin only) -----
export const coachAccountsApi = {
  list: () => client.get<CoachAccount[]>('/coach-accounts').then((r) => r.data),
  create: (data: { username: string; password: string; coachId: number; commissionRate?: number }) =>
    client.post('/coach-accounts', data).then((r) => r.data),
  update: (id: number, data: { password?: string; commissionRate?: number; isActive?: boolean }) =>
    client.put(`/coach-accounts/${id}`, data).then((r) => r.data),
  remove: (id: number) => client.delete(`/coach-accounts/${id}`).then((r) => r.data),
};

// ----- Coach Portal (both coach + admin) -----
export const coachPortalApi = {
  summary: () => client.get('/coach-portal/summary').then((r) => r.data),
};

// ----- Notifications (WhatsApp) -----
export const notificationsApi = {
  whatsappStatus: () => client.get('/notifications/whatsapp/status').then((r) => r.data),
  whatsappInitialize: () => client.post('/notifications/whatsapp/initialize').then((r) => r.data),
  whatsappDisconnect: () => client.post('/notifications/whatsapp/disconnect').then((r) => r.data),
  whatsappTest: (phone: string) => client.post('/notifications/whatsapp/test', { phone }).then((r) => r.data),
  sendMealPlan: (memberId: number) => client.post(`/notifications/meal-plan/${memberId}`).then((r) => r.data),
  sendExpiryReminder: (memberId: number) => client.post(`/notifications/expiry-reminder/${memberId}`).then((r) => r.data),
  logs: (params: any = {}) => client.get('/notifications/logs', { params }).then((r) => r.data),
};

// ----- Reports (return raw JSON for client-side PDF rendering) -----
export const reportsApi = {
  members: (params: any = {}) => client.get('/reports/members', { params }).then((r) => r.data),
  subscriptions: (params: any = {}) => client.get('/reports/subscriptions', { params }).then((r) => r.data),
  attendance: (params: any = {}) => client.get('/reports/attendance', { params }).then((r) => r.data),
  finance: (params: any = {}) => client.get('/reports/finance', { params }).then((r) => r.data),
  coaches: () => client.get('/reports/coaches').then((r) => r.data),
};

// ----- Excel -----
export const excelApi = {
  exportMembers: () => client.get('/excel/export/members', { responseType: 'blob' }).then((r) => r.data as Blob),
  importMembers: (formData: FormData) => client.post('/excel/import/members', formData).then((r) => r.data),
};
