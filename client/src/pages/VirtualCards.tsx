
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, Printer, Image as ImageIcon, Dumbbell, CreditCard as CardIcon, Upload } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Loader';
import { membersApi, cardsApi, settingsApi } from '../api/resources';
import { apiErrorMessage, getImageUrl } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { STATUS_LABELS, STATUS_COLORS, PLAN_LABELS, formatDate } from '../utils/format';
import { exportElementToPdf, exportElementToPng } from '../utils/pdfExport';
import type { Member, VirtualCardData } from '../types';

export default function VirtualCards() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const cardRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Member[]>([]);
  const debouncedSearch = useDebounce(search, 350);

  const [card, setCard] = useState<VirtualCardData | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [exporting, setExporting] = useState(false);

  // رفع خلفية مخصصة للبطاقة
  const [bgUploading, setBgUploading] = useState(false);
  const [localBg, setLocalBg] = useState<string | null>(null);

  useEffect(() => {
    if (!debouncedSearch) {
      setOptions([]);
      return;
    }

    membersApi.list({ search: debouncedSearch, limit: 6 })
      .then((r) => setOptions(r.data))
      .catch(() => {});
  }, [debouncedSearch]);

  useEffect(() => {
    const memberId = searchParams.get('memberId');
    if (memberId) loadCard(Number(memberId));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadCard(id: number) {
    setLoadingCard(true);

    cardsApi.get(id)
      .then((data) => {
        setCard(data);
        setLocalBg(null);
      })
      .catch((err) => showToast(apiErrorMessage(err), 'error'))
      .finally(() => setLoadingCard(false));
  }

  async function handleExportPdf() {
    if (!cardRef.current || !card) return;

    setExporting(true);

    try {
      await exportElementToPdf(
        cardRef.current,
        `card-${card.memberCode}.pdf`
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPng() {
    if (!cardRef.current || !card) return;

    setExporting(true);

    try {
      await exportElementToPng(
        cardRef.current,
        `card-${card.memberCode}.png`
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setLocalBg(preview);
    setBgUploading(true);

    try {
      const fd = new FormData();

      fd.append('cardBackground', file);
      fd.append('clubName', card?.clubName || '');

      const updatedSettings = await settingsApi.update(fd);

      // نعتمد رابط الخادم المحفوظ، وليس رابط المعاينة المؤقت
      setLocalBg(null);

      if (card) {
        setCard((prev) =>
          prev
            ? {
                ...prev,
                cardBackgroundUrl: updatedSettings.cardBackgroundUrl || prev.cardBackgroundUrl,
                logoUrl: updatedSettings.logoUrl || prev.logoUrl,
              }
            : prev
        );
      }

      showToast('تم حفظ خلفية البطاقة بنجاح', 'success');
    } catch (err) {
      setLocalBg(null);
      showToast(apiErrorMessage(err, 'تعذر رفع الخلفية'), 'error');
    } finally {
      URL.revokeObjectURL(preview);
      setBgUploading(false);
      e.target.value = '';
    }
  }

  const activeBg = getImageUrl(
    localBg || card?.cardBackgroundUrl
  );

  const activeLogo = getImageUrl(card?.logoUrl);

  return (
    <div>
      <PageHeader
        title="البطاقات الرقمية"
        subtitle="بحث عن عضو لعرض بطاقته الرقمية وتصديرها أو طباعتها"
        actions={
          <label className="inline-flex">
            <Button
              variant="outline"
              size="sm"
              icon={<Upload className="h-4 w-4" />}
              loading={bgUploading}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                (e.currentTarget.nextElementSibling as HTMLInputElement)?.click();
              }}
            >
              تغيير خلفية البطاقة
            </Button>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBgUpload}
            />
          </label>
        }
      />

      <Card className="mb-6 relative">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="ابحث بالاسم أو رمز العضوية..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {options.length > 0 && (
          <div className="absolute z-10 left-5 right-5 mt-1 rounded-xl border border-navy-100 dark:border-white/10 bg-white dark:bg-navy-900 shadow-card max-h-56 overflow-y-auto">
            {options.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  loadCard(m.id);
                  setSearch('');
                  setOptions([]);
                }}
                className="w-full text-right px-4 py-2.5 text-sm hover:bg-navy-50 dark:hover:bg-white/5 text-navy-700 dark:text-navy-100 flex items-center justify-between"
              >
                <span>{m.firstName} {m.lastName}</span>
                <span className="font-mono text-xs text-navy-400">
                  {m.memberCode}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {loadingCard && <Spinner />}

      {!loadingCard && !card && (
        <EmptyState
          icon={<CardIcon className="h-7 w-7" />}
          title="ابحث عن عضو لعرض بطاقته"
          description="استخدم خانة البحث أعلاه لإيجاد العضو وعرض بطاقته الرقمية"
        />
      )}

      {!loadingCard && card && (
        <div className="flex flex-col items-center gap-6">

          {/* ─── البطاقة الرقمية ─── */}
          <div
            ref={cardRef}
            className="relative w-full max-w-[420px] rounded-2xl overflow-hidden shadow-card"
            style={{
              fontFamily: "'Cairo', sans-serif",
              aspectRatio: '1.62 / 1',
              background: activeBg
                ? `url("${activeBg}") center/cover no-repeat`
                : 'linear-gradient(155deg, #0A1F44 0%, #0F2A5C 45%, #061530 100%)',
            }}
          >
            {/* طبقة شفافة لضمان قراءة النص على الخلفيات الفاتحة */}
            <div className="absolute inset-0 bg-navy-950/40" />

            {/* خط الذهب العلوي */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{
                background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
              }}
            />

            <div className="relative h-full flex flex-col p-5 text-white">

              {/* ترويسة النادي */}
              <div className="flex items-center gap-2 mb-3">
                {activeLogo ? (
                  <img
                    src={activeLogo}
                    className="h-8 w-8 rounded-lg object-cover"
                    alt=""
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-yellow-400/30">
                    <Dumbbell className="h-4 w-4 text-yellow-300" />
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold tracking-wide text-yellow-200">
                    {card.clubName || 'AZZOUZ GYM الرياضية'}
                  </p>
                  <p className="text-[9px] text-white/40">
                    بطاقة عضوية رقمية
                  </p>
                </div>
              </div>

              {/* معلومات العضو */}
              <div className="flex items-center gap-3 flex-1">
                <div className="h-[72px] w-[72px] rounded-xl overflow-hidden border-2 border-yellow-400/50 bg-white/10 shrink-0">
                  {card.photo ? (
                    <img
                      src={getImageUrl(card.photo) || ''}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-yellow-300 font-bold text-xl">
                      {card.fullName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-bold text-sm leading-tight text-white">
                    {card.fullName}
                  </p>

                  <p className="font-mono text-[11px] text-yellow-300">
                    {card.memberCode}
                  </p>

                  <div className="text-[10px] text-white/70 mt-0.5">
                    <span className="text-white/40">تاريخ الميلاد: </span>
                    {formatDate(card.birthDate)}
                  </div>

                  {card.sport && (
                    <div className="text-[10px] text-white/70">
                      <span className="text-white/40">مسجَّل في: </span>
                      {card.sport}
                    </div>
                  )}

                  {card.planType && (
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-200 mt-1">
                      {PLAN_LABELS[card.planType]}
                    </span>
                  )}
                </div>

                {/* رمز QR */}
                <div className="bg-white p-1 rounded-lg shrink-0">
                  <img
                    src={card.qrDataUrl}
                    className="h-[64px] w-[64px]"
                    alt="QR"
                  />
                </div>
              </div>

              {/* تذييل */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10 text-[10px] text-white/50">
                <span>
                  صلاحية حتى:{' '}
                  <span className="font-mono text-white/80">
                    {formatDate(card.subscriptionEndDate)}
                  </span>
                </span>

                <Badge className={STATUS_COLORS[card.status] + ' !text-[9px] !px-2 !py-0.5'}>
                  {STATUS_LABELS[card.status]}
                </Badge>
              </div>
            </div>
          </div>

          {/* أزرار التصدير */}
          <div className="flex flex-wrap items-center justify-center gap-2 no-print">
            <Button
              variant="outline"
              icon={<Download className="h-4 w-4" />}
              loading={exporting}
              onClick={handleExportPdf}
            >
              تصدير PDF
            </Button>

            <Button
              variant="outline"
              icon={<ImageIcon className="h-4 w-4" />}
              loading={exporting}
              onClick={handleExportPng}
            >
              تصدير صورة
            </Button>

            <Button
              variant="secondary"
              icon={<Printer className="h-4 w-4" />}
              onClick={() => window.print()}
            >
              طباعة
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
