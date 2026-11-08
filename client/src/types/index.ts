export type Gender = 'male' | 'female';
export type MemberStatus = 'active' | 'expired' | 'suspended';
export type PlanType = 'month' | '3months' | '6months' | 'year';
export type AttendanceMethod = 'manual' | 'qr' | 'rfid';
export type IncomeCategory = 'subscriptions' | 'privateSessions' | 'tournaments' | 'sales';
export type ExpenseCategory = 'coachSalaries' | 'electricity' | 'maintenance' | 'equipment' | 'other';
export type AchievementType = 'tournament' | 'medal' | 'certificate';

export interface Sport { id: number; name: string; icon?: string | null; color?: string | null; _count?: { members: number }; }
export interface Coach {
  id: number; firstName: string; lastName: string; photo?: string | null;
  specialty?: string | null; phone?: string | null; salary: number; schedule?: string | null;
  _count?: { members: number };
  members?: { id: number; firstName: string; lastName: string; status: MemberStatus; photo?: string | null }[];
}
export interface Subscription {
  id: number; memberId: number; planType: PlanType; planLabel?: string; price: number;
  startDate: string; endDate: string; status: 'active' | 'expired'; daysLeft?: number;
  member?: Pick<Member, 'id' | 'firstName' | 'lastName' | 'memberCode' | 'photo' | 'phone'>;
}
export interface DocumentFile { id: number; memberId: number; fileUrl: string; fileType: 'image' | 'pdf'; label?: string | null; createdAt: string; }
export interface Achievement {
  id: number; memberId: number; title: string; type: AchievementType;
  date?: string | null; fileUrl?: string | null; description?: string | null;
  member?: Pick<Member, 'firstName' | 'lastName' | 'memberCode' | 'photo'>;
}
export interface AttendanceRecord {
  id: number; memberId: number; date: string; method: AttendanceMethod;
  member?: Pick<Member, 'firstName' | 'lastName' | 'memberCode' | 'photo'>;
}
export interface Member {
  id: number; memberCode: string; firstName: string; lastName: string; photo?: string | null;
  birthDate: string; age?: number; gender: Gender; phone?: string | null; email?: string | null;
  address?: string | null; sportId?: number | null; sport?: Sport | null;
  coachId?: number | null; coach?: Coach | null;
  registrationDate: string; status: MemberStatus; coachNotes?: string | null;
  isArchived: boolean; currentPlan?: PlanType | null; subscriptionEndDate?: string | null;
  rfidTag?: string | null;        // رمز بطاقة RFID
  notificationsOptIn?: boolean;   // موافقة على إشعارات واتساب
  documents?: DocumentFile[]; subscriptions?: Subscription[];
  attendances?: AttendanceRecord[]; achievements?: Achievement[];
  createdAt: string; updatedAt: string;
}
export interface FinanceIncome { id: number; category: IncomeCategory; amount: number; description?: string | null; date: string; }
export interface FinanceExpense { id: number; category: ExpenseCategory; amount: number; description?: string | null; date: string; }
export interface ArchiveEntry { id: number; memberCode: string; fullName: string; reason: string; archivedAt: string; photo?: string | null; sport?: string | null; phone?: string | null; }
export interface Settings {
  id: number; clubName: string; logoUrl?: string | null; phone?: string | null;
  email?: string | null; address?: string | null; theme: 'light' | 'dark';
  cardBackgroundUrl?: string | null; // خلفية مخصصة للبطاقة الرقمية
  hasRfidApiKey?: boolean;           // هل مفتاح RFID مُولَّد؟
  whatsappCountryCode?: string;      // رمز الدولة (216 = تونس، 213 = الجزائر...)
  updatedAt: string;
}
export interface Paginated<T> { data: T[]; total: number; page: number; totalPages: number; }
export interface DashboardStats {
  activeMembers: number; expiredMembers: number; expiringSoonCount: number;
  incomeThisMonth: number; incomeThisYear: number; growthPercent: number;
  maleCount: number; femaleCount: number; totalMembers: number;
  isCoachView?: boolean;
  birthdaysThisMonth: { id: number; firstName: string; lastName: string; birthDate: string; photo?: string | null; phone?: string | null; day: number }[];
}
export interface DashboardCharts {
  sportDistribution: { name: string; value: number }[];
  ageDistribution: { range: string; value: number }[];
  weeklyNewMembers: { label: string; count: number }[];
  monthlyRevenue: { label: string; value: number }[];
}
export interface FinanceReport {
  period: string; totalIncome: number; totalExpense: number; netProfit: number;
  incomeByCategory: Record<string, number>; expenseByCategory: Record<string, number>;
  incomeCount: number; expenseCount: number;
}
export interface MonthlyTrendPoint { label: string; income: number; expense: number; net: number; }
export interface BackupFile { fileName: string; size: number; createdAt: string; }
export interface VirtualCardData {
  id: number; memberCode: string; fullName: string; photo?: string | null;
  birthDate?: string | null; sport?: string | null; planType?: PlanType | null;
  subscriptionEndDate?: string | null; status: MemberStatus; qrDataUrl: string;
  clubName?: string; cardBackgroundUrl?: string | null; logoUrl?: string | null;
}
export interface CoachAccount {
  id: number;
  username: string;
  coachId: number;
  isActive: boolean;
  commissionRate: number;
  coach?: { id: number; firstName: string; lastName: string; photo?: string | null; specialty?: string | null };
  currentMonthSalary?: number;
  activeFemaleMembersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoachPortalSummary {
  role: 'coach';
  coachName: string;
  coachPhoto?: string | null;
  specialty?: string | null;
  phone?: string | null;
  username: string;
  commissionRate: number;
  activeFemaleCount: number;
  newThisMonth: number;
  currentMonthSalary: number;
  monthlyHistory: { month: string; newSubscriptions: number; earnings: number }[];
}

export interface AdminPortalSummary {
  role: 'admin';
  coachSummaries: {
    id: number; username: string; coachName: string; coachPhoto?: string | null;
    specialty?: string | null; isActive: boolean; commissionRate: number;
    activeFemaleCount: number; monthlyEarnings: number;
  }[];
  totalFemaleMembers: number;
}

export interface DisplayCheckIn {
  id: number; date: string; method: AttendanceMethod;
  memberName: string; memberPhoto?: string | null; sport?: string | null;
}
