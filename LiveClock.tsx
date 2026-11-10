"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { buzz } from "@/lib/format";

export type ClockStyle = "minimal" | "mono" | "analog" | "neon" | "orbit";

export const CLOCK_STYLES: { id: ClockStyle; label: string }[] = [
  { id: "minimal", label: "Minimal" },
  { id: "mono", label: "Mono" },
  { id: "analog", label: "Analog" },
  { id: "neon", label: "Neon" },
  { id: "orbit", label: "Yörünge" },
];

export function nextClockStyle(cur: ClockStyle): ClockStyle {
  const i = CLOCK_STYLES.findIndex((s) => s.id === cur);
  return CLOCK_STYLES[(i + 1) % CLOCK_STYLES.length].id;
}

export function isClockStyle(v: string): v is ClockStyle {
  return CLOCK_STYLES.some((s) => s.id === v);
}

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 100);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * Başlık hizasında duran kompakt, modern saat.
 * Dokununca stiller arasında geçer.
 */
export default function LiveClock({
  style,
  onCycle,
}: {
  style: ClockStyle;
  onCycle: () => void;
}) {
  const now = useNow();

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.93 }}
      onClick={() => {
        buzz(10);
        onCycle();
      }}
      className="block"
      aria-label="Saat stilini değiştir"
    >
      <div className="flex h-[44px] items-center justify-end">
        {now === null ? (
          <span className="h-[30px] w-[86px] rounded-[10px] bg-white/[0.04]" />
        ) : style === "minimal" ? (
          <MinimalClock now={now} />
        ) : style === "mono" ? (
          <MonoClock now={now} />
        ) : style === "analog" ? (
          <AnalogClock now={now} />
        ) : style === "neon" ? (
          <NeonClock now={now} />
        ) : (
          <OrbitClock now={now} />
        )}
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Minimal — ince rakamlar, ışıyan saniye noktası                   */
/* ------------------------------------------------------------------ */

