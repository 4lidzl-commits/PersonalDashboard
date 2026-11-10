"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  ListChecks,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { jget, jsend, type Task } from "@/lib/api";
import {
  addMonths,
  buzz,
  dayShortTR,
  fullDateTR,
  monthKey,
  monthLabelTR,
  toISODate,
  todayISO,
} from "@/lib/format";
import {
  CircleBtn,
  EmptyState,
  IOSButton,
  List,
  Screen,
  SectionLabel,
  SegmentedControl,
  Sheet,
  SheetHeader,
  Spinner,
} from "../ios";

type ViewMode = "day" | "week" | "month";

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-[#FFD60A]",
  medium: "text-[#FF9F0A]",
  high: "text-[#FF453A]",
};
const PRIORITY_BG: Record<string, string> = {
  none: "bg-[#0A84FF]",
  low: "bg-[#FFD60A]",
  medium: "bg-[#FF9F0A]",
  high: "bg-[#FF453A]",
};
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function startOfWeek(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const off = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - off);
  return dt;
}

function sortTasks(list: Task[]) {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return a.id - b.id;
  });
}

export default function PlannerTab({ active }: { active: boolean }) {
  const [view, setView] = useState<ViewMode>("day");
  const [date, setDate] = useState(todayISO());
  const [all, setAll] = useState<Task[] | null>(null);
  const [open, setOpen] = useState(false);
  const [prefillTime, setPrefillTime] = useState<string>("");

  const load = useCallback(async () => {
    try {
      setAll(await jget<Task[]>("/api/tasks"));
    } catch {
      setAll([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  const byDate = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of all ?? []) {
      const arr = m.get(t.date);
      if (arr) arr.push(t);
      else m.set(t.date, [t]);
    }
    for (const [k, v] of m) m.set(k, sortTasks(v));
    return m;
  }, [all]);

  const dayTasks = byDate.get(date) ?? [];
  const done = dayTasks.filter((t) => t.completed).length;
  const total = dayTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const toggle = async (t: Task) => {
    buzz(10);
    const next = !t.completed;
    setAll((l) =>
      l ? l.map((x) => (x.id === t.id ? { ...x, completed: next } : x)) : l,
    );
    try {
      await jsend(`/api/tasks/${t.id}`, "PATCH", { completed: next });
    } catch {
      load();
    }
  };

  const remove = async (t: Task) => {
    buzz(10);
    setAll((l) => (l ? l.filter((x) => x.id !== t.id) : l));
    try {
      await jsend(`/api/tasks/${t.id}`, "DELETE");
    } catch {
      load();
    }
  };

  const openAdd = (time = "") => {
    setPrefillTime(time);
    setOpen(true);
  };

  return (
    <Screen
      title="Plan"
      right={
        <CircleBtn onClick={() => openAdd()}>
          <Plus size={18} strokeWidth={2.5} />
        </CircleBtn>
      }
    >
      {/* Görünüm seçici */}
      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { value: "day", label: "Gün" },
          { value: "week", label: "Hafta" },
          { value: "month", label: "Ay" },
        ]}
      />

      {all === null ? (
        <div className="grid place-items-center py-20">
          <Spinner />
        </div>
      ) : view === "day" ? (
        <DayView
          date={date}
          setDate={setDate}
          tasks={dayTasks}
          done={done}
          total={total}
          pct={pct}
          onToggle={toggle}
          onRemove={remove}
          onAdd={openAdd}
        />
      ) : view === "week" ? (
        <WeekView
          date={date}
          setDate={setDate}
          byDate={byDate}
          onToggle={toggle}
          onJumpDay={(d) => {
            setDate(d);
            setView("day");
          }}
        />
      ) : (
        <MonthView
          date={date}
          byDate={byDate}
          onPickDay={(d) => {
            setDate(d);
            setView("day");
          }}
        />
      )}

      <AddTaskSheet
        open={open}
        onClose={() => setOpen(false)}
        date={date}
        prefillTime={prefillTime}
        onSaved={load}
        onDateChange={setDate}
      />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* GÜN — saatlik zaman çizelgesi                                       */
/* ------------------------------------------------------------------ */

function DayView({
  date,
  setDate,
  tasks,
  done,
  total,
  pct,
  onToggle,
  onRemove,
  onAdd,
}: {
  date: string;
  setDate: (d: string) => void;
  tasks: Task[];
  done: number;
  total: number;
  pct: number;
  onToggle: (t: Task) => void;
  onRemove: (t: Task) => void;
  onAdd: (time?: string) => void;
}) {
  const [layout, setLayout] = useState<"list" | "timeline">("list");

  const days = useMemo(() => {
    const arr: { iso: string; num: number; short: string; isToday: boolean }[] =
      [];
    const start = new Date();
    start.setDate(start.getDate() - 1);
    for (let i = 0; i < 21; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = toISODate(d);
      arr.push({
        iso,
        num: d.getDate(),
        short: dayShortTR(iso),
        isToday: iso === todayISO(),
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    document
      .getElementById(`plan-day-${date}`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [date]);

  const timed = tasks.filter((t) => t.time);
  const untimed = tasks.filter((t) => !t.time);

  const hours = useMemo(() => {
    const used = timed.map((t) => Number(t.time!.slice(0, 2)));
    const min = used.length ? Math.min(6, ...used) : 7;
    const max = used.length ? Math.max(22, ...used) : 22;
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, [timed]);

  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const isToday = date === todayISO();

  return (
    <>
      {/* Gün şeridi */}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {days.map((d) => {
          const selected = d.iso === date;
          return (
            <button
              key={d.iso}
              id={`plan-day-${d.iso}`}
              onClick={() => {
                buzz(8);
                setDate(d.iso);
              }}
              className={`flex w-[50px] shrink-0 flex-col items-center gap-0.5 rounded-[16px] py-2.5 transition-colors ${
                selected
                  ? "bg-[#0A84FF] text-white"
                  : d.isToday
                    ? "bg-[#1C1C1E] text-[#64A8FF] ring-1 ring-[#0A84FF]/40"
                    : "bg-[#1C1C1E] text-white/60"
              }`}
            >
              <span className="text-[11px] font-semibold uppercase">
                {d.short}
              </span>
              <span className="tnum text-[18px] font-bold">{d.num}</span>
            </button>
          );
        })}
      </div>

      {/* İlerleme */}
      <div className="rounded-[22px] border border-white/[0.07] bg-[#1C1C1E] p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] font-medium text-white/45">
              {fullDateTR(date)}
            </p>
            <p className="tnum mt-1 text-[26px] font-bold tracking-tight">
              {done}
              <span className="text-white/35">/{total} görev</span>
            </p>
          </div>
          <p
            className={`tnum text-[15px] font-bold ${
              pct === 100 && total > 0 ? "text-[#30D158]" : "text-[#0A84FF]"
            }`}
          >
            %{pct}
          </p>
        </div>
        <div className="mt-3 h-[6px] overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div
            className={`h-full rounded-full ${
              pct === 100 && total > 0
                ? "bg-gradient-to-r from-[#30D158] to-[#63E68B]"
                : "bg-gradient-to-r from-[#0A84FF] to-[#5AC8FA]"
            }`}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 26 }}
          />
        </div>
      </div>

      {/* Liste / Saatlik geçişi */}
      <SegmentedControl
        value={layout}
        onChange={setLayout}
        options={[
          { value: "list", label: "Liste" },
          { value: "timeline", label: "Saatlik" },
        ]}
      />

      {total === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Bu gün için görev yok"
          sub="Gününü planlamak için ilk görevini ekle."
          action={
            <button
              onClick={() => onAdd()}
              className="flex items-center gap-1.5 rounded-full bg-[#0A84FF] px-4 py-2 text-[14px] font-semibold"
            >
              <Plus size={15} strokeWidth={2.6} /> Görev Ekle
            </button>
          }
        />
      ) : layout === "list" ? (
        <List>
          <AnimatePresence initial={false}>
            {tasks.map((t) => (
              <TaskRow
                key={t.id}
                t={t}
                onToggle={onToggle}
                onRemove={onRemove}
              />
            ))}
          </AnimatePresence>
        </List>
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-white/[0.05] bg-[#1C1C1E]">
          {untimed.length > 0 && (
            <div className="border-b border-white/[0.08] px-3 py-2.5">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-white/35">
                Saatsiz
              </p>
              <div className="flex flex-wrap gap-1.5">
                {untimed.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onToggle(t)}
                    className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                      t.completed
                        ? "bg-white/[0.06] text-white/30 line-through"
                        : "bg-[#0A84FF]/20 text-[#64A8FF]"
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          {hours.map((h) => {
            const items = timed.filter(
              (t) => Number(t.time!.slice(0, 2)) === h,
            );
            const isNow = isToday && Math.floor(nowH) === h;
            return (
              <div
                key={h}
                className="relative flex gap-2.5 border-b border-white/[0.05] px-3 py-1.5 last:border-b-0"
              >
                <span
                  className={`tnum w-[38px] shrink-0 pt-1.5 text-[12px] font-bold ${
                    isNow ? "text-[#FF453A]" : "text-white/30"
                  }`}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
                <div className="min-h-[34px] flex-1 py-1">
                  {items.length === 0 ? (
                    <button
                      onClick={() =>
                        onAdd(`${String(h).padStart(2, "0")}:00`)
                      }
                      className="h-[26px] w-full rounded-[8px] text-left text-[12px] text-white/15 active:bg-white/[0.04]"
                    >
                      + ekle
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {items.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => onToggle(t)}
                          className={`flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-left ${
                            t.completed
                              ? "bg-white/[0.04]"
                              : "bg-gradient-to-r from-[#0A84FF]/25 to-[#0A84FF]/5"
                          }`}
                        >
                          <span
                            className={`h-[26px] w-[3px] shrink-0 rounded-full ${
                              t.completed
                                ? "bg-white/15"
                                : PRIORITY_BG[t.priority] ?? "bg-[#0A84FF]"
                            }`}
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-[14px] font-medium ${
                                t.completed
                                  ? "text-white/30 line-through"
                                  : "text-white"
                              }`}
                            >
                              {t.title}
                            </span>
                            <span className="tnum block text-[11px] text-white/40">
                              {t.time}
                              {t.note ? ` · ${t.note}` : ""}
                            </span>
                          </span>
                          {t.completed && (
                            <Check
                              size={14}
                              strokeWidth={3}
                              className="shrink-0 text-[#30D158]"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {isNow && (
                  <span
                    className="pointer-events-none absolute left-[46px] right-2 h-[1.5px] bg-[#FF453A]"
                    style={{ top: `${(nowH - h) * 100}%` }}
                  >
                    <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-[#FF453A]" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* HAFTA                                                               */
/* ------------------------------------------------------------------ */

function WeekView({
  date,
  setDate,
  byDate,
  onToggle,
  onJumpDay,
}: {
  date: string;
  setDate: (d: string) => void;
  byDate: Map<string, Task[]>;
  onToggle: (t: Task) => void;
  onJumpDay: (d: string) => void;
}) {
  const start = startOfWeek(date);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toISODate(d);
  });

  const shift = (delta: number) => {
    buzz(6);
    const d = new Date(start);
    d.setDate(start.getDate() + delta * 7);
    setDate(toISODate(d));
  };

  const weekTasks = week.flatMap((d) => byDate.get(d) ?? []);
  const wDone = weekTasks.filter((t) => t.completed).length;

  return (
    <>
      <div className="flex items-center justify-between rounded-[18px] border border-white/[0.07] bg-[#1C1C1E] px-3 py-2.5">
        <button
          onClick={() => shift(-1)}
          className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-[#64A8FF]"
          aria-label="Önceki hafta"
        >
          <ChevronLeft size={17} />
        </button>
        <div className="text-center">
          <p className="text-[14px] font-bold">
            {new Intl.DateTimeFormat("tr-TR", {
              day: "numeric",
              month: "short",
            }).format(start)}
            {" – "}
            {new Intl.DateTimeFormat("tr-TR", {
              day: "numeric",
              month: "short",
            }).format(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))}
          </p>
          <p className="tnum text-[11px] font-medium text-white/40">
            {wDone}/{weekTasks.length} görev tamam
          </p>
        </div>
        <button
          onClick={() => shift(1)}
          className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-[#64A8FF]"
          aria-label="Sonraki hafta"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {week.map((iso) => {
        const items = byDate.get(iso) ?? [];
        const isToday = iso === todayISO();
        const d = new Date(
          Number(iso.slice(0, 4)),
          Number(iso.slice(5, 7)) - 1,
          Number(iso.slice(8, 10)),
        );
        const doneN = items.filter((t) => t.completed).length;
        return (
          <div
            key={iso}
            className={`overflow-hidden rounded-[18px] border bg-[#1C1C1E] ${
              isToday ? "border-[#0A84FF]/50" : "border-white/[0.05]"
            }`}
          >
            <button
              onClick={() => onJumpDay(iso)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left"
            >
              <span
                className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px] text-[15px] font-bold ${
                  isToday
                    ? "bg-[#0A84FF] text-white"
                    : "bg-white/[0.07] text-white/70"
                }`}
              >
                {d.getDate()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold">
                  {WEEKDAYS[(d.getDay() + 6) % 7]}
                  {isToday && (
                    <span className="ml-1.5 text-[11px] font-bold text-[#64A8FF]">
                      BUGÜN
                    </span>
                  )}
                </span>
                <span className="tnum block text-[11px] text-white/35">
                  {items.length
                    ? `${doneN}/${items.length} tamamlandı`
                    : "görev yok"}
                </span>
              </span>
              <ChevronRight size={15} className="shrink-0 text-white/25" />
            </button>
            {items.length > 0 && (
              <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                {items.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onToggle(t)}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left"
                  >
                    <span
                      className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-[1.5px] ${
                        t.completed
                          ? "border-[#0A84FF] bg-[#0A84FF]"
                          : "border-white/25"
                      }`}
                    >
                      {t.completed && (
                        <Check size={11} strokeWidth={3.5} />
                      )}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-[13px] ${
                        t.completed ? "text-white/30 line-through" : "text-white/90"
                      }`}
                    >
                      {t.title}
                    </span>
                    {t.time && (
                      <span className="tnum shrink-0 text-[11px] text-white/35">
                        {t.time}
                      </span>
                    )}
                  </button>
                ))}
                {items.length > 4 && (
                  <p className="px-4 py-1.5 text-[11px] text-white/30">
                    +{items.length - 4} görev daha
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* AY                                                                  */
/* ------------------------------------------------------------------ */

function MonthView({
  date,
  byDate,
  onPickDay,
}: {
  date: string;
  byDate: Map<string, Task[]>;
  onPickDay: (d: string) => void;
}) {
  const [mk, setMk] = useState(date.slice(0, 7));
  const [y, m] = mk.split("-").map(Number);
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const dim = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ];

  let monthTotal = 0;
  let monthDone = 0;
  for (let d = 1; d <= dim; d++) {
    const items = byDate.get(`${mk}-${String(d).padStart(2, "0")}`) ?? [];
    monthTotal += items.length;
    monthDone += items.filter((t) => t.completed).length;
  }

  return (
    <>
      <div className="rounded-[22px] border border-white/[0.07] bg-[#1C1C1E] p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => {
              buzz(6);
              setMk(addMonths(mk, -1));
            }}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-[#64A8FF]"
            aria-label="Önceki ay"
          >
            <ChevronLeft size={17} />
          </button>
          <div className="text-center">
            <p className="text-[16px] font-bold">{monthLabelTR(mk)}</p>
            <p className="tnum text-[11px] font-medium text-white/40">
              {monthDone}/{monthTotal} görev tamam
            </p>
          </div>
          <button
            onClick={() => {
              buzz(6);
              setMk(addMonths(mk, 1));
            }}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-[#64A8FF]"
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

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`boş-${i}`} />;
            const iso = `${mk}-${String(day).padStart(2, "0")}`;
            const items = byDate.get(iso) ?? [];
            const allDone = items.length > 0 && items.every((t) => t.completed);
            const isToday = iso === todayISO();
            const isSel = iso === date;
            return (
              <motion.button
                key={iso}
                whileTap={{ scale: 0.88 }}
                onClick={() => {
                  buzz(6);
                  onPickDay(iso);
                }}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-[13px] text-[15px] font-medium ${
                  isSel
                    ? "bg-[#0A84FF] text-white"
                    : items.length
                      ? allDone
                        ? "bg-[#30D158]/15 text-[#63E68B]"
                        : "bg-white/[0.06] text-white/90"
                      : "bg-white/[0.015] text-white/55"
                } ${isToday && !isSel ? "ring-[1.5px] ring-[#0A84FF]" : ""}`}
              >
                <span className="tnum">{day}</span>
                {items.length > 0 && (
                  <span className="absolute bottom-[5px] flex gap-[2px]">
                    {items.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className={`h-[4px] w-[4px] rounded-full ${
                          t.completed
                            ? "bg-white/30"
                            : PRIORITY_BG[t.priority] ?? "bg-[#0A84FF]"
                        }`}
                      />
                    ))}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-[16px] border border-white/[0.06] bg-[#1C1C1E] px-4 py-3">
        <CalendarDays size={15} className="shrink-0 text-white/35" />
        <p className="text-[12px] leading-snug text-white/40">
          Noktalar o günün görevlerini ve önceliklerini gösterir. Bir güne
          dokununca gün görünümüne geçersin.
        </p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Görev satırı                                                        */
/* ------------------------------------------------------------------ */

function TaskRow({
  t,
  onToggle,
  onRemove,
}: {
  t: Task;
  onToggle: (t: Task) => void;
  onRemove: (t: Task) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-3 px-4 py-3"
    >
      <motion.button
        whileTap={{ scale: 0.75 }}
        onClick={() => onToggle(t)}
        className={`grid h-[24px] w-[24px] shrink-0 place-items-center rounded-full border-2 transition-colors ${
          t.completed ? "border-[#0A84FF] bg-[#0A84FF]" : "border-white/25"
        }`}
        aria-label={t.completed ? "Geri al" : "Tamamla"}
      >
        {t.completed && <Check size={14} strokeWidth={3.5} className="text-white" />}
      </motion.button>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[16px] leading-snug ${
            t.completed ? "text-white/30 line-through" : "text-white"
          }`}
        >
          {t.title}
        </p>
        {t.note && (
          <p className="truncate text-[12px] text-white/40">{t.note}</p>
        )}
      </div>
      {t.priority !== "none" && (
        <Flag
          size={13}
          className={`${PRIORITY_COLORS[t.priority] ?? "text-white/40"} shrink-0`}
          fill="currentColor"
        />
      )}
      {t.time && (
        <span className="tnum flex shrink-0 items-center gap-1 text-[13px] text-white/45">
          <Clock size={11} />
          {t.time}
        </span>
      )}
      <button
        onClick={() => onRemove(t)}
        className="shrink-0 text-white/20 transition-colors active:text-[#FF453A]"
        aria-label="Sil"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Görev ekleme                                                        */
/* ------------------------------------------------------------------ */

function AddTaskSheet({
  open,
  onClose,
  date,
  prefillTime,
  onSaved,
  onDateChange,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  prefillTime: string;
  onSaved: () => void;
  onDateChange: (d: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setTime(prefillTime);
      setNote("");
      setPriority("none");
      setSaving(false);
    }
  }, [open, prefillTime]);

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await jsend("/api/tasks", "POST", {
        title: title.trim(),
        date,
        time: time || null,
        note: note.trim() || null,
        priority,
      });
      onSaved();
      onClose();
    } catch {
      /* sessiz */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Yeni Görev" onClose={onClose} />
      <div className="flex flex-col gap-3.5 px-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ne yapacaksın?"
          autoFocus
          className="w-full rounded-[12px] bg-[#2C2C2E] px-4 py-3.5 text-[17px] outline-none placeholder:text-white/25 focus:ring-1 focus:ring-[#0A84FF]/60"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Saat
            </span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="tnum w-full rounded-[12px] bg-[#2C2C2E] px-4 py-3 text-[15px] outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Tarih
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                if (e.target.value) onDateChange(e.target.value);
              }}
              className="tnum w-full rounded-[12px] bg-[#2C2C2E] px-4 py-3 text-[15px] outline-none"
            />
          </label>
        </div>
        <div>
          <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Öncelik
          </p>
          <SegmentedControl
            value={priority}
            onChange={setPriority}
            options={[
              { value: "none", label: "Yok" },
              { value: "low", label: "Düşük" },
              { value: "medium", label: "Orta" },
              { value: "high", label: "Yüksek" },
            ]}
          />
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Not (isteğe bağlı)"
          className="w-full rounded-[12px] bg-[#2C2C2E] px-4 py-3.5 text-[16px] outline-none placeholder:text-white/25"
        />
        <IOSButton onClick={save} disabled={!title.trim() || saving}>
          {saving ? "Kaydediliyor…" : "Görevi Ekle"}
        </IOSButton>
      </div>
    </Sheet>
  );
}
