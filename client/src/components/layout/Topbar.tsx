import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { subscriptionsApi } from '../../api/resources';

interface TopbarProps {
  onOpenMobile: () => void;
  title?: string;
}

export default function Topbar({ onOpenMobile }: TopbarProps) {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [expiringCount, setExpiringCount] = useState(0);

  useEffect(() => {
    let active = true;
    subscriptionsApi
      .expiring()
      .then((list) => {
        if (active) setExpiringCount(list.length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 glass px-4 py-3 md:px-6 no-print">
      <button onClick={onOpenMobile} className="md:hidden rounded-lg p-2 text-navy-700 dark:text-gold-200 hover:bg-navy-100/60 dark:hover:bg-white/5">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <button
        onClick={() => navigate('/subscriptions')}
        className="relative rounded-lg p-2 text-navy-600 dark:text-gold-200 hover:bg-navy-100/60 dark:hover:bg-white/5"
        title="اشتراكات قاربت على الانتهاء"
      >
        <Bell className="h-5 w-5" />
        {expiringCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white font-mono">
            {expiringCount}
          </span>
        )}
      </button>

      <button onClick={toggleTheme} className="rounded-lg p-2 text-navy-600 dark:text-gold-200 hover:bg-navy-100/60 dark:hover:bg-white/5">
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>

      <button onClick={logout} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-navy-600 dark:text-gold-200 hover:bg-navy-100/60 dark:hover:bg-white/5">
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">تسجيل الخروج</span>
      </button>
    </header>
  );
}
