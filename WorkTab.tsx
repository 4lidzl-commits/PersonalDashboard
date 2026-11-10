"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  Eye,
  EyeOff,
  Flame,
  Hammer,
  HardHat,
  Landmark,
  StickyNote,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { jget, jsend, type WorkDay } from "@/lib/api";
import {
  addMonths,
  buzz,
  fmtNumber,
  fmtTRY,
  fullDateTR,
  monthKey,
  monthLabelTR,
  parseISO,
  toISODate,
  todayISO,
} from "@/lib/format";
import { mask, usePrivacy, useSettings } from "../AppShell";
import {
  CircleBtn,
  IconBadge,
  IOSButton,
  Screen,
  SectionLabel,
  SegmentedControl,
  Sheet,
  SheetHeader,
  Spinner,
} from "../ios";

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const MULT_INFO: Record<number, { cell: string; txt: string; label: string }> =
  {
    1: {
      cell: "bg-[#0A84FF]/20 text-[#64A8FF]",
      txt: "text-[#64A8FF]",
      label: "Tam gün ×1",
    },
    1.5: {
      cell: "bg-[#BF5AF2]/20 text-[#D896FF]",
      txt: "text-[#D896FF]",
      label: "Mesai ×1,5",
    },
    2: {
      cell: "bg-[#30D158]/20 text-[#63E68B]",
      txt: "text-[#63E68B]",
      label: "Çift yevmiye ×2",
    },
  };

function multLabel(m: number): string {
  if (m === 1) return "×1";
  if (m === 1.5) return "×1,5";
  if (m === 2) return "×2";
  return "";
}

function kfmt(v: number): string {
  if (v >= 1000)
    return `₺${(v / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}B`;
  return `₺${Math.round(v)}`;
}

