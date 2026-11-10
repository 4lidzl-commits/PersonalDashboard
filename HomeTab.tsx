"use client";

import { motion } from "framer-motion";
import {
  Banknote,
  ChevronRight,
  CloudOff,
  Droplets,
  Gauge,
  HardHat,
  ListChecks,
  MapPin,
  Moon,
  Navigation2,
  Quote,
  RefreshCw,
  Settings as SettingsIcon,
  SunMedium,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  jget,
  type FocusSession,
  type Task,
  type Tx,
  type WorkDay,
  type WxData,
} from "@/lib/api";
import {
  buzz,
  fmtNumber,
  fmtTRY,
  fullDateTR,
  greetingTR,
  monthKey,
  todayISO,
} from "@/lib/format";
import { quoteOfDay } from "@/lib/quotes";
import { wxIcon, wxTheme } from "@/lib/wx";
import { mask, usePrivacy, useSettings, useTabNav } from "../AppShell";
import LiveClock, {
  CLOCK_STYLES,
  isClockStyle,
  nextClockStyle,
  type ClockStyle,
} from "../LiveClock";
import LocationPicker, { type PickedPlace } from "../LocationPicker";
import {
  Card,
  CircleBtn,
  IconBadge,
  IOSButton,
  List,
  Screen,
  Sheet,
  SheetHeader,
  Spinner,
} from "../ios";

function uvLabel(uv: number): string {
  if (uv < 3) return "Düşük";
  if (uv < 6) return "Orta";
  if (uv < 8) return "Yüksek";
  if (uv < 11) return "Çok Yüksek";
  return "Aşırı";
}

