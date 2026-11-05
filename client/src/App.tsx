import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MembersList from './pages/Members/MembersList';
import MemberProfile from './pages/Members/MemberProfile';
import VirtualCards from './pages/VirtualCards';
import Attendance from './pages/Attendance';
import Subscriptions from './pages/Subscriptions';
import Finance from './pages/Finance';
import Coaches from './pages/Coaches';
import CoachAccounts from './pages/CoachAccounts';
import CoachPortal from './pages/CoachPortal';
import Achievements from './pages/Achievements';
import Reports from './pages/Reports';
import ArchivePage from './pages/Archive';
import SettingsPage from './pages/Settings';
import Display from './pages/Display';

// صفحة 404 داخل الـ layout مع إعادة توجيه للوحة التحكم
function NotFound() { return <Navigate to="/" replace />; }

// حماية للصفحات المخصصة للمسؤول فقط
function AdminRoute({ children }: { children: JSX.Element }) {
  const { role } = useAuth();
  if (role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* ─── صفحة عامة: شاشة القاعة (تيلفزيون) ─── */}
              <Route path="/display" element={<Display />} />

              {/* ─── تسجيل الدخول ─── */}
              <Route path="/login" element={<Login />} />

              {/* ─── الصفحات المحمية ─── */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* مشتركة بين المسؤول والمدربة */}
                <Route index element={<Dashboard />} />
                <Route path="members" element={<MembersList />} />
                <Route path="members/:id" element={<MemberProfile />} />
                <Route path="cards" element={<VirtualCards />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="achievements" element={<Achievements />} />

                {/* صفحة "حسابي" — تعرض محتوى مختلف حسب الدور */}
                <Route path="coach-portal" element={<CoachPortal />} />

                {/* للمسؤول فقط */}
                <Route path="finance" element={<AdminRoute><Finance /></AdminRoute>} />
                <Route path="coaches" element={<AdminRoute><Coaches /></AdminRoute>} />
                <Route path="coach-accounts" element={<AdminRoute><CoachAccounts /></AdminRoute>} />
                <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />
                <Route path="archive" element={<AdminRoute><ArchivePage /></AdminRoute>} />
                <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
