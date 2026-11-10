"use client";

import { motion } from "framer-motion";
import {
  Banknote,
  HardHat,
  House,
  ListChecks,
  Moon,
  type LucideIcon,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { jget, jsend, type Settings } from "@/lib/api";
import { buzz, todayISO } from "@/lib/format";
import FocusTab from "./tabs/FocusTab";
import FinanceTab from "./tabs/FinanceTab";
import HomeTab from "./tabs/HomeTab";
import PlannerTab from "./tabs/PlannerTab";
import WorkTab from "./tabs/WorkTab";

/* ------------------------------------------------------------------ */
/* Tipler                                                              */
/* ------------------------------------------------------------------ */

export type TabId = "home" | "plan" | "focus" | "finance" | "work";

type FocusPhase = "idle" | "running" | "paused";

type FocusCtl = {
  durationMin: number;
  setDuration: (m: number) => void;
  remaining: number;
  phase: FocusPhase;
  start: () => void;
  pause: () => void;
  reset: () => void;
  version: number;
  justCompleted: boolean;
  subject: string;
  setSubject: (s: string) => void;
};

/* ------------------------------------------------------------------ */
/* Bağlamlar                                                           */
/* ------------------------------------------------------------------ */

const TabNavCtx = createContext<(id: TabId) => void>(() => {});
const FocusCtx = createContext<FocusCtl | null>(null);
const SettingsCtx = createContext<{
  settings: Settings;
  loaded: boolean;
  save: (patch: Settings) => Promise<void>;
} | null>(null);

/** Kazanç gizliliği — her açılışta gizli başlar, kalıcı değildir. */
const PrivacyCtx = createContext<{
  hidden: boolean;
  toggle: () => void;
} | null>(null);

export function usePrivacy() {
  const ctx = useContext(PrivacyCtx);
  if (!ctx) throw new Error("PrivacyCtx eksik");
  return ctx;
}

/** Gizliyse tutarı noktalarla maskeler. */
export function mask(value: string, hidden: boolean): string {
  return hidden ? "••••" : value;
}

export function useTabNav() {
  return useContext(TabNavCtx);
}

export function useFocus() {
  const ctx = useContext(FocusCtx);
  if (!ctx) throw new Error("FocusCtx eksik");
  return ctx;
}

export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("SettingsCtx eksik");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Sekme tanımları                                                     */
/* ------------------------------------------------------------------ */

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Bugün", icon: House },
  { id: "plan", label: "Plan", icon: ListChecks },
  { id: "focus", label: "Odak", icon: Moon },
  { id: "finance", label: "Finans", icon: Banknote },
  { id: "work", label: "Yevmiye", icon: HardHat },
];

const TAB_COMPONENTS: Record<TabId, (p: { active: boolean }) => ReactNode> = {
  home: HomeTab,
  plan: PlannerTab,
  focus: FocusTab,
  finance: FinanceTab,
  work: WorkTab,
};

/* ------------------------------------------------------------------ */
/* Kabuk                                                               */
/* ------------------------------------------------------------------ */

