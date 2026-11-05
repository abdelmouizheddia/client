import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, QrCode, UserCheck, CalendarCheck, Camera, CameraOff, Nfc } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Loader';
import { attendanceApi, membersApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { formatDateTime } from '../utils/format';
import type { Member, AttendanceRecord } from '../types';

type CheckInMode = 'manual' | 'qr' | 'rfid';
type Range = 'daily' | 'weekly' | 'monthly';

const tooltipStyle = {
  background: 'rgba(10,31,68,0.92)',
  border: '1px solid rgba(212,175,55,0.3)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
};

const METHOD_LABELS: Record<string, string> = { manual: 'يدوي', qr: 'مسح QR', rfid: 'RFID' };

export default function Attendance() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<CheckInMode>('manual');

  // وضع يدوي
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Member[]>([]);
  const debouncedSearch = useDebounce(search, 350);
  const [checkingIn, setCheckingIn] = useState(false);

  // وضع QR — الإصلاح: تجهيز العنصر دائماً في DOM قبل بدء المسح
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<any>(null);

  // وضع RFID — يستمع للوحة المفاتيح ويجمع الأحرف حتى يُضغط Enter
  const rfidBufferRef = useRef('');
  const rfidTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [range, setRange] = useState<Range>('weekly');
  const [summary, setSummary] = useState<{ total: number; series: { date: string; count: number }[] } | null>(null);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // ─── بحث يدوي ───────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedSearch) { setOptions([]); return; }
    membersApi.list({ search: debouncedSearch, limit: 6 })
      .then((r) => setOptions(r.data))
      .catch(() => {});
  }, [debouncedSearch]);

  // ─── تحميل الملخص والسجلات ───────────────────────────────────────
  const loadSummary = useCallback(() => {
    attendanceApi.summary(range).then(setSummary).catch(() => {});
  }, [range]);

  const loadRecords = useCallback(() => {
    setLoadingRecords(true);
    attendanceApi.list({ limit: 20 })
      .then((r) => setRecords(r.data))
      .catch(() => {})
      .finally(() => setLoadingRecords(false));
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadRecords(); }, [loadRecords]);

  // ─── دالة تسجيل الحضور المشتركة ─────────────────────────────────
  async function checkIn(
    payload: { memberId?: number; memberCode?: string; rfidTag?: string },
    method: 'manual' | 'qr' | 'rfid' = 'manual'
  ) {
    setCheckingIn(true);
    try {
      await attendanceApi.checkIn({ ...payload, method });
      showToast('تم تسجيل الحضور بنجاح', 'success');
      setSearch('');
      setOptions([]);
      loadSummary();
      loadRecords();
    } catch (err: any) {
      showToast(apiErrorMessage(err, 'تعذر تسجيل الحضور'), 'error');
    } finally {
      setCheckingIn(false);
    }
  }

  // ─── QR Scanner (إجبار استخدام الكاميرا المدمجة للابتوب) ──────────────────
  async function startScanner() {
    setCameraError('');
    // نظهر العنصر أولاً لكي يأخذ أبعاده الطبيعية في شجرة DOM
    setScanning(true);

    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const cameras = await Html5Qrcode.getCameras();
        
        if (!cameras || cameras.length === 0) {
          setCameraError('لا توجد كاميرا متاحة على هذا الجهاز.');
          setScanning(false);
          return;
        }
        
        // 1. البحث الدقيق عن الكاميرا المدمجة للابتوب عبر اسمها البرمجي
        const builtInCamera = cameras.find((c: any) =>
          c.label?.toLowerCase().includes('integrated') ||
          c.label?.toLowerCase().includes('built-in') ||
          c.label?.toLowerCase().includes('internal') ||
          c.label?.toLowerCase().includes('front')
        );

        // 2. إذا وجدها سيستخدمها، وإذا لم يجدها بالاسم سيختار إجبارياً الكاميرا الأولى (التي يضعها النظام ككاميرا أساسية)
        const cameraId = builtInCamera ? builtInCamera.id : cameras[0].id;

        const instance = new Html5Qrcode('qr-reader');
        scannerRef.current = instance;

        // التشغيل
        await instance.start(
          cameraId,
          { fps: 10, qrbox: { width: 230, height: 230 } },
          async (decoded: string) => {
            try { await instance.pause(); } catch { /* ignore */ }
            
            let finalMemberCode = decoded.trim();
            
            // 1. محاولة ترجمة النص ككائن JSON لاستخراج الرمز الصافي
            try {
              const parsedData = JSON.parse(finalMemberCode);
              // إذا كان الكائن يحتوي على كلمة code، استخرجها
              if (parsedData && parsedData.code) {
                finalMemberCode = parsedData.code;
              }
            } catch (e) {
              // إذا لم يكن بصيغة JSON (مثلاً مسح رمز QR عادي بالخطأ)، اتركه كما هو
            }

            // 2. إرسال الرمز الصافي (مثل AZG-00057) إلى الخادم
            try { 
              await checkIn({ memberCode: finalMemberCode }, 'qr'); 
            } catch { /* الخطأ أو النجاح سيعالجه checkIn ويظهر إشعاراً للمستخدم */ }
            
            setTimeout(() => {
              try { instance.resume(); } catch { /* ignore */ }
            }, 1500);
          },
          () => {} // نتجاهل أخطاء عدم العثور على رمز أثناء المسح
        );
      } catch (err: any) {
        setScanning(false); 
        
        const msg = typeof err === 'string' ? err : (err?.message || '');
        
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setCameraError('رُفض الوصول للكاميرا. تأكد من إعطاء الصلاحية في المتصفح ومن إعدادات الخصوصية في Windows.');
        } else if (msg.includes('NotFoundError') || msg.includes('Camera not found') || msg.includes('device not found')) {
          setCameraError('لا توجد كاميرا متاحة أو معرفة على هذا الجهاز.');
        } else if (msg.includes('NotReadableError') || msg.includes('track start')) {
          setCameraError('الكاميرا قيد الاستخدام حالياً من قبل تطبيق آخر (مثل Zoom أو Meet).');
        } else {
          setCameraError(`السبب التقني: ${msg || 'فشل في تهيئة العتاد'}`);
        }
      }
    }, 150); 
  }

  async function stopScanner() {
    try { await scannerRef.current?.stop(); } catch { /* ignore */ }
    try { scannerRef.current?.clear(); } catch { /* ignore */ }
    scannerRef.current = null;
    setScanning(false);
  }

  useEffect(() => {
    if (mode !== 'qr' && scanning) stopScanner();
    if (mode !== 'qr') setCameraError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => () => { if (scannerRef.current) stopScanner(); }, []);

  // ─── RFID Keyboard Listener ───────────────────────────────────────
  useEffect(() => {
    if (mode !== 'rfid') return;

    function handleKeyDown(e: KeyboardEvent) {
      // مُدخَلات لوحة المفاتيح العادية لا تُؤثر (مثلاً Tab، Alt)
      if (e.key === 'Enter' || e.key === '\n') {
        const tag = rfidBufferRef.current.trim();
        rfidBufferRef.current = '';
        if (rfidTimeoutRef.current) clearTimeout(rfidTimeoutRef.current);
        if (tag.length >= 4) {
          checkIn({ rfidTag: tag }, 'rfid');
        }
        return;
      }
      if (e.key.length === 1) {
        // أي حرف واحد مطبوع — نضيفه للمخزن المؤقت
        rfidBufferRef.current += e.key;
        // إذا مضت 300ms دون Enter، نفرض الإرسال (بعض الأجهزة لا ترسل Enter)
        if (rfidTimeoutRef.current) clearTimeout(rfidTimeoutRef.current);
        rfidTimeoutRef.current = setTimeout(() => {
          const tag = rfidBufferRef.current.trim();
          rfidBufferRef.current = '';
          if (tag.length >= 4) checkIn({ rfidTag: tag }, 'rfid');
        }, 300);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rfidTimeoutRef.current) clearTimeout(rfidTimeoutRef.current);
      rfidBufferRef.current = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div>
      <PageHeader title="الحضور" subtitle="تسجيل حضور الأعضاء يدوياً أو عبر QR أو بطاقة RFID" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* بطاقة وضع الإدخال */}
        <Card>
          {/* أزرار الوضع */}
          <div className="flex items-center gap-1 mb-4">
            {([
              { key: 'manual', label: 'يدوي', Icon: UserCheck },
              { key: 'qr', label: 'QR', Icon: QrCode },
              { key: 'rfid', label: 'RFID', Icon: Nfc },
            ] as { key: CheckInMode; label: string; Icon: any }[]).map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setMode(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-colors ${
                  mode === key
                    ? 'bg-navy-800 text-gold-200 dark:bg-gold-500 dark:text-navy-900'
                    : 'text-navy-500 hover:bg-navy-100/60 dark:text-navy-300'
                }`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {/* ─── وضع يدوي ─── */}
          {mode === 'manual' && (
            <div className="relative">
              <Input
                icon={<Search className="h-4 w-4" />}
                placeholder="ابحث بالاسم أو رمز العضوية..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {options.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl border border-navy-100 dark:border-white/10 bg-white dark:bg-navy-900 shadow-card max-h-56 overflow-y-auto">
                  {options.map((m) => (
                    <button key={m.id} disabled={checkingIn}
                      onClick={() => checkIn({ memberId: m.id }, 'manual')}
                      className="w-full text-right px-4 py-2.5 text-sm hover:bg-navy-50 dark:hover:bg-white/5 text-navy-700 dark:text-navy-100 flex items-center gap-2.5">
                      <Avatar src={m.photo} firstName={m.firstName} lastName={m.lastName} size="sm" />
                      <span className="flex-1">{m.firstName} {m.lastName}</span>
                      <span className="font-mono text-xs text-navy-400">{m.memberCode}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-navy-400 dark:text-navy-300/60 mt-3">اختر العضو من القائمة لتسجيل حضوره فوراً.</p>
            </div>
          )}

          {/* ─── وضع QR ─── */}
          {mode === 'qr' && (
            <div className="flex flex-col items-center">
              {/*
                الإصلاح: نُبقي عنصر #qr-reader موجوداً دائماً في DOM لكن نخفيه
                عندما لا يكون المسح نشطاً بـ visibility:hidden + height:0 بدلاً
                من display:none، لأن Html5Qrcode تحتاج العنصر موجوداً ليتمكن
                من تحديد الأبعاد وطلب صلاحية الكاميرا بنجاح.
              */}
              <div
                id="qr-reader"
                className="w-full max-w-xs rounded-xl overflow-hidden bg-navy-900"
                style={{
                  minHeight: scanning ? 260 : 1,
                  visibility: scanning ? 'visible' : 'hidden',
                  height: scanning ? 'auto' : 1,
                }}
              />

              {cameraError && (
                <div className="mt-3 text-center text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 rounded-xl px-4 py-3">
                  {cameraError}
                </div>
              )}

              {!scanning ? (
                <Button variant="secondary" icon={<Camera className="h-4 w-4" />} className="mt-4" onClick={startScanner}>
                  تشغيل الكاميرا
                </Button>
              ) : (
                <Button variant="outline" icon={<CameraOff className="h-4 w-4" />} className="mt-4" onClick={stopScanner}>
                  إيقاف الكاميرا
                </Button>
              )}
              <p className="text-xs text-navy-400 dark:text-navy-300/60 mt-3 text-center">
                وجّه الكاميرا نحو رمز QR الموجود على بطاقة العضو الرقمية
              </p>
            </div>
          )}

          {/* ─── وضع RFID ─── */}
          {mode === 'rfid' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-300">
                <Nfc className="h-9 w-9" />
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-navy-900 dark:text-white">وضع بطاقة RFID نشط</p>
                <p className="text-sm text-navy-500 dark:text-navy-300 mt-1 max-w-xs">
                  مرّر بطاقة العضو على جهاز القارئ — سيتم تسجيل الحضور تلقائياً دون أي نقر إضافي.
                </p>
              </div>
              <div className="text-xs text-navy-400 dark:text-navy-300/60 bg-navy-50 dark:bg-white/5 rounded-xl px-4 py-2 text-center">
                تأكد من أن جهاز RFID متصل بالحاسوب وأن رموز البطاقات مسجَّلة في ملفات الأعضاء.
              </div>
              {checkingIn && <Spinner className="py-2" />}
            </div>
          )}
        </Card>

        {/* بطاقة الملخص */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-navy-900 dark:text-white">ملخص الحضور</h3>
            <div className="flex items-center gap-1">
              {(['daily', 'weekly', 'monthly'] as Range[]).map((r) => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    range === r ? 'bg-navy-800 text-gold-200 dark:bg-gold-500 dark:text-navy-900' : 'text-navy-500 hover:bg-navy-100/60 dark:text-navy-300'
                  }`}>
                  {r === 'daily' ? 'اليوم' : r === 'weekly' ? 'الأسبوع' : 'الشهر'}
                </button>
              ))}
            </div>
          </div>
          <p className="font-mono text-3xl font-bold text-navy-900 dark:text-white mb-3">{summary?.total ?? 0}</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.series || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B822" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" width={28} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* سجل آخر الحضور */}
      <Card padded={false}>
        <div className="p-5 pb-0">
          <h3 className="font-display font-bold text-navy-900 dark:text-white">آخر تسجيلات الحضور</h3>
        </div>
        {loadingRecords ? <Spinner /> : !records.length ? (
          <EmptyState icon={<CalendarCheck className="h-7 w-7" />} title="لا يوجد تسجيلات حضور بعد" />
        ) : (
          <div className="divide-y divide-navy-50 dark:divide-white/5 mt-2">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <Avatar src={r.member?.photo} firstName={r.member?.firstName} lastName={r.member?.lastName} size="sm" />
                  <div>
                    <p className="font-medium text-navy-800 dark:text-white">{r.member?.firstName} {r.member?.lastName}</p>
                    <p className="font-mono text-xs text-navy-400">{r.member?.memberCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-navy-500 dark:text-navy-300 text-xs">{formatDateTime(r.date)}</span>
                  <Badge className="bg-navy-50 text-navy-500 dark:bg-white/5 dark:text-navy-200">
                    {METHOD_LABELS[r.method] || r.method}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
