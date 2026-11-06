import { useEffect, useState } from 'react';
import { Activity, LogIn, LogOut, UserPlus, CreditCard, RefreshCw } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { Spinner } from '../components/ui/Loader';
import { formatDateTime } from '../utils/format';
import axios from 'axios';

// الأيقونات حسب نوع الحركة
const getActionIcon = (action: string) => {
  if (action.includes('LOGIN')) return <LogIn className="h-4 w-4 text-[#ddf500]" />;
  if (action.includes('LOGOUT')) return <LogOut className="h-4 w-4 text-rose-500" />;
  if (action.includes('ADD_MEMBER')) return <UserPlus className="h-4 w-4 text-emerald-400" />;
  if (action.includes('SUBSCRIPTION')) return <CreditCard className="h-4 w-4 text-blue-400" />;
  return <Activity className="h-4 w-4 text-gray-400" />;
};

export default function ActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // تأكد أن الرابط يطابق إعدادات الـ axios لديك
      const res = await axios.get('https://azzouz-gym-api.onrender.com/api/activities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) {
      console.error('تعذر جلب النشاطات', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <PageHeader title="مراقبة النشاطات" subtitle="سجل حركات الدخول، الخروج، والتعديلات في النظام" />

      <Card padded={false}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#ddf500]" /> آخر 100 حركة في المنصة
          </h3>
          <button onClick={fetchLogs} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#ddf500] transition">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <Spinner />
          ) : logs.length === 0 ? (
            <p className="text-center text-white/50 py-10">لا توجد نشاطات مسجلة بعد.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#ddf500]/30 transition-colors">
                  <div className="mt-1 p-2 rounded-full bg-black">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white mb-1">{log.details}</p>
                    <div className="flex gap-4 text-xs text-white/50">
                      <span className="bg-black px-2 py-0.5 rounded text-[#ddf500]">
                        {log.user?.firstName || 'الإدارة'}
                      </span>
                      <span>{formatDateTime(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}