function MinimalClock({ now }: { now: Date }) {
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ms = now.getMilliseconds();
  const frac = (now.getSeconds() * 1000 + ms) / 60000;

  return (
    <div className="flex flex-col items-end gap-[3px]">
      <div className="flex items-baseline gap-[3px]">
        <span className="tnum text-[27px] font-light leading-none tracking-tight text-white">
          {hh}
          <span
            className="mx-[1px] inline-block text-white/40 transition-opacity duration-150"
            style={{ opacity: ms < 500 ? 1 : 0.2 }}
          >
            :
          </span>
          {mm}
        </span>
        <span className="tnum text-[13px] font-medium leading-none text-[#0A84FF]">
          {ss}
        </span>
      </div>
      <div className="h-[2px] w-[76px] overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#0A84FF] transition-[width] duration-100 ease-linear"
          style={{ width: `${frac * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Mono — tek satır, nokta vurgulu                                  */
/* ------------------------------------------------------------------ */

function MonoClock({ now }: { now: Date }) {
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return (
    <div className="flex items-center gap-1.5 rounded-[11px] border border-white/[0.08] bg-white/[0.05] px-2.5 py-1.5">
      <motion.span
        key={ss}
        initial={{ scale: 0.4, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 18 }}
        className="h-[6px] w-[6px] rounded-full bg-[#30D158]"
      />
      <span className="tnum text-[20px] font-semibold leading-none tracking-tight text-white">
        {hh}:{mm}
      </span>
      <span className="tnum text-[12px] font-semibold leading-none text-white/35">
        {ss}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Analog — mini kadran                                             */
/* ------------------------------------------------------------------ */

function AnalogClock({ now }: { now: Date }) {
  const sec = now.getSeconds() + now.getMilliseconds() / 1000;
  const min = now.getMinutes() + sec / 60;
  const hour = (now.getHours() % 12) + min / 60;
  return (
    <div className="flex items-center gap-2">
      <span className="tnum text-[17px] font-light leading-none tracking-tight text-white/80">
        {String(now.getHours()).padStart(2, "0")}:
        {String(now.getMinutes()).padStart(2, "0")}
      </span>
      <svg viewBox="0 0 80 80" className="h-[42px] w-[42px]">
        <circle
          cx="40"
          cy="40"
          r="37"
          fill="#0C0C0E"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1.5"
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={40 + 29 * Math.sin(a)}
              y1={40 - 29 * Math.cos(a)}
              x2={40 + 33 * Math.sin(a)}
              y2={40 - 33 * Math.cos(a)}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          );
        })}
        <g transform={`rotate(${hour * 30} 40 40)`}>
          <line
            x1="40"
            y1="44"
            x2="40"
            y2="22"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </g>
        <g transform={`rotate(${min * 6} 40 40)`}>
          <line
            x1="40"
            y1="45"
            x2="40"
            y2="14"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>
        <g transform={`rotate(${sec * 6} 40 40)`}>
          <line
            x1="40"
            y1="48"
            x2="40"
            y2="11"
            stroke="#FF9F0A"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </g>
        <circle cx="40" cy="40" r="2.6" fill="#FF9F0A" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Neon — fütüristik parlama                                        */
/* ------------------------------------------------------------------ */

function NeonClock({ now }: { now: Date }) {
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ms = now.getMilliseconds();
  return (
    <div className="flex flex-col items-end gap-[3px] rounded-[11px] border border-[#00F5FF]/25 bg-[#00F5FF]/[0.06] px-2.5 py-1.5">
      <div className="flex items-baseline gap-1">
        <span
          className="tnum text-[21px] font-bold leading-none tracking-tight text-[#00F5FF]"
          style={{
            textShadow:
              "0 0 6px rgba(0,245,255,0.9), 0 0 18px rgba(0,245,255,0.45)",
          }}
        >
          {hh}
          <span style={{ opacity: ms < 500 ? 1 : 0.2 }}>:</span>
          {mm}
        </span>
        <span
          className="tnum text-[12px] font-bold leading-none text-[#FF6FC0]"
          style={{ textShadow: "0 0 8px rgba(255,45,149,0.8)" }}
        >
          {ss}
        </span>
      </div>
      <span className="text-[7px] font-bold uppercase tracking-[0.26em] text-[#00F5FF]/60">
        system·time
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Yörünge — fütüristik halkalar                                    */
/* ------------------------------------------------------------------ */

function OrbitRing({
  radius,
  progress,
  color,
  width,
}: {
  radius: number;
  progress: number;
  color: string;
  width: number;
}) {
  const circ = 2 * Math.PI * radius;
  return (
    <>
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={width}
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progress)}
        transform="rotate(-90 40 40)"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </>
  );
}

function OrbitClock({ now }: { now: Date }) {
  const ms = now.getMilliseconds();
  const sec = now.getSeconds() + ms / 1000;
  const min = now.getMinutes() + sec / 60;
  const hr = now.getHours() + min / 60;
  return (
    <div className="flex items-center gap-2">
      <span
        className="tnum text-[19px] font-light leading-none tracking-tight text-white"
        style={{ textShadow: "0 0 14px rgba(0,245,255,0.35)" }}
      >
        {String(now.getHours()).padStart(2, "0")}
        <span style={{ opacity: ms < 500 ? 1 : 0.25 }}>:</span>
        {String(now.getMinutes()).padStart(2, "0")}
      </span>
      <svg viewBox="0 0 80 80" className="h-[42px] w-[42px]">
        <OrbitRing radius={34} progress={sec / 60} color="#00F5FF" width={2.4} />
        <OrbitRing radius={26} progress={min / 60} color="#BF5AF2" width={3} />
        <OrbitRing radius={18} progress={(hr % 24) / 24} color="#FF9F0A" width={3.6} />
        <text
          x="40"
          y="45"
          textAnchor="middle"
          className="tnum"
          fill="#00F5FF"
          fontSize="14"
          fontWeight="700"
        >
          {String(now.getSeconds()).padStart(2, "0")}
        </text>
      </svg>
    </div>
  );
}
