"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Flame,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Target,
  Timer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { jget, type FocusSession } from "@/lib/api";
import { buzz, timeTR, toISODate, todayISO } from "@/lib/format";
import { useFocus } from "../AppShell";
import {
  EmptyState,
  IconBadge,
  List,
  Screen,
  SectionLabel,
  Spinner,
} from "../ios";

const R = 118;
const CIRC = 2 * Math.PI * R;
const DURATIONS = [15, 25, 45, 60];

export default function FocusTab({ active }: { active: boolean }) {
  const {
    durationMin,
    setDuration,
    remaining,
    phase,
    start,
    pause,
    reset,
    version,
    justCompleted,
    subject,
    setSubject,
  } = useFocus();

  const [all, setAll] = useState<FocusSession[] | null>(null);

  useEffect(() => {
    let ignore = false;
    jget<FocusSession[]>("/api/focus")
      .then((rows) => {
        if (!ignore) setAll(rows);
      })
      .catch(() => setAll([]));
    return () => {
      ignore = true;
    };
  }, [version, active]);

  const stats = useMemo(() => {
    const rows = all ?? [];
    const todayRows = rows.filter((s) => s.date === todayISO());
    const todayMin = todayRows.reduce((a, s) => a + s.minutes, 0);
    const daySet = new Set(rows.map((s) => s.date));
    let streak = 0;
    const cursor = new Date();
    if (!daySet.has(toISODate(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (daySet.has(toISODate(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return { todayRows, todayMin, streak, total: rows.length };
  }, [all]);

  /* Geçmiş odak konuları — en çok kullanılanlar önce */
  const recentSubjects = useMemo(() => {
    const map = new Map<string, { count: number; last: number }>();
    for (const s of all ?? []) {
      const name = s.subject?.trim();
      if (!name) continue;
      const prev = map.get(name);
      map.set(name, {
        count: (prev?.count ?? 0) + 1,
        last: Math.max(prev?.last ?? 0, s.id),
      });
    }
    return [...map.entries()]
      .sort((a, b) => b[1].count - a[1].count || b[1].last - a[1].last)
      .slice(0, 6)
      .map(([name]) => name);
  }, [all]);

  const totalSec = durationMin * 60;
  const progress = totalSec ? remaining / totalSec : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const idle = phase === "idle";
  const subjectLabel = subject.trim();

  return (
    <Screen title="Odak">
      {/* Sayaç halkası */}
      <div className="rounded-[26px] border border-white/[0.07] bg-[#1C1C1E] px-5 pb-6 pt-5">
        <div className="relative">
          <AnimatePresence>
            {justCompleted && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute -top-1 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#30D158]/15 px-3.5 py-1.5 text-[13px] font-semibold text-[#30D158]"
              >
                <CheckCircle2 size={14} /> Seans tamamlandı
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative mx-auto mt-3 h-[272px] w-[272px]">
            <svg viewBox="0 0 280 280" className="h-full w-full -rotate-90">
              <defs>
                <linearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#5AC8FA" />
                  <stop offset="55%" stopColor="#0A84FF" />
                  <stop offset="100%" stopColor="#5E5CE6" />
                </linearGradient>
              </defs>
              <circle
                cx="140"
                cy="140"
                r={R}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="13"
              />
              <motion.circle
                cx="140"
                cy="140"
                r={R}
                fill="none"
                stroke={justCompleted ? "#30D158" : "url(#focusGrad)"}
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={false}
                animate={{ strokeDashoffset: CIRC * (1 - progress) }}
                transition={{ duration: 0.35, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
              <p className="tnum text-[58px] font-extralight leading-none tracking-tight">
                {mm}:{ss}
              </p>
              {subjectLabel ? (
                <p className="mt-2.5 flex max-w-full items-center gap-1.5 text-[14px] font-semibold text-[#64D2FF]">
                  <Target size={13} className="shrink-0" />
                  <span className="truncate">{subjectLabel}</span>
                </p>
              ) : (
                <p className="mt-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  {phase === "running"
                    ? "Odaklanılıyor"
                    : phase === "paused"
                      ? "Duraklatıldı"
                      : "Hazır"}
                </p>
              )}
              {subjectLabel && (
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                  {phase === "running"
                    ? "Odaklanılıyor"
                    : phase === "paused"
                      ? "Duraklatıldı"
                      : "Hazır"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Süre seçimi */}
        <div className={idle ? "" : "pointer-events-none opacity-35"}>
          <div className="mt-2 flex gap-1 rounded-[10px] bg-[#2C2C2E] p-[2px]">
            {DURATIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  buzz(8);
                  setDuration(m);
                }}
                className={`tnum relative flex-1 rounded-[8px] py-[7px] text-[14px] font-semibold transition-colors ${
                  durationMin === m
                    ? "bg-[#636366] text-white shadow-sm"
                    : "text-white/60"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-center text-[11px] text-white/35">
            dakika
          </p>
        </div>

        {/* Kontroller */}
        <div className="mt-3 flex items-center justify-center gap-8">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={reset}
            disabled={idle}
            className={`grid h-[58px] w-[58px] place-items-center rounded-full bg-[#2C2C2E] text-white ${
              idle ? "opacity-30" : ""
            }`}
            aria-label="Sıfırla"
          >
            <RotateCcw size={23} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={phase === "running" ? pause : start}
            className={`grid h-[76px] w-[76px] place-items-center rounded-full text-white shadow-lg ${
              phase === "running"
                ? "bg-[#FF9F0A] shadow-[#FF9F0A]/25"
                : "bg-[#30D158] shadow-[#30D158]/25"
            }`}
            aria-label={phase === "running" ? "Duraklat" : "Başlat"}
          >
            {phase === "running" ? (
              <Pause size={30} fill="currentColor" />
            ) : (
              <Play size={30} fill="currentColor" className="ml-1" />
            )}
          </motion.button>
          <span className="w-[58px]" />
        </div>
      </div>

      {/* Odak konusu */}
      <div>
        <SectionLabel className="mb-2">Odak Konusu</SectionLabel>
        <div
          className={`rounded-[22px] border border-white/[0.07] bg-[#1C1C1E] p-4 ${
            idle ? "" : "opacity-60"
          }`}
        >
          <div className="flex items-center gap-3 rounded-[12px] bg-[#2C2C2E] px-3.5">
            <Target size={17} className="shrink-0 text-white/40" />
            <input
              value={subject}
              onChange={(e) => idle && setSubject(e.target.value)}
              placeholder={idle ? "Neye odaklanıyorsun?" : "Seans sürüyor…"}
              readOnly={!idle}
              maxLength={80}
              className="w-full bg-transparent py-3 text-[16px] outline-none placeholder:text-white/25"
            />
          </div>
          {idle && recentSubjects.length > 0 && (
            <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-0.5">
              {recentSubjects.map((s) => {
                const selected = subjectLabel === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      buzz(8);
                      setSubject(s);
                    }}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                      selected
                        ? "border-[#0A84FF] bg-[#0A84FF]/25 text-[#64A8FF]"
                        : "border-white/10 bg-white/[0.05] text-white/60"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}
          <p className="mt-2.5 px-1 text-[11px] leading-snug text-white/35">
            Konu, halkanın içinde görünür ve geçmişteki konular hızlı seçim için
            hatırlanır.
          </p>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={Timer}
          color="bg-[#5E5CE6]"
          value={`${stats.todayMin}`}
          unit="dk bugün"
        />
        <StatTile
          icon={Flame}
          color="bg-[#FF9F0A]"
          value={`${stats.streak}`}
          unit="günlük seri"
        />
        <StatTile
          icon={Moon}
          color="bg-[#0A84FF]"
          value={`${stats.total}`}
          unit="toplam seans"
        />
      </div>

      {/* Bugünkü seanslar */}
      <div>
        <SectionLabel className="mb-2">Bugünkü Seanslar</SectionLabel>
        {all === null ? (
          <div className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : stats.todayRows.length === 0 ? (
          <EmptyState
            icon={Moon}
            title="Henüz odak seansı yok"
            sub="Konunu yaz, sayacı başlat, derin çalışmaya geç."
          />
        ) : (
          <List>
            {stats.todayRows.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <IconBadge icon={Moon} color="bg-[#5E5CE6]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-medium">
                    {s.subject?.trim() || "Serbest odak"}
                  </p>
                </div>
                <span className="tnum shrink-0 rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] font-semibold text-white/70">
                  {s.minutes} dk
                </span>
                <span className="tnum shrink-0 text-[13px] text-white/40">
                  {timeTR(s.createdAt)}
                </span>
              </div>
            ))}
          </List>
        )}
      </div>
    </Screen>
  );
}

function StatTile({
  icon: Icon,
  color,
  value,
  unit,
}: {
  icon: typeof Timer;
  color: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#1C1C1E] p-3.5">
      <IconBadge icon={Icon} color={color} />
      <p className="tnum mt-2.5 text-[22px] font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-white/45">{unit}</p>
    </div>
  );
}
