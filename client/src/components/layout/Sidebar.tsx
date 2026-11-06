import { getImageUrl } from '../../api/client';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, CalendarCheck, Wallet, Banknote,
  UserCog, Trophy, FileBarChart2, Archive, Settings, X, Dumbbell, UserCircle, Globe, ExternalLink, Activity 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── عناصر الشريط الجانبي حسب الدور ─────────────────────────────
const ADMIN_NAV = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
  { to: '/members', label: 'الأعضاء', icon: Users },
  { to: '/cards', label: 'البطاقات الرقمية', icon: CreditCard },
  { to: '/attendance', label: 'الحضور', icon: CalendarCheck },
  { to: '/subscriptions', label: 'الاشتراكات', icon: Wallet },
  { to: '/finance', label: 'المالية', icon: Banknote },
  { to: '/coaches', label: 'المدربون', icon: UserCog },
  { to: '/coach-accounts', label: 'حسابات المدربات', icon: UserCircle },
  { to: '/achievements', label: 'الإنجازات', icon: Trophy },
  { to: '/reports', label: 'التقارير', icon: FileBarChart2 },
  { to: '/archive', label: 'الأرشيف', icon: Archive },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
  { to: '/activities', label: 'سجل النشاطات', icon: Activity },
];

const COACH_NAV = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
  { to: '/members', label: 'اللاعبات', icon: Users },
  { to: '/cards', label: 'البطاقات الرقمية', icon: CreditCard },
  { to: '/attendance', label: 'الحضور', icon: CalendarCheck },
  { to: '/subscriptions', label: 'الاشتراكات', icon: Wallet },
  { to: '/achievements', label: 'الإنجازات', icon: Trophy },
  { to: '/coach-portal', label: 'حسابي', icon: UserCircle },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { clubName, logoUrl, role, coachName } = useAuth();
  const isCoach = role === 'coach';
  const NAV_ITEMS = isCoach ? COACH_NAV : ADMIN_NAV;
  const displayName = isCoach ? coachName : clubName;

  const content = (
    <div className="flex h-full flex-col bg-navy-gradient text-white">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 overflow-hidden" style={{ border: '1px solid rgba(221, 245, 0, 0.3)' }}>
          {logoUrl
            ? <img src={getImageUrl(logoUrl) || ''} alt="" className="h-full w-full object-cover" />
            : <Dumbbell className="h-5 w-5 text-[#ddf500]" />}
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-sm leading-tight truncate">{displayName}</p>
          <p className="text-[11px] text-[#ddf500]/80 tracking-wide">
            {isCoach ? 'مدربة — حساب محدود' : 'إدارة النادي الرياضي'}
          </p>
        </div>
        <button onClick={onCloseMobile} className="mr-auto rounded-full p-1.5 text-white/60 hover:bg-white/10 md:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>

      {isCoach && (
        <div className="mx-3 mt-3 rounded-xl bg-[#ddf500]/10 border border-[#ddf500]/20 px-3 py-2">
          <p className="text-[11px] text-[#ddf500]/90 leading-relaxed">
            ⚠️ الوصول مقيَّد: تظهر فقط العضوات (الإناث)
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-white/10 text-[#ddf500] shadow-[inset_3px_0_0_0_#ddf500]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}

        {/* 🔴 زر الموقع الإلكتروني 🔴 */}
        <div className="pt-4 mt-4 border-t border-white/10">
          <a
            href="https://azzouzgym.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 text-white/70 hover:bg-white/10 hover:text-[#ddf500]"
          >
            <Globe className="h-[18px] w-[18px] shrink-0" />
            <span className="font-medium flex-1">الموقع الإلكتروني</span>
            <ExternalLink className="h-[14px] w-[14px] opacity-50" />
          </a>
        </div>
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[11px] text-white/40 leading-relaxed">
          AZZOUZ GYM الرياضية &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex w-64 shrink-0 fixed inset-y-0 right-0 z-30 no-print">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="absolute inset-y-0 right-0 w-72 animate-fade-up">{content}</div>
        </div>
      )}
    </>
  );
}