export default function HomeTab({ active }: { active: boolean }) {
  const { settings, loaded, save } = useSettings();
  const navTo = useTabNav();
  const { hidden: moneyHidden } = usePrivacy();

  const [wx, setWx] = useState<WxData | null>(null);
  const [wxErr, setWxErr] = useState<string | null>(null);
  const [wxLoading, setWxLoading] = useState(true);
  const [wxOpen, setWxOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [sessions, setSessions] = useState<FocusSession[] | null>(null);
  const [txs, setTxs] = useState<Tx[] | null>(null);
  const [workDays, setWorkDays] = useState<WorkDay[] | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const clockStyle: ClockStyle = isClockStyle(settings.clockStyle ?? "")
    ? (settings.clockStyle as ClockStyle)
    : "minimal";

  const city = settings.city || "İstanbul";
  const cityDetail = settings.cityDetail || "";
  const lat = settings.lat;
  const lon = settings.lon;

  const loadWeather = useCallback(
    async (silent = false) => {
      if (!silent) setWxLoading(true);
      setWxErr(null);
      const qs =
        lat && lon
          ? `lat=${lat}&lon=${lon}&label=${encodeURIComponent(
              city,
            )}&detail=${encodeURIComponent(cityDetail)}`
          : `city=${encodeURIComponent(city)}`;
      try {
        setWx(await jget<WxData>(`/api/weather?${qs}`));
        setWxErr(null);
      } catch {
        setWxErr("Hava durumu alınamadı");
      } finally {
        setWxLoading(false);
      }
    },
    [city, cityDetail, lat, lon],
  );

  const loadLight = useCallback(async () => {
    const today = todayISO();
    const mk = monthKey();
    const [t, s, x, w] = await Promise.all([
      jget<Task[]>(`/api/tasks?date=${today}`).catch(() => [] as Task[]),
      jget<FocusSession[]>(`/api/focus?date=${today}`).catch(
        () => [] as FocusSession[],
      ),
      jget<Tx[]>(`/api/transactions?month=${mk}`).catch(() => [] as Tx[]),
      jget<WorkDay[]>(`/api/workdays?month=${mk}`).catch(() => [] as WorkDay[]),
    ]);
    setTasks(t);
    setSessions(s);
    setTxs(x);
    setWorkDays(w);
  }, []);

  useEffect(() => {
    if (loaded) loadWeather();
  }, [loaded, loadWeather]);

  useEffect(() => {
    if (loaded) loadLight();
  }, [loaded, loadLight]);

  useEffect(() => {
    if (active && loaded) loadLight();
  }, [active, loaded, loadLight]);

  const pickPlace = async (p: PickedPlace) => {
    await save({
      city: p.label,
      cityDetail: p.detail,
      lat: String(p.lat),
      lon: String(p.lon),
    });
  };

  const quote = quoteOfDay();
  const wage = Number(settings.wage || "0");

  const summary = useMemo(() => {
    const done = tasks?.filter((t) => t.completed).length ?? 0;
    const total = tasks?.length ?? 0;
    const focusMin = sessions?.reduce((a, s) => a + s.minutes, 0) ?? 0;
    const income =
      txs?.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0) ??
      0;
    const expense =
      txs?.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0) ??
      0;
    const mult = workDays?.reduce((a, w) => a + w.multiplier, 0) ?? 0;
    return {
      done,
      total,
      focusMin,
      net: income - expense,
      mult,
      earn: mult * wage,
    };
  }, [tasks, sessions, txs, workDays, wage]);

  const tiles: {
    id: "plan" | "focus" | "finance" | "work";
    icon: LucideIcon;
    color: string;
    label: string;
    value: string;
    sub: string;
  }[] = [
    {
      id: "plan",
      icon: ListChecks,
      color: "bg-[#0A84FF]",
      label: "Görevler",
      value: tasks ? `${summary.done}/${summary.total}` : "—",
      sub: "bugün tamamlanan",
    },
    {
      id: "focus",
      icon: Moon,
      color: "bg-[#5E5CE6]",
      label: "Odak",
      value: sessions ? `${summary.focusMin} dk` : "—",
      sub: "bugünkü odak süresi",
    },
    {
      id: "finance",
      icon: Banknote,
      color: "bg-[#30D158]",
      label: "Finans",
      value: txs ? mask(fmtTRY(summary.net), moneyHidden) : "—",
      sub: "bu ay net durum",
    },
    {
      id: "work",
      icon: HardHat,
      color: "bg-[#FF9F0A]",
      label: "Yevmiye",
      value: workDays ? `${fmtNumber(summary.mult)} gün` : "—",
      sub: workDays
        ? `bu ay ≈ ${mask(fmtTRY(summary.earn), moneyHidden)}`
        : "bu ay",
    },
  ];

  const wxThemeObj = wx ? wxTheme(wx.current.code, wx.current.isDay) : null;

  return (
    <Screen
      title="Bugün"
      titleRight={
        <LiveClock
          style={clockStyle}
          onCycle={() => save({ clockStyle: nextClockStyle(clockStyle) })}
        />
      }
      right={
        <CircleBtn tint="bg-white/[0.08]" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon size={17} />
        </CircleBtn>
      }
    >
      {/* Selamlama */}
      <div className="-mt-1 flex items-center justify-between gap-3">
        <p className="text-[17px] font-semibold tracking-tight text-white/80">
          {greetingTR()}, {settings.name || "Kaptan"}
        </p>
        <p className="shrink-0 text-[12px] font-medium text-white/35">
          {fullDateTR(todayISO())}
        </p>
      </div>

      {/* Hava durumu — kompakt kart */}
      {wxLoading && !wx ? (
        <div className="grid h-[130px] place-items-center rounded-[26px] border border-white/[0.06] bg-[#1C1C1E]">
          <Spinner />
        </div>
      ) : wx && wxThemeObj ? (
        <WeatherCompact
          wx={wx}
          grad={wxThemeObj.grad}
          glow={wxThemeObj.glow}
          detail={cityDetail}
          onOpen={() => setWxOpen(true)}
          onPickLocation={() => setLocOpen(true)}
        />
      ) : (
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <CloudOff size={26} className="text-white/40" />
          <p className="text-[14px] text-white/60">
            {wxErr ?? "Hava durumu alınamadı"}
          </p>
          <div className="mt-1 flex gap-2">
            <button
              onClick={() => loadWeather()}
              className="flex items-center gap-1.5 rounded-full bg-[#0A84FF] px-4 py-2 text-[14px] font-semibold"
            >
              <RefreshCw size={14} /> Tekrar Dene
            </button>
            <button
              onClick={() => setLocOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-4 py-2 text-[14px] font-semibold"
            >
              <MapPin size={14} /> Konum Seç
            </button>
          </div>
        </Card>
      )}

      {/* Kontrol merkezi */}
      <div>
        <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.07em] text-white/40">
          Kontrol Merkezi
        </p>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  buzz(8);
                  navTo(t.id);
                }}
                className="rounded-[22px] border border-white/[0.07] bg-[#1C1C1E] p-4 text-left"
              >
                <IconBadge icon={Icon} color={t.color} />
                <p className="tnum mt-3 text-[18px] font-bold tracking-tight">
                  {t.value}
                </p>
                <p className="text-[12px] font-medium text-white/45">
                  {t.label} · {t.sub}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Alıntı */}
      <Card className="relative overflow-hidden p-5">
        <Quote
          size={84}
          className="absolute -right-2 -top-2 rotate-180 text-white/[0.05]"
        />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64D2FF]">
          Günün Alıntısı
        </p>
        <p className="mt-3 font-serif text-[19px] italic leading-[1.45] text-white/95">
          &ldquo;{quote.t}&rdquo;
        </p>
        <p className="mt-3 text-[13px] font-semibold text-white/45">
          — {quote.a}
        </p>
      </Card>

      <p className="pb-2 text-center text-[10px] text-white/25">
        Hava durumu: Open-Meteo · Adres: OpenStreetMap
      </p>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={save}
        settings={settings}
        clockStyle={clockStyle}
        onOpenLocation={() => {
          setSettingsOpen(false);
          setTimeout(() => setLocOpen(true), 260);
        }}
      />

      <LocationPicker
        open={locOpen}
        onClose={() => setLocOpen(false)}
        onPick={pickPlace}
        current={cityDetail ? `${city} — ${cityDetail}` : city}
      />

      {/* Hava durumu detay sayfası */}
      <Sheet
        open={wxOpen && !!wx}
        onClose={() => setWxOpen(false)}
        className={wxThemeObj ? `bg-gradient-to-b ${wxThemeObj.grad}` : ""}
      >
        {wx && (
          <>
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className={`absolute inset-0 ${wxThemeObj?.glow ?? ""}`} />
            </div>
            <div className="relative">
              <SheetHeader title={wx.city} onClose={() => setWxOpen(false)} />
              <div className="px-5">
                {cityDetail && (
                  <p className="-mt-2 mb-2 truncate text-[12px] text-white/60">
                    {cityDetail}
                  </p>
                )}
                <WeatherDetail
                  wx={wx}
                  onRefresh={() => {
                    buzz(8);
                    loadWeather(true);
                  }}
                  onChangeLocation={() => {
                    setWxOpen(false);
                    setTimeout(() => setLocOpen(true), 260);
                  }}
                />
              </div>
            </div>
          </>
        )}
      </Sheet>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Kompakt hava kartı                                                  */