export default function WorkTab({ active }: { active: boolean }) {
  const { settings, save } = useSettings();
  const { hidden: moneyHidden, toggle: togglePrivacy } = usePrivacy();
  const [month, setMonth] = useState(monthKey());
  const [days, setDays] = useState<WorkDay[] | null>(null);
  const [allDays, setAllDays] = useState<WorkDay[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [wageOpen, setWageOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const load = useCallback(async (m: string) => {
    const [monthRows, allRows] = await Promise.all([
      jget<WorkDay[]>(`/api/workdays?month=${m}`).catch(() => [] as WorkDay[]),
      jget<WorkDay[]>("/api/workdays").catch(() => [] as WorkDay[]),
    ]);
    setDays(monthRows);
    setAllDays(allRows);
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  useEffect(() => {
    if (active) load(month);
  }, [active, month, load]);

  const wage = Number(settings.wage || "0");
  const map = useMemo(() => {
    const m = new Map<string, WorkDay>();
    for (const d of days ?? []) m.set(d.date, d);
    return m;
  }, [days]);

  const stats = useMemo(() => {
    let total = 0;
    let c1 = 0;
    let c15 = 0;
    let c2 = 0;
    for (const d of days ?? []) {
      total += d.multiplier;
      if (d.multiplier === 1) c1++;
      else if (d.multiplier === 1.5) c15++;
      else if (d.multiplier === 2) c2++;
    }
    return { total, c1, c15, c2, worked: c1 + c15 + c2, earn: total * wage };
  }, [days, wage]);

  /* Tüm zamanlar istatistikleri */
  const global = useMemo(() => {
    const rows = allDays ?? [];
    const perMonth = new Map<string, number>();
    let totalMult = 0;
    for (const d of rows) {
      totalMult += d.multiplier;
      const k = d.date.slice(0, 7);
      perMonth.set(k, (perMonth.get(k) ?? 0) + d.multiplier);
    }
    const monthsWithData = Math.max(1, perMonth.size);
    const totalEarn = totalMult * wage;
    const monthlyAvg = totalEarn / monthsWithData;
    let best: { k: string; v: number } | null = null;
    for (const [k, v] of perMonth) if (!best || v > best.v) best = { k, v };

    const daySet = new Set(rows.map((r) => r.date));
    let streak = 0;
    const cursor = new Date();
    if (!daySet.has(toISODate(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (daySet.has(toISODate(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const chart: { key: string; label: string; earn: number }[] = [];
    const now = monthKey();
    for (let i = 5; i >= 0; i--) {
      const k = addMonths(now, -i);
      chart.push({
        key: k,
        label: new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(
          parseISO(`${k}-01`),
        ),
        earn: (perMonth.get(k) ?? 0) * wage,
      });
    }
    const notedDays = rows.filter((r) => r.note && r.note.trim()).length;
    return {
      totalEarn,
      monthlyAvg,
      best,
      streak,
      chart,
      totalDays: rows.length,
      notedDays,
    };
  }, [allDays, wage]);

  const maxEarn = Math.max(1, ...global.chart.map((c) => c.earn));

  const [year, mon] = month.split("-").map(Number);
  const offset = (new Date(year, mon - 1, 1).getDay() + 6) % 7;
  const dim = new Date(year, mon, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ];

  const selEntry = sel ? map.get(sel) : undefined;
  const selMult = selEntry?.multiplier ?? 0;
  const selNote = selEntry?.note ?? "";

  useEffect(() => {
    if (sel) {
      setNoteDraft(selEntry?.note ?? "");
      setSavedFlash(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1300);
  };

  const apply = async (m: number) => {
    if (!sel) return;
    buzz(10);
    const date = sel;
    const prevNote = map.get(date)?.note ?? null;
    setDays((prev) => {
      const arr = prev ? [...prev] : [];
      const i = arr.findIndex((d) => d.date === date);
      if (m === 0) {
        if (i >= 0) arr.splice(i, 1);
        return arr;
      }
      const row: WorkDay = {
        id: i >= 0 ? arr[i].id : -Math.round(Math.random() * 1e9),
        date,
        multiplier: m,
        note: i >= 0 ? arr[i].note : null,
      };
      if (i >= 0) arr[i] = row;
      else arr.push(row);
      return arr;
    });
    setAllDays((prev) => {
      const arr = prev ? [...prev] : [];
      const i = arr.findIndex((d) => d.date === date);
      if (m === 0) {
        if (i >= 0) arr.splice(i, 1);
        return arr;
      }
      const row: WorkDay = {
        id: i >= 0 ? arr[i].id : -Math.round(Math.random() * 1e9),
        date,
        multiplier: m,
        note: i >= 0 ? arr[i].note : prevNote,
      };
      if (i >= 0) arr[i] = row;
      else arr.push(row);
      return arr;
    });
    flashSaved();
    try {
      await jsend("/api/workdays", "PUT", { date, multiplier: m });
    } catch {
      load(month);
    }
  };

  const saveNoteToDay = async () => {
    if (!sel || selMult === 0) return;
    buzz(10);
    const note = noteDraft.trim() || null;
    const date = sel;
    const upd = (list: WorkDay[] | null) =>
      list
        ? list.map((d) => (d.date === date ? { ...d, note } : d))
        : list;
    setDays(upd);
    setAllDays(upd);
    flashSaved();
    try {
      await jsend("/api/workdays", "PUT", { date, multiplier: selMult, note });
    } catch {
      load(month);
    }
  };

  const transfer = async () => {
    if (stats.earn <= 0 || sending || sent) return;
    setSending(true);
    const lastDay = `${month}-${String(dim).padStart(2, "0")}`;
    const date = month === monthKey() ? todayISO() : lastDay;
    try {
      await jsend("/api/transactions", "POST", {
        type: "income",
        amount: stats.earn,
        category: "Yevmiye",
        note: `${monthLabelTR(month)} yevmiyesi`,
        date,
      });
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch {
      /* sessiz */
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      title="Yevmiye"
      right={
        <CircleBtn tint="bg-white/[0.08]" onClick={() => setWageOpen(true)}>
          <Banknote size={16} />
        </CircleBtn>
      }
    >
      {/* Ay özeti */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-b from-[#12321F] via-[#17502F] to-[#1F6B41] p-5">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(120,255,180,0.22),transparent_55%)]"
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-white/60">
              <HardHat size={13} />
              {monthLabelTR(month)} · Tahmini Kazanç
            </p>
            <motion.button
              whileTap={{ scale: 0.86 }}
              onClick={togglePrivacy}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/25 text-white/75 active:bg-black/40"
              aria-label={moneyHidden ? "Kazancı göster" : "Kazancı gizle"}
            >
              {moneyHidden ? <Eye size={16} /> : <EyeOff size={16} />}
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={togglePrivacy}
            className="mt-2 block w-full text-left"
            aria-label={moneyHidden ? "Kazancı göster" : "Kazancı gizle"}
          >
            {moneyHidden ? (
              <span className="flex items-baseline gap-2">
                <span className="text-[44px] font-extralight leading-none tracking-[0.1em] text-white/55">
                  ••••••
                </span>
                <span className="flex items-center gap-1 text-[12px] font-semibold text-white/50">
                  <Eye size={12} /> göstermek için dokun
                </span>
              </span>
            ) : (
              <motion.span
                initial={{ opacity: 0, filter: "blur(8px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.28 }}
                className="tnum block text-[44px] font-extralight leading-none tracking-tight"
              >
                {fmtTRY(stats.earn)}
              </motion.span>
            )}
          </motion.button>

          <p className="tnum mt-1.5 text-[13px] font-medium text-white/65">
            {fmtNumber(stats.total)} yevmiye ×{" "}
            {mask(`${fmtTRY(wage)}/gün`, moneyHidden)}
          </p>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <ChipStat value={`${stats.c1}`} label="Tam ×1" dot="bg-[#0A84FF]" />
            <ChipStat
              value={`${stats.c15}`}
              label="Mesai ×1,5"
              dot="bg-[#BF5AF2]"
            />
            <ChipStat value={`${stats.c2}`} label="Çift ×2" dot="bg-[#30D158]" />
            <ChipStat
              value={fmtNumber(stats.total)}
              label="Toplam gün"
              dot="bg-white"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={transfer}
            disabled={stats.earn <= 0 || sending || sent}
            className={`mt-4 flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] text-[15px] font-semibold transition-colors ${
              sent
                ? "bg-[#30D158]/25 text-[#63E68B]"
                : "bg-white/15 text-white active:bg-white/25"
            } ${stats.earn <= 0 ? "opacity-40" : ""}`}
          >
            {sent ? (
              <>
                <CheckCircle2 size={17} /> Finansa Aktarıldı
              </>
            ) : (
              <>
                <Landmark size={16} /> Finansa Gelir Olarak Aktar
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Takvim */}
      <div className="rounded-[22px] border border-white/[0.07] bg-[#1C1C1E] p-4">
        <div className="mb-3 flex items-center justify-between px-0.5">
          <button
            onClick={() => {
              buzz(6);
              setMonth(addMonths(month, -1));
            }}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-[#64A8FF] active:bg-white/[0.14]"
            aria-label="Önceki ay"
          >
            <ChevronLeft size={17} />
          </button>
          <p className="text-[16px] font-bold">{monthLabelTR(month)}</p>
          <button
            onClick={() => {
              buzz(6);
              setMonth(addMonths(month, 1));
            }}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-[#64A8FF] active:bg-white/[0.14]"
            aria-label="Sonraki ay"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="mb-1.5 grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((w) => (
            <p
              key={w}
              className="text-center text-[10px] font-bold uppercase tracking-wide text-white/35"
            >
              {w}
            </p>
          ))}
        </div>

        {days === null ? (
          <div className="grid place-items-center py-14">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`boş-${i}`} />;
              const iso = `${month}-${String(day).padStart(2, "0")}`;
              const entry = map.get(iso);
              const mult = entry?.multiplier ?? 0;
              const info = MULT_INFO[mult];
              const isToday = iso === todayISO();
              const hasNote = !!entry?.note?.trim();
              return (
                <motion.button
                  key={iso}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    buzz(6);
                    setSel(iso);
                  }}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-[13px] text-[15px] font-medium ${
                    info ? info.cell : "text-white/85"
                  } ${isToday ? "ring-[1.5px] ring-[#0A84FF]" : "bg-white/[0.015]"}`}
                >
                  <span className="tnum">{day}</span>
                  {mult > 0 && (
                    <span
                      className={`tnum absolute bottom-[4px] text-[9px] font-extrabold ${info?.txt}`}
                    >
                      {multLabel(mult)}
                    </span>
                  )}
                  {hasNote && (
                    <span className="absolute right-[5px] top-[5px] h-[5px] w-[5px] rounded-full bg-white/55" />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/[0.07] pt-3">
          {Object.values(MULT_INFO).map((mi) => (
            <span
              key={mi.label}
              className="flex items-center gap-1.5 text-[11px] font-medium text-white/50"
            >
              <span
                className={`h-2 w-2 rounded-full ${mi.cell.split(" ")[0].replace("/20", "")}`}
              />
              {mi.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/50">
            <span className="h-[5px] w-[5px] rounded-full bg-white/55" /> notlu
            gün
          </span>
        </div>
      </div>

      {/* İstatistikler */}
      {global.totalDays > 0 && (
        <div>
          <SectionLabel className="mb-2">İstatistikler</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon={Coins}
              color="bg-[#30D158]"
              value={mask(fmtTRY(global.totalEarn), moneyHidden)}
              label="Toplam kazanç"
            />
            <StatTile
              icon={Flame}
              color="bg-[#FF9F0A]"
              value={`${global.streak} gün`}
              label="Çalışma serisi"
            />
            <StatTile
              icon={TrendingUp}
              color="bg-[#0A84FF]"
              value={mask(fmtTRY(global.monthlyAvg), moneyHidden)}
              label="Aylık ortalama"
            />
            <StatTile
              icon={Trophy}
              color="bg-[#BF5AF2]"
              value={
                global.best
                  ? monthLabelTR(global.best.k).split(" ")[0]
                  : "—"
              }
              label={
                global.best
                  ? `En iyi ay · ${mask(fmtTRY(global.best.v * wage), moneyHidden)}`
                  : "En iyi ay"
              }
            />
          </div>

          <div className="mt-3 rounded-[22px] border border-white/[0.07] bg-[#1C1C1E] px-4 pb-3 pt-4">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-white/40">
              Aylık Kazanç Grafiği
            </p>
            <div className="flex h-[104px] items-end gap-2">
              {global.chart.map((c) => {
                const h = Math.max(5, (c.earn / maxEarn) * 74);
                return (
                  <div
                    key={c.key}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span className="tnum text-[9px] font-bold text-white/45">
                      {c.earn > 0 ? (moneyHidden ? "•••" : kfmt(c.earn)) : ""}
                    </span>
                    <motion.div
                      initial={{ height: 4 }}
                      animate={{ height: h }}
                      transition={{ type: "spring", stiffness: 170, damping: 24 }}
                      className={`w-full max-w-[34px] rounded-[8px] bg-gradient-to-t from-[#1F7A45] to-[#30D158] ${
                        c.key === monthKey() ? "" : "opacity-55"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold ${
                        c.key === monthKey() ? "text-[#63E68B]" : "text-white/40"
                      }`}
                    >
                      {c.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="tnum mt-2 text-center text-[11px] text-white/35">
              Toplam {global.totalDays} günlük kayıt · {global.notedDays} notlu
              gün
            </p>
          </div>
        </div>
      )}

      <p className="flex items-center gap-2 px-1 text-[12px] leading-snug text-white/35">
        <Hammer size={13} className="shrink-0" />
        Güne dokun: çarpan seç, dilersen not ekle. &quot;Yok&quot; kaydı siler.
        Günlük ücreti sağ üstteki düğmeden ayarla.
      </p>

      {/* Gün seçim sayfası */}
      <Sheet open={sel !== null} onClose={() => setSel(null)}>
        <SheetHeader
          title={sel ? fullDateTR(sel) : ""}
          onClose={() => setSel(null)}
        />
        <div className="flex flex-col gap-4 px-5">
          <div className="rounded-[16px] bg-[#2C2C2E] px-4 py-3.5 text-center">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-white/45">
              Bu günün kazancı
            </p>
            <button
              onClick={togglePrivacy}
              className="tnum mt-0.5 block w-full text-[28px] font-bold tracking-tight"
            >
              {mask(fmtTRY(selMult * wage), moneyHidden)}
            </button>
            <AnimatePresence>
              {savedFlash && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-1 flex items-center justify-center gap-1 text-[12px] font-semibold text-[#30D158]"
                >
                  <Check size={13} strokeWidth={3} /> Kaydedildi
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <SegmentedControl
            value={String(selMult)}
            onChange={(v) => apply(Number(v))}
            options={[
              { value: "0", label: "Yok" },
              { value: "1", label: "×1" },
              { value: "1.5", label: "×1,5" },
              { value: "2", label: "×2" },
            ]}
          />

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
              <StickyNote size={12} /> Not
            </p>
            <div className="flex items-center gap-2">
              <input
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder={
                  selMult > 0
                    ? "Örn: blok imalatı, gece vardiyası…"
                    : "Önce bir çarpan seç"
                }
                disabled={selMult === 0}
                maxLength={240}
                className="min-w-0 flex-1 rounded-[12px] bg-[#2C2C2E] px-4 py-3 text-[15px] outline-none placeholder:text-white/25 disabled:opacity-40"
              />
              <CircleBtn
                onClick={saveNoteToDay}
                className="h-[46px] w-[46px] rounded-[12px]"
                tint={
                  noteDraft.trim() === selNote.trim() || selMult === 0
                    ? "bg-white/[0.08]"
                    : "bg-[#0A84FF]"
                }
              >
                <Check size={18} strokeWidth={2.6} />
              </CircleBtn>
            </div>
            {selNote.trim() && noteDraft.trim() === selNote.trim() && (
              <p className="mt-1.5 px-1 text-[12px] text-white/40">
                Kayıtlı not: {selNote}
              </p>
            )}
          </div>

          <p className="pb-1 text-center text-[12px] text-white/35">
            Çarpan seçtiğin an kaydedilir; notu onay düğmesiyle ekle.
          </p>
        </div>
      </Sheet>

      {/* Yevmiye ücreti */}
      <Sheet open={wageOpen} onClose={() => setWageOpen(false)}>
        <SheetHeader title="Günlük Yevmiye" onClose={() => setWageOpen(false)} />
        <WageEditor
          initial={settings.wage ?? "0"}
          onSave={async (v) => {
            await save({ wage: v });
            setWageOpen(false);
          }}
        />
      </Sheet>
    </Screen>
  );
}

function ChipStat({
  value,
  label,
  dot,
}: {
  value: string;
  label: string;
  dot: string;
}) {
  return (
    <div className="rounded-[12px] bg-black/25 px-2 py-2.5 text-center">
      <span className="flex items-center justify-center gap-1">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="tnum text-[16px] font-bold leading-none">{value}</span>
      </span>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-white/55">
        {label}
      </p>
    </div>
  );
}

function StatTile({
  icon: Icon,
  color,
  value,
  label,
}: {
  icon: LucideIcon;
  color: string;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#1C1C1E] p-4">
      <IconBadge icon={Icon} color={color} />
      <p className="tnum mt-2.5 truncate text-[19px] font-bold leading-none">
        {value}
      </p>
      <p className="mt-1 truncate text-[11px] font-medium text-white/45">
        {label}
      </p>
    </div>
  );
}

function WageEditor({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (v: string) => Promise<void>;
}) {
  const [val, setVal] = useState(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => setVal(initial), [initial]);
  const num = Number(val.replace(",", "."));
  const valid = Number.isFinite(num) && num >= 0;
  return (
    <div className="flex flex-col gap-4 px-5">
      <div className="rounded-[16px] bg-[#2C2C2E] px-4 py-3.5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-white/45">
          Günlük ücret (₺)
        </p>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          inputMode="decimal"
          placeholder="1500"
          className="tnum mt-1 w-full bg-transparent text-[32px] font-bold tracking-tight outline-none placeholder:text-white/20"
        />
      </div>
      <p className="px-1 text-[12px] text-white/35">
        Kazanç = toplam yevmiye çarpanı × günlük ücret.
      </p>
      <IOSButton
        disabled={!valid || saving}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave(String(Math.trunc(num * 100) / 100));
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </IOSButton>
    </div>
  );
}
