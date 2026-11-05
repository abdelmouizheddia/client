import { useEffect, useRef, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { attendanceApi, settingsApi } from '../api/resources';
import type { DisplayCheckIn, Settings } from '../types';

// صفحة الشاشة الكبيرة (تيلفزيون القاعة) — عامة لا تحتاج تسجيل دخول
// افتحها على: http://localhost:5173/display

export default function Display() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [checkins, setCheckins] = useState<DisplayCheckIn[]>([]);
  const [latest, setLatest] = useState<DisplayCheckIn | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const lastIdRef = useRef<number | null>(null);
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── ساعة مباشرة ────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ─── جلب إعدادات النادي مرة واحدة ─────────────────────
  useEffect(() => {
    settingsApi.get().then(setSettings).catch(() => {});
  }, []);

  // ─── استطلاع (polling) كل 3 ثوانٍ ──────────────────────
  useEffect(() => {
    async function poll() {
      try {
        const data: DisplayCheckIn[] = await attendanceApi.display();
        setCheckins(data);
        if (data.length > 0 && data[0].id !== lastIdRef.current) {
          lastIdRef.current = data[0].id;
          setLatest(data[0]);
          setShowWelcome(true);
          if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
          welcomeTimerRef.current = setTimeout(() => setShowWelcome(false), 8000);
        }
      } catch { /* تجاهل أخطاء الشبكة */ }
    }
    poll();
    const interval = setInterval(poll, 3000);
    return () => { clearInterval(interval); if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current); };
  }, []);

  const timeStr = currentTime.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(155deg, #0A1F44 0%, #0F2A5C 45%, #061530 100%)',
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
        direction: 'rtl',
      }}
    >
      {/* ─── شريط الذهب العلوي ─────────────────────────────── */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />

      {/* ─── ترويسة ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-4">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} className="h-12 w-12 rounded-xl object-cover" alt="" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-yellow-400/30">
              <Dumbbell className="h-6 w-6 text-yellow-300" />
            </div>
          )}
          <div>
            <p className="font-bold text-white text-lg leading-tight">{settings?.clubName || 'AZZOUZ GYM الرياضية'}</p>
            <p className="text-[11px] text-yellow-300/70 tracking-wide">نظام متابعة الدخول</p>
          </div>
        </div>
        <div className="text-left text-white/80">
          <p className="font-mono text-3xl font-bold text-yellow-300 leading-none">{timeStr}</p>
          <p className="text-xs text-white/50 mt-1 text-left">{dateStr}</p>
        </div>
      </header>

      {/* ─── منطقة الترحيب المركزية ─────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {showWelcome && latest ? (
          <div
            className="flex flex-col items-center gap-4 text-center"
            style={{ animation: 'fadeInScale 0.5s ease-out' }}
          >
            {/* صورة أو حرف أولي */}
            <div className="relative">
              <div className="h-36 w-36 rounded-full overflow-hidden border-4 border-yellow-400 shadow-2xl bg-white/10">
                {latest.memberPhoto ? (
                  <img src={latest.memberPhoto} className="h-full w-full object-cover" alt="" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-yellow-300">
                    {latest.memberName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 border-2 border-white/20">
                <span className="text-white text-lg">✓</span>
              </div>
            </div>

            <div>
              <p className="text-white/60 text-base">مرحباً بك في القاعة</p>
              <p className="text-white font-bold text-4xl mt-1">{latest.memberName}</p>
              {latest.sport && (
                <p className="text-yellow-300 text-xl mt-2">{latest.sport}</p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                latest.method === 'rfid' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                latest.method === 'qr'   ? 'bg-gold-500/20 text-yellow-300 border border-yellow-400/30' :
                'bg-white/10 text-white/70 border border-white/20'
              }`}>
                {latest.method === 'rfid' ? 'RFID' : latest.method === 'qr' ? 'QR' : 'يدوي'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center opacity-40">
            <div className="h-24 w-24 rounded-full border-2 border-white/20 flex items-center justify-center">
              <Dumbbell className="h-10 w-10 text-white/40" />
            </div>
            <p className="text-white text-xl font-medium">في انتظار تسجيل الدخول...</p>
            <p className="text-white/40 text-sm">مرّر بطاقة RFID أو امسح رمز QR على المنصة</p>
          </div>
        )}
      </main>

      {/* ─── شريط آخر الداخلين ──────────────────────────────── */}
      {checkins.length > 0 && (
        <footer className="px-6 pb-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-white/40 text-xs mb-3 font-medium">آخر الداخلين إلى القاعة</p>
            <div className="flex items-center gap-3 overflow-x-auto">
              {checkins.slice(0, 6).map((c, idx) => (
                <div key={c.id} className={`flex items-center gap-2 shrink-0 bg-white/5 rounded-xl px-3 py-2 border ${idx === 0 ? 'border-yellow-400/40' : 'border-white/5'}`}>
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-white/10 shrink-0">
                    {c.memberPhoto ? (
                      <img src={c.memberPhoto} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-white/70 font-bold text-sm">
                        {c.memberName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium leading-tight">{c.memberName}</p>
                    {c.sport && <p className="text-white/40 text-[10px]">{c.sport}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </footer>
      )}

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