/* ------------------------------------------------------------------ */

function WeatherCompact({
  wx,
  grad,
  glow,
  detail,
  onOpen,
  onPickLocation,
}: {
  wx: WxData;
  grad: string;
  glow: string;
  detail: string;
  onOpen: () => void;
  onPickLocation: () => void;
}) {
  const Icon = wxIcon(wx.current.code, wx.current.isDay);
  return (
    <div
      className={`relative overflow-hidden rounded-[26px] bg-gradient-to-b ${grad} shadow-[0_18px_44px_-18px_rgba(0,0,0,0.65)]`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${glow}`}
        aria-hidden
      />
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          buzz(8);
          onOpen();
        }}
        className="relative block w-full p-5 pb-3 text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold">{wx.city}</p>
            {detail && (
              <p className="truncate text-[11px] font-medium text-white/60">
                {detail}
              </p>
            )}
            <p className="mt-1.5 flex items-center gap-1.5 text-[14px] font-medium text-white/85">
              <Icon size={16} />
              {wx.current.desc}
            </p>
            <p className="tnum mt-1 text-[12px] font-medium text-white/65">
              Y: {wx.current.high}° · D: {wx.current.low}° · Hiss.{" "}
              {wx.current.feels}°
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="tnum text-[60px] font-extralight leading-none tracking-tighter">
              {wx.current.temp}°
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-white/70">
              Detay <ChevronRight size={12} />
            </p>
          </div>
        </div>
      </motion.button>

      {/* Konum değiştir */}
      <button
        onClick={() => {
          buzz(8);
          onPickLocation();
        }}
        className="relative flex w-full items-center justify-center gap-1.5 border-t border-white/20 py-2.5 text-[12px] font-semibold text-white/80 active:bg-black/20"
      >
        <MapPin size={13} /> Konumu Değiştir
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hava durumu detayı                                                  */
/* ------------------------------------------------------------------ */

function WeatherDetail({
  wx,
  onRefresh,
  onChangeLocation,
}: {
  wx: WxData;
  onRefresh: () => void;
  onChangeLocation: () => void;
}) {
  const MainIcon = wxIcon(wx.current.code, wx.current.isDay);
  const weekMin = Math.min(...wx.daily.map((d) => d.min));
  const weekMax = Math.max(...wx.daily.map((d) => d.max));
  const span = Math.max(1, weekMax - weekMin);

  return (
    <div className="pb-2">
      {/* Üst kısım */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pt-1">
          <p className="flex items-center gap-1.5 text-[15px] font-medium text-white/85">
            <MainIcon size={16} />
            {wx.current.desc}
          </p>
          <p className="tnum mt-1 text-[13px] text-white/65">
            Y: {wx.current.high}° · D: {wx.current.low}° · Hissedilen{" "}
            {wx.current.feels}°
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white/80"
            >
              <RefreshCw size={11} /> Yenile
            </button>
            <button
              onClick={onChangeLocation}
              className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white/80"
            >
              <MapPin size={11} /> Konum
            </button>
          </div>
        </div>
        <p className="tnum text-[64px] font-extralight leading-[0.95] tracking-tighter">
          {wx.current.temp}°
        </p>
      </div>

      {/* Saatlik */}
      <div className="mt-4 border-t border-white/25 pt-3">
        <div className="no-scrollbar -mx-1 flex overflow-x-auto px-1">
          {wx.hourly.map((h, i) => {
            const HIcon = wxIcon(h.code, h.isDay);
            return (
              <div
                key={`${h.t}-${i}`}
                className="flex min-w-[57px] flex-col items-center gap-1.5 py-0.5"
              >
                <span className="text-[12px] font-semibold text-white/85">
                  {i === 0 ? "Şimdi" : h.t}
                </span>
                <HIcon size={19} strokeWidth={1.8} />
                <span
                  className={`text-[10px] font-bold text-[#A4E4FF] ${
                    h.prob >= 10 ? "" : "opacity-0"
                  }`}
                >
                  %{h.prob}
                </span>
                <span className="tnum text-[16px] font-semibold">{h.temp}°</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Günlük */}
      <div className="mt-3 border-t border-white/25 pt-1.5">
        {wx.daily.map((d, i) => {
          const DIcon = wxIcon(d.code, true);
          const left = ((d.min - weekMin) / span) * 100;
          const width = ((d.max - d.min) / span) * 100;
          return (
            <div key={d.date} className="flex items-center gap-2 py-[7px]">
              <span className="w-[52px] text-[14px] font-medium">
                {i === 0
                  ? "Bugün"
                  : new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(
                      new Date(
                        Number(d.date.slice(0, 4)),
                        Number(d.date.slice(5, 7)) - 1,
                        Number(d.date.slice(8, 10)),
                      ),
                    )}
              </span>
              <span className="flex w-[38px] items-center gap-1">
                <DIcon size={16} strokeWidth={1.8} />
                {d.prob >= 20 && (
                  <span className="tnum text-[9px] font-bold text-[#A4E4FF]">
                    %{d.prob}
                  </span>
                )}
              </span>
              <span className="tnum w-[30px] text-right text-[14px] text-white/65">
                {d.min}°
              </span>
              <span className="relative h-[4px] flex-1 overflow-hidden rounded-full bg-black/30">
                <span
                  className="absolute inset-y-0 rounded-full bg-gradient-to-r from-[#6FC2FF] via-[#B8E28C] to-[#FFD66E]"
                  style={{ left: `${left}%`, width: `${Math.max(6, width)}%` }}
                />
              </span>
              <span className="tnum w-[30px] text-right text-[14px] font-semibold">
                {d.max}°
              </span>
            </div>
          );
        })}
      </div>

      {/* Detay kutuları */}
      <div className="mt-3 border-t border-white/25 pt-3">
        <div className="grid grid-cols-2 gap-2.5">
          <WxTile
            icon={Thermometer}
            label="Hissedilen"
            value={`${wx.current.feels}°`}
          />
          <WxTile icon={Droplets} label="Nem" value={`%${wx.current.humidity}`} />
          <WxTile
            icon={Wind}
            label="Rüzgar"
            value={`${wx.current.wind} km/s`}
            extra={
              <Navigation2
                size={13}
                style={{ transform: `rotate(${wx.current.windDir + 180}deg)` }}
                className="text-white/70"
              />
            }
          />
          <WxTile
            icon={SunMedium}
            label="UV İndeksi"
            value={`${wx.daily[0]?.uv ?? 0}`}
            sub={uvLabel(wx.daily[0]?.uv ?? 0)}
          />
          <WxTile
            icon={Gauge}
            label="Basınç"
            value={`${wx.current.pressure}`}
            sub="hPa"
          />
          <WxTile
            icon={Sunrise}
            label="Gün Doğumu / Batımı"
            value={`${wx.daily[0]?.sunrise ?? "--"} · ${wx.daily[0]?.sunset ?? "--"}`}
            small
            extra={<Sunset size={13} className="text-white/70" />}
          />
        </div>
      </div>
    </div>
  );
}

function WxTile({
  icon: Icon,
  label,
  value,
  sub,
  extra,
  small = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  extra?: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="rounded-[16px] bg-black/[0.22] p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-white/55">
        <Icon size={12} /> {label}
      </p>
      <p
        className={`tnum mt-1.5 flex items-center gap-1.5 font-semibold ${
          small ? "text-[16px]" : "text-[21px]"
        }`}
      >
        {value}
        {sub && (
          <span className="text-[12px] font-medium text-white/55">{sub}</span>
        )}
        {extra}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ayarlar                                                             */
/* ------------------------------------------------------------------ */

function SettingsSheet({
  open,
  onClose,
  onSave,
  settings,
  clockStyle,
  onOpenLocation,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (patch: Record<string, string>) => Promise<void>;
  settings: Record<string, string>;
  clockStyle: ClockStyle;
  onOpenLocation: () => void;
}) {
  const [name, setName] = useState(settings.name ?? "");
  const [wage, setWage] = useState(settings.wage ?? "");

  useEffect(() => {
    if (open) {
      setName(settings.name ?? "");
      setWage(settings.wage ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Ayarlar" onClose={onClose} />
      <div className="flex flex-col gap-4 px-5">
        <List>
          <Row label="İsim">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adın"
              className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-white/25"
            />
          </Row>
          <Row label="Yevmiye (₺/gün)">
            <input
              value={wage}
              onChange={(e) => setWage(e.target.value)}
              inputMode="decimal"
              placeholder="1500"
              className="tnum w-full bg-transparent text-right text-[15px] outline-none placeholder:text-white/25"
            />
          </Row>
          <button
            onClick={onOpenLocation}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <span className="w-[132px] shrink-0 text-[15px] text-white/70">
              Konum
            </span>
            <span className="min-w-0 flex-1 truncate text-right text-[15px] text-white/90">
              {settings.city || "İstanbul"}
            </span>
            <ChevronRight size={16} className="shrink-0 text-white/30" />
          </button>
        </List>

        {/* Saat stili */}
        <div>
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Saat Stili
          </p>
          <div className="grid grid-cols-3 gap-2">
            {CLOCK_STYLES.map((s) => {
              const sel = s.id === clockStyle;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    buzz(8);
                    onSave({ clockStyle: s.id });
                  }}
                  className={`rounded-[12px] border px-2 py-2.5 text-[13px] font-semibold transition-colors ${
                    sel
                      ? "border-[#0A84FF] bg-[#0A84FF]/20 text-[#64A8FF]"
                      : "border-white/10 bg-white/[0.05] text-white/60"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-1 text-[11px] text-white/35">
            Ana ekrandaki saate dokunarak da stiller arasında geçebilirsin.
          </p>
        </div>

        <IOSButton
          onClick={async () => {
            await onSave({
              name: name.trim() || "Kaptan",
              wage: wage.trim() || "0",
            });
            onClose();
          }}
        >
          Kaydet
        </IOSButton>
      </div>
    </Sheet>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="w-[132px] shrink-0 text-[15px] text-white/70">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
