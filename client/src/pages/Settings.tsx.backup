import { useEffect, useState, FormEvent, useCallback } from 'react';
import {
  Camera, Save, KeyRound, Sun, Moon, DatabaseBackup,
  Plus, RotateCcw, Trash2, Nfc, Copy, Check, Wifi, WifiOff,
  MessageCircle, Send, Loader2, RefreshCw,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { settingsApi, notificationsApi } from '../api/resources';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatDateTime } from '../utils/format';
import type { BackupFile } from '../types';

// ─── حالة واتساب ───────────────────────────────────────────────
type WaStatus = 'disconnected' | 'initializing' | 'qr' | 'connected' | 'auth_failed';

export default function Settings() {
  const { showToast } = useToast();
  const { refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [clubForm, setClubForm] = useState({
    clubName: '', phone: '', email: '', address: '', whatsappCountryCode: '213',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingClub, setSavingClub] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // RFID
  const [hasRfidKey, setHasRfidKey] = useState(false);
  const [newRfidKey, setNewRfidKey] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  // WhatsApp
  const [waStatus, setWaStatus] = useState<WaStatus>('disconnected');
  const [waQrUrl, setWaQrUrl] = useState<string | null>(null);
  const [waInitializing, setWaInitializing] = useState(false);
  const [waDisconnecting, setWaDisconnecting] = useState(false);
  const [waTestPhone, setWaTestPhone] = useState('');
  const [waSendingTest, setWaSendingTest] = useState(false);
  const [waConfirmDisconnect, setWaConfirmDisconnect] = useState(false);

  // Backups
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // ─── تحميل الإعدادات ────────────────────────────────────────
  useEffect(() => {
    settingsApi.get()
      .then((s) => {
        setClubForm({
          clubName: s.clubName || '',
          phone: s.phone || '',
          email: s.email || '',
          address: s.address || '',
          whatsappCountryCode: s.whatsappCountryCode || '213',
        });
        setLogoPreview(s.logoUrl || null);
        setHasRfidKey(!!s.hasRfidApiKey);
      })
      .catch((err) => showToast(apiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── استطلاع حالة واتساب ─────────────────────────────────────
  const pollWaStatus = useCallback(async () => {
    try {
      const res = await notificationsApi.whatsappStatus();
      setWaStatus(res.status as WaStatus);
      setWaQrUrl(res.qrDataUrl || null);
    } catch { /* تجاهل */ }
  }, []);

  useEffect(() => {
    pollWaStatus();
    const interval = setInterval(pollWaStatus, 4000);
    return () => clearInterval(interval);
  }, [pollWaStatus]);

  // ─── تحميل النسخ الاحتياطية ───────────────────────────────────
  const loadBackups = useCallback(() => {
    setLoadingBackups(true);
    settingsApi.listBackups().then(setBackups).catch(() => {}).finally(() => setLoadingBackups(false));
  }, []);

  useEffect(() => { loadBackups(); }, [loadBackups]);

  // ─── حفظ معلومات النادي ──────────────────────────────────────
  async function handleSaveClub(e: FormEvent) {
    e.preventDefault();
    setSavingClub(true);
    try {
      const fd = new FormData();
      Object.entries(clubForm).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      await settingsApi.update(fd);
      await refreshProfile();
      showToast('تم حفظ معلومات النادي بنجاح', 'success');
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setSavingClub(false);
    }
  }

  // ─── تغيير كلمة المرور ────────────────────────────────────────
  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }
    if (passwordForm.newPassword.length < 4) {
      setPasswordError('كلمة المرور يجب أن تكون 4 خانات على الأقل');
      return;
    }
    setSavingPassword(true);
    try {
      await settingsApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      showToast('تم تحديث كلمة المرور بنجاح', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(apiErrorMessage(err, 'تعذر تحديث كلمة المرور'));
    } finally {
      setSavingPassword(false);
    }
  }

  // ─── توليد مفتاح RFID API ─────────────────────────────────────
  async function handleGenerateRfidKey() {
    setGeneratingKey(true);
    try {
      const res = await settingsApi.generateRfidApiKey();
      setNewRfidKey(res.rfidApiKey);
      setHasRfidKey(true);
      showToast('تم توليد مفتاح API جديد. احتفظ بنسخة منه الآن!', 'info');
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setGeneratingKey(false);
    }
  }

  async function copyKey() {
    await navigator.clipboard.writeText(newRfidKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2500);
  }

  // ─── واتساب ──────────────────────────────────────────────────
  async function handleWaInit() {
    setWaInitializing(true);
    try {
      await notificationsApi.whatsappInitialize();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setWaInitializing(false);
    }
  }

  async function handleWaDisconnect() {
    setWaDisconnecting(true);
    try {
      await notificationsApi.whatsappDisconnect();
      showToast('تم قطع اتصال واتساب', 'success');
      setWaConfirmDisconnect(false);
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setWaDisconnecting(false);
    }
  }

  async function handleWaTest() {
    if (!waTestPhone) { showToast('أدخل رقم الهاتف للاختبار', 'info'); return; }
    setWaSendingTest(true);
    try {
      const res = await notificationsApi.whatsappTest(waTestPhone);
      showToast(res.message, 'success');
    } catch (err) {
      showToast(apiErrorMessage(err, 'تعذر إرسال رسالة الاختبار'), 'error');
    } finally {
      setWaSendingTest(false);
    }
  }

  // ─── نسخ احتياطي ─────────────────────────────────────────────
  async function handleCreateBackup() {
    setCreatingBackup(true);
    try {
      await settingsApi.createBackup();
      showToast('تم إنشاء نسخة احتياطية بنجاح', 'success');
      loadBackups();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    } finally {
      setCreatingBackup(false);
    }
  }

  async function handleRestoreBackup() {
    if (!restoreTarget) return;
    try {
      const res = await settingsApi.restoreBackup(restoreTarget);
      showToast(res.message, 'success');
      setRestoreTarget(null);
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  async function handleDeleteBackup() {
    if (!deleteTarget) return;
    try {
      await settingsApi.deleteBackup(deleteTarget);
      showToast('تم حذف النسخة الاحتياطية', 'success');
      setDeleteTarget(null);
      loadBackups();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  if (loading) return <Spinner />;

  const waStatusInfo: Record<WaStatus, { label: string; color: string; icon: any }> = {
    connected:    { label: 'متصل', color: 'text-emerald-600 dark:text-emerald-400', icon: Wifi },
    qr:           { label: 'في انتظار المسح', color: 'text-gold-600 dark:text-gold-300', icon: RefreshCw },
    initializing: { label: 'جارٍ التهيئة...', color: 'text-navy-400', icon: Loader2 },
    auth_failed:  { label: 'فشل المصادقة', color: 'text-rose-600 dark:text-rose-400', icon: WifiOff },
    disconnected: { label: 'غير متصل', color: 'text-navy-400 dark:text-navy-300/60', icon: WifiOff },
  };

  const wa = waStatusInfo[waStatus] || waStatusInfo.disconnected;
  const WaIcon = wa.icon;

  return (
    <div>
      <PageHeader title="الإعدادات" subtitle="معلومات النادي، كلمة المرور، RFID، واتساب، النسخ الاحتياطي" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* ─── معلومات النادي ─── */}
        <Card>
          <h3 className="font-display font-bold text-navy-900 dark:text-white mb-4">معلومات النادي</h3>
          <form onSubmit={handleSaveClub} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-navy-100 dark:bg-white/10 flex items-center justify-center">
                {logoPreview ? <img src={logoPreview} className="h-full w-full object-cover" alt="" /> : <Camera className="h-5 w-5 text-navy-400" />}
                <label className="absolute inset-0 flex items-center justify-center bg-navy-900/0 hover:bg-navy-900/40 text-transparent hover:text-white text-[10px] cursor-pointer transition-colors">
                  تغيير
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); } }} />
                </label>
              </div>
              <p className="text-xs text-navy-400 dark:text-navy-300/60">شعار النادي (يظهر في الشريط الجانبي)</p>
            </div>
            <Input label="اسم النادي" value={clubForm.clubName} onChange={(e) => setClubForm((f) => ({ ...f, clubName: e.target.value }))} />
            <Input label="الهاتف" value={clubForm.phone} onChange={(e) => setClubForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input type="email" label="البريد الإلكتروني" value={clubForm.email} onChange={(e) => setClubForm((f) => ({ ...f, email: e.target.value }))} />
            <Input label="العنوان" value={clubForm.address} onChange={(e) => setClubForm((f) => ({ ...f, address: e.target.value }))} />
            <Input
              label="رمز الدولة لواتساب (بدون +)"
              value={clubForm.whatsappCountryCode}
              onChange={(e) => setClubForm((f) => ({ ...f, whatsappCountryCode: e.target.value.replace(/\D/g, '') }))}
              placeholder="مثال: 216 تونس | 213 الجزائر | 212 المغرب"
            />
            <Button type="submit" variant="secondary" icon={<Save className="h-4 w-4" />} loading={savingClub}>حفظ التغييرات</Button>
          </form>
        </Card>

        <div className="space-y-4">
          {/* ─── المظهر ─── */}
          <Card>
            <h3 className="font-display font-bold text-navy-900 dark:text-white mb-4">المظهر</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors border ${theme === 'light' ? 'bg-navy-800 text-gold-200 border-navy-800' : 'border-navy-200 text-navy-500 dark:border-white/10 dark:text-navy-300'}`}>
                <Sun className="h-4 w-4" /> فاتح
              </button>
              <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors border ${theme === 'dark' ? 'bg-gold-500 text-navy-900 border-gold-500' : 'border-navy-200 text-navy-500 dark:border-white/10 dark:text-navy-300'}`}>
                <Moon className="h-4 w-4" /> داكن
              </button>
            </div>
          </Card>

          {/* ─── تغيير كلمة المرور ─── */}
          <Card>
            <h3 className="font-display font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> تغيير كلمة المرور
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input type="password" label="كلمة المرور الحالية" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))} />
              <Input type="password" label="كلمة المرور الجديدة" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))} />
              <Input type="password" label="تأكيد كلمة المرور الجديدة" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))} />
              {passwordError && <p className="text-sm text-rose-500">{passwordError}</p>}
              <Button type="submit" variant="secondary" icon={<Save className="h-4 w-4" />} loading={savingPassword}>تحديث كلمة المرور</Button>
            </form>
          </Card>
        </div>
      </div>

      {/* ─── RFID API ─── */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Nfc className="h-4 w-4" /> ربط جهاز Access Area (RFID)
          </h3>
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} loading={generatingKey} onClick={handleGenerateRfidKey}>
            {hasRfidKey ? 'توليد مفتاح جديد' : 'توليد مفتاح API'}
          </Button>
        </div>

        <div className="text-sm text-navy-600 dark:text-navy-200 space-y-2 mb-4">
          <p>لربط جهاز RFID بالمنصة، يُرسل الجهاز طلباً إلى:</p>
          <code className="block bg-navy-50 dark:bg-white/5 rounded-lg px-3 py-2 text-xs font-mono">
            POST https://azzouz-gym-api.onrender.com/api/attendance/rfid-webhook
          </code>
          <p className="text-xs text-navy-400">مع ترويسة <code className="font-mono bg-navy-50 dark:bg-white/5 px-1 rounded">x-api-key: [مفتاح API]</code> وجسم <code className="font-mono bg-navy-50 dark:bg-white/5 px-1 rounded">{`{"rfidTag":"XXXXXXXX"}`}</code></p>
        </div>

        {newRfidKey && (
          <div className="flex items-center gap-2 mt-3 p-3 bg-gold-50 dark:bg-gold-500/10 rounded-xl border border-gold-200/50 dark:border-gold-500/20">
            <code className="flex-1 text-xs font-mono text-navy-700 dark:text-navy-100 break-all">{newRfidKey}</code>
            <button onClick={copyKey} className="shrink-0 p-1.5 rounded-lg hover:bg-gold-100 dark:hover:bg-gold-500/20 text-gold-700 dark:text-gold-300">
              {keyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        )}

        {!newRfidKey && hasRfidKey && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ مفتاح API مُولَّد مسبقاً. لعرضه مجدداً ولّد مفتاحاً جديداً (سيُبطل القديم).</p>
        )}
        {!hasRfidKey && !newRfidKey && (
          <p className="text-xs text-navy-400 dark:text-navy-300/60">لا يوجد مفتاح API بعد. انقر "توليد مفتاح API" لإنشائه.</p>
        )}
      </Card>

      {/* ─── واتساب ─── */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> ربط واتساب للإشعارات التلقائية
          </h3>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${wa.color}`}>
            <WaIcon className={`h-4 w-4 ${waStatus === 'initializing' ? 'animate-spin' : ''}`} />
            {wa.label}
          </div>
        </div>

        {/* رمز QR للربط */}
        {waStatus === 'qr' && waQrUrl && (
          <div className="flex flex-col items-center gap-3 mb-4 p-4 bg-navy-50 dark:bg-white/5 rounded-xl">
            <img src={waQrUrl} className="h-44 w-44 rounded-xl" alt="WhatsApp QR" />
            <p className="text-sm text-navy-600 dark:text-navy-200 text-center">
              افتح واتساب على هاتفك ← الأجهزة المرتبطة ← ربط جهاز ← امسح هذا الرمز
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {waStatus !== 'connected' && (
            <Button
              variant="secondary"
              size="sm"
              icon={waInitializing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              loading={waInitializing}
              onClick={handleWaInit}
            >
              {waStatus === 'qr' ? 'تحديث رمز QR' : 'ربط واتساب'}
            </Button>
          )}
          {waStatus === 'connected' && (
            <Button variant="danger" size="sm" icon={<WifiOff className="h-4 w-4" />} onClick={() => setWaConfirmDisconnect(true)}>
              قطع الاتصال
            </Button>
          )}
        </div>

        {waStatus === 'connected' && (
          <div className="border-t border-navy-100 dark:border-white/10 pt-4">
            <p className="text-sm font-medium text-navy-700 dark:text-navy-100 mb-2">إرسال رسالة تجريبية</p>
            <div className="flex items-center gap-2">
              <Input
                placeholder={`رقم الهاتف مثال: ${clubForm.whatsappCountryCode}20111222`}
                value={waTestPhone}
                onChange={(e) => setWaTestPhone(e.target.value)}
              />
              <Button
                variant="secondary"
                size="md"
                icon={<Send className="h-4 w-4" />}
                loading={waSendingTest}
                onClick={handleWaTest}
              >
                إرسال
              </Button>
            </div>
            <p className="text-xs text-navy-400 dark:text-navy-300/60 mt-2">
              ملاحظة: الإشعارات التلقائية ترسَل فقط للأعضاء الذين فعّلوا هذا الخيار عند التسجيل ولديهم رقم هاتف مسجَّل.
            </p>
          </div>
        )}

        {waStatus === 'disconnected' && (
          <p className="text-xs text-navy-400 dark:text-navy-300/60">
            واتساب غير متصل. لتفعيل الإشعارات التلقائية (تذكير انتهاء الاشتراك وإرسال البرنامج الغذائي للأعضاء الجدد)،
            انقر "ربط واتساب" وامسح رمز QR بهاتفك.
          </p>
        )}
      </Card>

      {/* ─── النسخ الاحتياطي ─── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <DatabaseBackup className="h-4 w-4" /> النسخ الاحتياطي
          </h3>
          <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} loading={creatingBackup} onClick={handleCreateBackup}>
            إنشاء نسخة احتياطية
          </Button>
        </div>
        {loadingBackups ? <Spinner /> : !backups.length ? (
          <EmptyState icon={<DatabaseBackup className="h-7 w-7" />} title="لا توجد نسخ احتياطية"
            description="يتم إنشاء نسخة تلقائية كل يوم في الساعة 03:00 صباحاً، أو يمكنك إنشاء نسخة يدوياً الآن" />
        ) : (
          <div className="divide-y divide-navy-50 dark:divide-white/5">
            {backups.map((b) => (
              <div key={b.fileName} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-mono text-navy-700 dark:text-navy-100 text-xs">{b.fileName}</p>
                  <p className="text-xs text-navy-400 mt-0.5">{formatDateTime(b.createdAt)} &middot; {(b.size / 1024).toFixed(1)} كيلوبايت</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setRestoreTarget(b.fileName)} className="p-1.5 rounded-lg text-navy-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10" title="استعادة"><RotateCcw className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteTarget(b.fileName)} className="p-1.5 rounded-lg text-navy-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" title="حذف"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── Dialogs ─── */}
      <ConfirmDialog open={!!restoreTarget} title="استعادة نسخة احتياطية"
        message="سيتم استبدال قاعدة البيانات الحالية. يُنصح بإعادة تشغيل الخادم بعد الاستعادة. هل تريد المتابعة؟"
        confirmLabel="استعادة" onConfirm={handleRestoreBackup} onClose={() => setRestoreTarget(null)} />
      <ConfirmDialog open={!!deleteTarget} title="حذف النسخة الاحتياطية"
        message="هل تريد حذف هذه النسخة الاحتياطية بشكل نهائي؟"
        confirmLabel="حذف" onConfirm={handleDeleteBackup} onClose={() => setDeleteTarget(null)} />
      <ConfirmDialog open={waConfirmDisconnect} title="قطع اتصال واتساب"
        message="سيتم قطع اتصال الحساب وحذف بيانات الجلسة. ستحتاج لمسح رمز QR من جديد لإعادة الربط."
        confirmLabel="قطع الاتصال" loading={waDisconnecting}
        onConfirm={handleWaDisconnect} onClose={() => setWaConfirmDisconnect(false)} />
    </div>
  );
}
