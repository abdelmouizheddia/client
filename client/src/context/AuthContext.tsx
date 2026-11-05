import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { authApi } from '../api/resources';

export type UserRole = 'admin' | 'coach';

interface AuthState {
  token: string | null;
  role: UserRole;
  clubName: string;
  logoUrl: string | null;
  coachId: number | null;
  coachName: string | null;
  commissionRate: number;
  loading: boolean;
  login: (password: string, username?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const STORE = {
  token: 'bts_token',
  role: 'bts_role',
  clubName: 'bts_club_name',
  logoUrl: 'bts_logo_url',
  coachId: 'bts_coach_id',
  coachName: 'bts_coach_name',
  commissionRate: 'bts_commission_rate',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORE.token));
  const [role, setRole] = useState<UserRole>(() => (localStorage.getItem(STORE.role) as UserRole) || 'admin');
  const [clubName, setClubName] = useState(() => localStorage.getItem(STORE.clubName) || 'AZZOUZ GYM الرياضية');
  const [logoUrl, setLogoUrl] = useState<string | null>(() => localStorage.getItem(STORE.logoUrl));
  const [coachId, setCoachId] = useState<number | null>(() => {
    const v = localStorage.getItem(STORE.coachId);
    return v ? Number(v) : null;
  });
  const [coachName, setCoachName] = useState<string | null>(() => localStorage.getItem(STORE.coachName));
  const [commissionRate, setCommissionRate] = useState<number>(() => Number(localStorage.getItem(STORE.commissionRate) || 500));
  const [loading, setLoading] = useState(false);

  const persist = (data: Partial<{ token: string; role: UserRole; clubName: string; logoUrl: string | null; coachId: number | null; coachName: string | null; commissionRate: number }>) => {
    if (data.token !== undefined) { localStorage.setItem(STORE.token, data.token); setToken(data.token); }
    if (data.role !== undefined) { localStorage.setItem(STORE.role, data.role); setRole(data.role); }
    if (data.clubName !== undefined) { localStorage.setItem(STORE.clubName, data.clubName); setClubName(data.clubName); }
    if (data.logoUrl !== undefined) { if (data.logoUrl) localStorage.setItem(STORE.logoUrl, data.logoUrl); else localStorage.removeItem(STORE.logoUrl); setLogoUrl(data.logoUrl); }
    if (data.coachId !== undefined) { if (data.coachId) localStorage.setItem(STORE.coachId, String(data.coachId)); else localStorage.removeItem(STORE.coachId); setCoachId(data.coachId); }
    if (data.coachName !== undefined) { if (data.coachName) localStorage.setItem(STORE.coachName, data.coachName); else localStorage.removeItem(STORE.coachName); setCoachName(data.coachName); }
    if (data.commissionRate !== undefined) { localStorage.setItem(STORE.commissionRate, String(data.commissionRate)); setCommissionRate(data.commissionRate); }
  };

  const login = useCallback(async (password: string, username?: string) => {
    setLoading(true);
    try {
      const res = await authApi.login(password, username);
      persist({
        token: res.token,
        role: res.role || 'admin',
        clubName: res.clubName || 'AZZOUZ GYM الرياضية',
        logoUrl: res.logoUrl || null,
        coachId: res.coachId || null,
        coachName: res.coachName || null,
        commissionRate: res.commissionRate || 500,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    Object.values(STORE).forEach((k) => localStorage.removeItem(k));
    setToken(null);
    setRole('admin');
    setCoachId(null);
    setCoachName(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.me();
      persist({
        role: res.role || 'admin',
        clubName: res.clubName || clubName,
        logoUrl: res.logoUrl || null,
        coachId: res.coachId || null,
        coachName: res.coachName || null,
        commissionRate: res.commissionRate || 500,
      });
    } catch { /* ignore */ }
  }, [clubName]);

  useEffect(() => {
    if (token) refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, role, clubName, logoUrl, coachId, coachName, commissionRate, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}