"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Delete, Loader2, type LucideIcon } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { buzz } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Kart                                                                */
/* ------------------------------------------------------------------ */

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[22px] border border-white/[0.07] bg-[#1C1C1E] ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ekran — iOS "large title" + daralınca bulanık başlık çubuğu          */
/* ------------------------------------------------------------------ */

export function Screen({
  title,
  right,
  titleRight,
  children,
}: {
  title: string;
  right?: ReactNode;
  titleRight?: ReactNode;
  children: ReactNode;
}) {
  const [compact, setCompact] = useState(false);
  return (
    <div className="relative h-full">
      <div
        className="no-scrollbar h-full overflow-y-auto overscroll-contain"
        onScroll={(e) => setCompact(e.currentTarget.scrollTop > 44)}
      >
        <div className="flex items-end justify-between gap-3 px-5 pb-1 pt-[calc(env(safe-area-inset-top)+56px)]">
          <h1 className="text-[34px] font-bold tracking-tight text-white">
            {title}
          </h1>
          {titleRight && <div className="pb-1">{titleRight}</div>}
        </div>
        <div className="flex flex-col gap-4 px-5 pb-[120px] pt-3">
          {children}
        </div>
      </div>

      {/* Üst gezinme çubuğu */}
      <div
        className={`absolute inset-x-0 top-0 z-20 transition-colors duration-300 ${
          compact ? "border-b border-white/10 bg-black/70 backdrop-blur-xl" : ""
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="relative flex h-[48px] items-center justify-between px-3.5">
          <span className="w-11" />
          <span
            className={`absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold transition-opacity duration-200 ${
              compact ? "opacity-100" : "opacity-0"
            }`}
          >
            {title}
          </span>
          <div>{right ?? <span className="block w-11" />}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Alt sayfa (sheet)                                                   */
/* ------------------------------------------------------------------ */

export function Sheet({
  open,
  onClose,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[94dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[26px] border border-white/10 bg-[#1C1C1E] ${className}`}
            initial={{ y: "102%" }}
            animate={{ y: 0 }}
            exit={{ y: "105%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110) onClose();
            }}
          >
            <div className="mx-auto mt-2.5 h-[5px] w-9 shrink-0 rounded-full bg-white/25" />
            <div
              className="no-scrollbar min-h-0 flex-1 overflow-y-auto"
              style={{
                paddingBottom: "max(18px, env(safe-area-inset-bottom))",
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SheetHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 pb-3 pt-2">
      <h2 className="text-[20px] font-bold tracking-tight">{title}</h2>
      <CircleBtn tint="bg-white/[0.08]" className="h-[30px] w-[30px]" onClick={onClose}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 1L13 13M13 1L1 13"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </CircleBtn>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dairesel düğme                                                      */
/* ------------------------------------------------------------------ */

export function CircleBtn({
  children,
  onClick,
  className = "",
  tint = "bg-[#0A84FF]",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  tint?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.84 }}
      onClick={() => {
        buzz(8);
        onClick?.();
      }}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tint} text-white ${className}`}
    >
      {children}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* iOS uygulama simgesi rozeti                                         */
/* ------------------------------------------------------------------ */

export function IconBadge({
  icon: Icon,
  color,
  size = 16,
  className = "",
}: {
  icon: LucideIcon;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] ${color} ${className}`}
    >
      <Icon size={size} strokeWidth={2.3} className="text-white" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bölüm etiketi                                                       */
/* ------------------------------------------------------------------ */

export function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`px-1 text-[12px] font-semibold uppercase tracking-[0.07em] text-white/40 ${className}`}
    >
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Gruplu liste                                                        */
/* ------------------------------------------------------------------ */

export function List({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`divide-y divide-white/[0.08] overflow-hidden rounded-[16px] border border-white/[0.05] bg-[#1C1C1E] ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Segmentli denetim                                                   */
/* ------------------------------------------------------------------ */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={`flex rounded-[10px] bg-[#2C2C2E] p-[2px] ${className}`}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              if (!selected) buzz(8);
              onChange(o.value);
            }}
            className="relative flex-1 rounded-[8px] px-1.5 py-[6px] text-[13px] font-medium"
          >
            {selected && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[7px] bg-[#636366] shadow-sm"
                transition={{ type: "spring", stiffness: 520, damping: 40 }}
              />
            )}
            <span
              className={`relative z-10 ${selected ? "text-white" : "text-white/70"}`}
            >
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Büyük iOS düğmesi                                                   */
/* ------------------------------------------------------------------ */

export function IOSButton({
  children,
  onClick,
  color = "bg-[#0A84FF]",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      onClick={() => {
        buzz(10);
        onClick?.();
      }}
      className={`flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] text-[17px] font-semibold text-white ${color} ${
        disabled ? "opacity-35" : ""
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Sayısal tuş takımı (TR ondalık: virgül)                             */
/* ------------------------------------------------------------------ */

export function Keypad({
  value,
  onChange,
  decimal = true,
}: {
  value: string;
  onChange: (v: string) => void;
  decimal?: boolean;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", decimal ? "," : "", "0", "del"];
  const press = (k: string) => {
    buzz(6);
    if (k === "del") return onChange(value.slice(0, -1));
    if (!k) return;
    if (k === ",") {
      if (decimal && !value.includes(",")) onChange(value ? value + "," : "0,");
      return;
    }
    const next = value + k;
    const frac = next.split(",")[1];
    if (frac && frac.length > 2) return;
    if (next.replace(",", "").length > 9) return;
    onChange(next);
  };
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {keys.map((k, i) => (
        <motion.button
          key={i}
          type="button"
          whileTap={k ? { scale: 0.9 } : undefined}
          onClick={() => press(k)}
          className={`grid h-[54px] place-items-center rounded-[14px] bg-white/[0.07] text-[26px] font-medium transition-colors active:bg-white/[0.16] ${
            k ? "" : "pointer-events-none opacity-0"
          }`}
        >
          {k === "del" ? <Delete size={23} /> : k}
        </motion.button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <Loader2 className={`animate-spin text-white/50 ${className}`} size={22} />
  );
}

export function EmptyState({
  icon: Icon,
  title,
  sub,
  action,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white/[0.06]">
        <Icon size={25} className="text-white/40" />
      </div>
      <p className="text-[15px] font-medium text-white/70">{title}</p>
      {sub && <p className="max-w-[240px] text-[13px] text-white/40">{sub}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
