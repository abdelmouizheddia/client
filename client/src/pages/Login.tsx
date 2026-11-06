import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ShieldCheck, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';

type LoginMode = 'admin' | 'coach';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(password, mode === 'coach' ? username : undefined);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, mode === 'coach' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'كلمة المرور غير صحيحة'));
    }
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center relative bg-cover bg-center bg-no-repeat font-sans" dir="rtl"
      style={{ backgroundImage: "url('/bg-login.jpg')" }}
    >
      {/* طبقة تظليل لضمان وضوح البطاقة فوق أي صورة خلفية */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>

      {/* بطاقة تسجيل الدخول (تصميم Glassmorphism) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4 p-8 bg-white/80 dark:bg-[#161616]/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/40 dark:border-white/10"
      >
        
        {/* اللوجو العلوي */}
        <div className="mx-auto w-20 h-20 bg-white dark:bg-white/5 rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-gray-100 dark:border-white/10 overflow-hidden">
          <img src="/logo.png" alt="AZZOUZ GYM" className="w-full h-full object-contain p-2" />
        </div>

        {/* العناوين */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
            تسجيل الدخول
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            أدخل بياناتك للوصول إلى نظام الإدارة الرياضية
          </p>
        </div>

        {/* أزرار التبديل بين مسؤول ومدرب */}
        <div className="flex p-1.5 bg-gray-200/50 dark:bg-black/50 rounded-xl mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => { setMode('admin'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
              mode === 'admin'
                ? 'bg-white dark:bg-[#ddf500] text-gray-900 dark:text-black shadow-md scale-[1.02]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            مسؤول القاعة
          </button>
          <button
            type="button"
            onClick={() => { setMode('coach'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
              mode === 'coach'
                ? 'bg-white dark:bg-[#ddf500] text-gray-900 dark:text-black shadow-md scale-[1.02]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <UserCog className="w-4 h-4" />
            حساب مدرب
          </button>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'coach' && (
            <div className="relative group flex items-center w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden focus-within:border-[#ddf500] focus-within:ring-1 focus-within:ring-[#ddf500] transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 text-gray-400 group-focus-within:text-[#ddf500] transition-colors">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 w-full h-12 bg-transparent pr-2 pl-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none font-medium"
                autoFocus
                required
              />
            </div>
          )}

          <div className="relative group flex items-center w-full bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden focus-within:border-[#ddf500] focus-within:ring-1 focus-within:ring-[#ddf500] transition-all duration-300">
            <div className="flex items-center justify-center w-12 h-12 text-gray-400 group-focus-within:text-[#ddf500] transition-colors">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 w-full h-12 bg-transparent pr-2 pl-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none font-medium"
              autoFocus={mode === 'admin'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="flex items-center justify-center h-12 px-3 text-gray-400 hover:text-[#ddf500] transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20 text-center font-medium"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-gray-900 dark:bg-[#ddf500] hover:bg-gray-800 dark:hover:bg-[#c4d900] text-white dark:text-black font-extrabold text-lg rounded-xl transition-all flex items-center justify-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(221,245,0,0.15)] dark:hover:shadow-[0_0_25px_rgba(221,245,0,0.3)] active:scale-[0.98]"
          >
            {loading ? (
              <span className="w-6 h-6 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        <p className="text-center text-[11px] font-medium text-gray-400 dark:text-white/30 tracking-widest pt-8 uppercase">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} AZZOUZ GYM
        </p>
      </motion.div>
    </div>
  );
}