export default function AppShell() {
  const [active, setActive] = useState<TabId>("home");

  /* Gizlilik: uygulama her açıldığında kazançlar gizli */
  const [moneyHidden, setMoneyHidden] = useState(true);
  const togglePrivacy = useCallback(() => {
    buzz(10);
    setMoneyHidden((v) => !v);
  }, []);

  /* Ayarlar */
  const [settings, setSettings] = useState<Settings>({
    name: "Kaptan",
    wage: "1500",
    city: "İstanbul",
    cityDetail: "",
    lat: "",
    lon: "",
    clockStyle: "minimal",
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    jget<Settings>("/api/settings")
      .then((s) => {
        setSettings(s);
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));
  }, []);

  const saveSettings = useCallback(
    async (patch: Settings) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      try {
        const s = await jsend<Settings>("/api/settings", "PUT", patch);
        setSettings(s);
      } catch {
        /* sessiz */
      }
    },
    [],
  );

  /* Odak sayacı — sekmeler arasında yaşar */
  const [durationMin, setDurationMin] = useState(25);
  const [phase, setPhase] = useState<FocusPhase>("idle");
  const [remaining, setRemaining] = useState(25 * 60);
  const [version, setVersion] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const [subject, setSubject] = useState("");
  const remainingRef = useRef(remaining);
  const endRef = useRef(0);
  const subjectRef = useRef(subject);
  subjectRef.current = subject;
  remainingRef.current = remaining;

  const durationRef = useRef(durationMin);
  durationRef.current = durationMin;

  const setDuration = useCallback(
    (m: number) => {
      setDurationMin(m);
      if (phase === "idle") setRemaining(m * 60);
    },
    [phase],
  );

  useEffect(() => {
    if (phase !== "running") return;
    endRef.current = Date.now() + remainingRef.current * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
    }, 250);
    return () => clearInterval(id);
  }, [phase]);

  /* Tamamlanma */
  useEffect(() => {
    if (phase === "running" && remaining === 0) {
      setPhase("idle");
      const mins = durationRef.current;
      setRemaining(mins * 60);
      buzz(280);
      setTimeout(() => buzz(280), 350);
      jsend("/api/focus", "POST", {
        minutes: mins,
        date: todayISO(),
        subject: subjectRef.current.trim() || null,
      })
        .then(() => setVersion((v) => v + 1))
        .catch(() => {});
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 4500);
    }
  }, [remaining, phase]);

  const focusCtl: FocusCtl = {
    durationMin,
    setDuration,
    remaining,
    phase,
    start: () => {
      buzz(12);
      setPhase("running");
    },
    pause: () => {
      buzz(12);
      setPhase("paused");
    },
    reset: () => {
      buzz(10);
      setPhase("idle");
      setRemaining(durationRef.current * 60);
    },
    version,
    justCompleted,
    subject,
    setSubject,
  };

  const focusBusy = phase !== "idle";

  return (
    <TabNavCtx.Provider value={setActive}>
      <SettingsCtx.Provider
        value={{ settings, loaded: settingsLoaded, save: saveSettings }}
      >
        <PrivacyCtx.Provider
          value={{ hidden: moneyHidden, toggle: togglePrivacy }}
        >
        <FocusCtx.Provider value={focusCtl}>
          {/* Masaüstünde ambiyans */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 hidden sm:block"
          >
            <div className="absolute left-1/4 top-[-10%] h-[420px] w-[420px] rounded-full bg-[#0A84FF]/[0.08] blur-[130px]" />
            <div className="absolute right-1/4 bottom-[-10%] h-[420px] w-[420px] rounded-full bg-[#30D158]/[0.07] blur-[130px]" />
          </div>

          <div className="relative mx-auto h-dvh w-full max-w-[430px] overflow-hidden bg-black sm:border-x sm:border-white/[0.08]">
            {TABS.map((t) => {
              const Cmp = TAB_COMPONENTS[t.id];
              const isActive = active === t.id;
              return (
                <section
                  key={t.id}
                  className={`absolute inset-0 ${isActive ? "" : "hidden"}`}
                >
                  <motion.div
                    initial={false}
                    animate={
                      isActive
                        ? { opacity: 1, x: 0, scale: 1 }
                        : { opacity: 0, x: 14, scale: 0.996 }
                    }
                    transition={
                      isActive
                        ? { type: "spring", stiffness: 340, damping: 33 }
                        : { duration: 0.14 }
                    }
                    className="h-full"
                  >
                    <Cmp active={isActive} />
                  </motion.div>
                </section>
              );
            })}

            {/* Sekme çubuğu */}
            <nav
              className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0A0A0C]/85 backdrop-blur-2xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-stretch px-1.5">
                {TABS.map((t) => {
                  const isActive = active === t.id;
                  const Icon = t.icon;
                  return (
                    <motion.button
                      key={t.id}
                      type="button"
                      whileTap={{ scale: 0.8 }}
                      onClick={() => {
                        if (!isActive) buzz(8);
                        setActive(t.id);
                      }}
                      className="relative flex flex-1 flex-col items-center gap-[3px] pb-1.5 pt-2"
                    >
                      <span className="relative">
                        <Icon
                          size={24}
                          strokeWidth={isActive ? 2.2 : 1.7}
                          className={
                            isActive ? "text-[#0A84FF]" : "text-[#7A7A7E]"
                          }
                        />
                        {t.id === "focus" && focusBusy && (
                          <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-[#30D158] ring-2 ring-[#0A0A0C]" />
                        )}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          isActive ? "text-[#0A84FF]" : "text-[#7A7A7E]"
                        }`}
                      >
                        {t.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </nav>
          </div>
        </FocusCtx.Provider>
        </PrivacyCtx.Provider>
      </SettingsCtx.Provider>
    </TabNavCtx.Provider>
  );
}
