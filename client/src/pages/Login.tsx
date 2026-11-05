import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Dumbbell } from 'lucide-react';
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
    <main className="flex min-h-screen w-full bg-[#0A0F1C] selection:bg-[#D4AF37]/30 p-2 lg:p-4 transition-all duration-500 lg:h-screen lg:overflow-hidden font-sans" dir="rtl">
      
      {/* ─── القسم الأيمن: الفيديو التعريفي (يظهر في الشاشات الكبيرة فقط) ─── */}
      <div className="relative hidden lg:flex flex-col items-start justify-end w-[52%] pb-20 px-12 rounded-[2rem] overflow-hidden shadow-2xl h-full border border-white/5">
        {/* فيديو الخلفية بدون فلاتر */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4" type="video/mp4" />
        </video>

        {/* صندوق النصوص فوق الفيديو (تأثير الزجاج الفاخر Glassmorphism) */}
        <motion.div 
          className="z-10 w-full max-w-lg space-y-6 bg-white/[0.02] p-10 rounded-[2.5rem] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
          }}
        >
          <motion.div variants={fadeUpVariant} className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#D4AF37]/30 to-transparent rounded-2xl border border-[#D4AF37]/20 backdrop-blur-md">
              <Dumbbell className="h-8 w-8 text-[#D4AF37]" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg">AZZOUZ GYM</span>
          </motion.div>
          
          <motion.div variants={fadeUpVariant} className="space-y-3 border-t border-white/10 pt-6 mt-6">
            <h1 className="text-2xl font-bold text-white drop-shadow-md">نظام الإدارة الرياضية</h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              تحكم كامل في إحصائيات القاعة، إدارة الاشتراكات، ومتابعة المدربين بكل سهولة واحترافية من مكان واحد.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* ─── القسم الأيسر: نموذج تسجيل الدخول ─── */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden relative z-10">
        
        {/* إضاءة خلفية ناعمة (Glow) خلف النموذج لكسر جمود اللون الداكن */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[420px] space-y-8"
        >
          
          {/* الشعار والهيدر */}
          <div className="flex flex-col items-center text-center space-y-4 mb-4">
            {/* الشعار مع تأثير الإضاءة */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 shadow-[0_0_40px_rgba(212,175,55,0.1)] p-3 backdrop-blur-sm">
              <img src="/logo.png" alt="AZZOUZ GYM" className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(212,175,55,0.4)]" />
            </div>
            
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">تسجيل الدخول</h2>
              <p className="text-white/50 text-sm">
                {mode === 'admin' ? 'أدخل بيانات المسؤول للوصول إلى لوحة التحكم' : 'أدخل بيانات حسابك كمدرب للمتابعة'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* أزرار التبديل بين المسؤول والمدرب */}
            <RoleToggle mode={mode} setMode={setMode} setError={setError} />

            <div className="space-y-5">
              {/* حقل اسم المستخدم (يظهر للمدرب فقط) */}
              {mode === 'coach' && (
                <InputGroup 
                  icon={<User className="h-5 w-5" />}
                  type="text"
                  placeholder="اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              )}

              {/* حقل كلمة المرور */}
              <InputGroup 
                icon={<Lock className="h-5 w-5" />}
                type={showPassword ? 'text' : 'password'}
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus={mode === 'admin'}
                actionButton={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="p-2 text-white/30 hover:text-[#D4AF37] hover:bg-white/5 rounded-lg transition-all duration-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-center"
              >
                <p className="text-sm font-semibold text-red-400">{error}</p>
              </motion.div>
            )}

            {/* زر الدخول (بتدرج لوني ذهبي فاخر) */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 relative group overflow-hidden rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.35)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] bg-[length:200%_auto] group-hover:bg-right transition-all duration-500" />
              <div className="relative flex items-center justify-center h-full w-full text-[#0A0F1C] font-extrabold text-lg active:scale-[0.98] transition-transform">
                {loading ? (
                  <div className="h-6 w-6 border-2 border-[#0A0F1C] border-t-transparent rounded-full animate-spin" />
                ) : (
                  'تسجيل الدخول'
                )}
              </div>
            </button>
          </form>
          
          <p className="text-center text-[11px] font-medium text-white/20 tracking-widest pt-6 uppercase">
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} AZZOUZ GYM
          </p>
        </motion.div>
      </div>
    </main>
  );
}

// ─── إعدادات الحركة (Framer Motion) ───
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

// ─── المكونات القابلة لإعادة الاستخدام (Reusable Components) ───

function RoleToggle({ mode, setMode, setError }: { mode: LoginMode, setMode: (m: LoginMode) => void, setError: (e: string) => void }) {
  return (
    <div className="flex bg-[#0A0F1C] p-1.5 rounded-2xl w-full mb-8 border border-white/10 shadow-inner">
      <button
        type="button"
        onClick={() => { setMode('admin'); setError(''); }}
        className={`w-1/2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
          mode === 'admin' 
            ? 'bg-[#D4AF37] text-[#0A0F1C] shadow-[0_4px_12px_rgba(212,175,55,0.3)] scale-[1.02]' 
            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
        }`}
      >
        مسؤول القاعة
      </button>
      <button
        type="button"
        onClick={() => { setMode('coach'); setError(''); }}
        className={`w-1/2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
          mode === 'coach' 
            ? 'bg-[#D4AF37] text-[#0A0F1C] shadow-[0_4px_12px_rgba(212,175,55,0.3)] scale-[1.02]' 
            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
        }`}
      >
        حساب مدرب
      </button>
    </div>
  );
}

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  actionButton?: React.ReactNode;
}

function InputGroup({ icon, actionButton, ...props }: InputGroupProps) {
  return (
    <div className="relative group flex items-center w-full bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden focus-within:border-[#D4AF37]/60 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)] focus-within:bg-white/[0.04] transition-all duration-300">
      
      {/* ─── مربع الأيقونة (يمين) ─── */}
      <div className="flex items-center justify-center w-14 h-14 bg-white/[0.03] border-l border-white/5 text-white/30 group-focus-within:text-[#0A0F1C] group-focus-within:bg-[#D4AF37] transition-all duration-300 shrink-0">
        {icon}
      </div>

      {/* ─── حقل الكتابة ─── */}
      <input
        {...props}
        className="flex-1 w-full h-14 bg-transparent px-4 text-white placeholder:text-white/30 focus:outline-none"
      />

      {/* ─── زر الإجراء الإضافي (مثل العين - يسار) ─── */}
      {actionButton && (
        <div className="flex items-center justify-center h-14 px-2 shrink-0">
          {actionButton}
        </div>
      )}
    </div>
  );

}