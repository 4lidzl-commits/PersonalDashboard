"use client";

import { motion } from "framer-motion";
import {
  Anchor,
  ArrowDownLeft,
  ArrowUpRight,
  Bus,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gamepad2,
  Gift,
  HeartPulse,
  House,
  Package,
  Plus,
  Receipt,
  Shirt,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { jget, jsend, type Tx } from "@/lib/api";
import {
  addMonths,
  buzz,
  fmtTRY,
  fullDateTR,
  monthKey,
  monthLabelTR,
  parseISO,
  toISODate,
  todayISO,
} from "@/lib/format";
import {
  CircleBtn,
  EmptyState,
  IconBadge,
  IOSButton,
  Keypad,
  List,
  Screen,
  SectionLabel,
  SegmentedControl,
  Sheet,
  SheetHeader,
  Spinner,
} from "../ios";

type Cat = { key: string; icon: LucideIcon; color: string };

const EXPENSE_CATS: Cat[] = [
  { key: "Yemek", icon: UtensilsCrossed, color: "bg-[#FF9F0A]" },
  { key: "Market", icon: ShoppingCart, color: "bg-[#30D158]" },
  { key: "Ulaşım", icon: Bus, color: "bg-[#0A84FF]" },
  { key: "Fatura", icon: Receipt, color: "bg-[#5E5CE6]" },
  { key: "Kira", icon: House, color: "bg-[#BF5AF2]" },
  { key: "Sağlık", icon: HeartPulse, color: "bg-[#FF453A]" },
  { key: "Eğlence", icon: Gamepad2, color: "bg-[#FF375F]" },
  { key: "Giyim", icon: Shirt, color: "bg-[#64D2FF]" },
  { key: "Diğer", icon: Package, color: "bg-[#8E8E93]" },
];

const INCOME_CATS: Cat[] = [
  { key: "Yevmiye", icon: Anchor, color: "bg-[#30D158]" },
  { key: "Ek Kazanç", icon: Wrench, color: "bg-[#FF9F0A]" },
  { key: "Prim", icon: Gift, color: "bg-[#BF5AF2]" },
  { key: "Diğer", icon: CircleDollarSign, color: "bg-[#0A84FF]" },
];

const CAT_MAP = new Map<string, Cat>(
  [...EXPENSE_CATS, ...INCOME_CATS].map((c) => [c.key, c]),
);

function prettyAmount(v: string): string {
  if (!v) return "₺0";
  const [int, frac] = v.split(",");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return "₺" + grouped + (frac !== undefined ? "," + frac : "");
}

export default function FinanceTab({ active }: { active: boolean }) {
  const [month, setMonth] = useState(monthKey());
  const [txs, setTxs] = useState<Tx[] | null>(null);
  const [allTx, setAllTx] = useState<Tx[] | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [open, setOpen] = useState(false);

  const load = useCallback(async (m: string) => {
    const [rows, all] = await Promise.all([
      jget<Tx[]>(`/api/transactions?month=${m}`).catch(() => [] as Tx[]),
      jget<Tx[]>("/api/transactions").catch(() => [] as Tx[]),
    ]);
    setTxs(rows);
    setAllTx(all);
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  useEffect(() => {
    if (active) load(month);
  }, [active, month, load]);

  const income = useMemo(
    () => (txs ?? []).filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0),
    [txs],
  );
  const expense = useMemo(
    () => (txs ?? []).filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0),
    [txs],
  );
  const net = income - expense;

  const filtered = useMemo(
    () => (txs ?? []).filter((t) => filter === "all" || t.type === filter),
    [txs, filter],
  );

  const groups = useMemo(() => {
    const g: { date: string; items: Tx[] }[] = [];
    for (const t of filtered) {
      const last = g[g.length - 1];
      if (last && last.date === t.date) last.items.push(t);
      else g.push({ date: t.date, items: [t] });
    }
    return g;
  }, [filtered]);

  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of txs ?? []) {
      if (t.type !== "expense") continue;
      m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [txs]);

  const chart = useMemo(() => {
    const now = monthKey();
    const arr: { key: string; label: string; net: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const k = addMonths(now, -i);
      let s = 0;
      for (const t of allTx ?? []) {
        if (!t.date.startsWith(k)) continue;
        s += t.type === "income" ? t.amount : -t.amount;
      }
      arr.push({
        key: k,
        label: new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(
          parseISO(`${k}-01`),
        ),
        net: s,
      });
    }
    return arr;
  }, [allTx]);

  const maxAbs = Math.max(1, ...chart.map((c) => Math.abs(c.net)));

  const remove = async (t: Tx) => {
    buzz(10);
    setTxs((l) => (l ? l.filter((x) => x.id !== t.id) : l));
    try {
      await jsend(`/api/transactions/${t.id}`, "DELETE");
    } catch {
      load(month);
    }
  };

  const dateLabel = (iso: string) => {
    if (iso === todayISO()) return "Bugün";
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    if (iso === toISODate(yest)) return "Dün";
    return fullDateTR(iso);
  };

  return (
    <Screen
      title="Finans"
      right={
        <CircleBtn onClick={() => setOpen(true)}>
          <Plus size={18} strokeWidth={2.5} />
        </CircleBtn>
      }
    >
      {/* Ay özeti */}
      <div className="rounded-[26px] border border-white/[0.07] bg-gradient-to-b from-[#12233F] via-[#16304F] to-[#123B33] p-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              buzz(6);
              setMonth(addMonths(month, -1));
            }}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 active:bg-white/20"
            aria-label="Önceki ay"
          >
            <ChevronLeft size={17} />
          </button>
          <p className="text-[15px] font-semibold">{monthLabelTR(month)}</p>
          <button
            onClick={() => {
              buzz(6);
              setMonth(addMonths(month, 1));
            }}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 active:bg-white/20"
            aria-label="Sonraki ay"
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <p className="mt-4 text-center text-[12px] font-semibold uppercase tracking-[0.12em] text-white/50">
          Net Durum
        </p>
        <p
          className={`tnum mt-1 text-center text-[42px] font-extralight tracking-tight ${
            net < 0 ? "text-[#FF6961]" : ""
          }`}
        >
          {fmtTRY(net)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 rounded-[14px] bg-black/25 px-3.5 py-3">
            <ArrowDownLeft size={18} className="shrink-0 text-[#30D158]" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white/55">Gelir</p>
              <p className="tnum truncate text-[15px] font-bold text-[#63E68B]">
                {fmtTRY(income)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-[14px] bg-black/25 px-3.5 py-3">
            <ArrowUpRight size={18} className="shrink-0 text-[#FF453A]" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white/55">Gider</p>
              <p className="tnum truncate text-[15px] font-bold text-[#FF9F97]">
                {fmtTRY(expense)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6 aylık grafik */}
      <div>
        <SectionLabel className="mb-2">Son 6 Ay · Net</SectionLabel>
        <div className="rounded-[22px] border border-white/[0.07] bg-[#1C1C1E] px-4 pb-3 pt-4">
          <div className="flex h-[96px] items-end gap-2">
            {chart.map((c) => {
              const h = Math.max(5, (Math.abs(c.net) / maxAbs) * 84);
              return (
                <div
                  key={c.key}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <motion.div
                    initial={{ height: 4 }}
                    animate={{ height: h }}
                    transition={{ type: "spring", stiffness: 170, damping: 24 }}
                    className={`w-full max-w-[34px] rounded-[8px] ${
                      c.net >= 0
                        ? "bg-gradient-to-t from-[#1F7A45] to-[#30D158]"
                        : "bg-gradient-to-t from-[#8E2A24] to-[#FF453A]"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-semibold ${
                      c.key === monthKey() ? "text-[#64A8FF]" : "text-white/40"
                    }`}
                  >
                    {c.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gider dağılımı */}
      {byCat.length > 0 && (
        <div>
          <SectionLabel className="mb-2">Gider Dağılımı · {monthLabelTR(month)}</SectionLabel>
          <List>
            {byCat.map(([key, amount]) => {
              const c = CAT_MAP.get(key) ?? EXPENSE_CATS[8];
              const pctVal = expense > 0 ? (amount / expense) * 100 : 0;
              return (
                <div key={key} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <IconBadge icon={c.icon} color={c.color} />
                    <p className="flex-1 text-[15px] font-medium">{key}</p>
                    <p className="tnum text-[15px] font-semibold">
                      {fmtTRY(amount)}
                    </p>
                  </div>
                  <div className="ml-[42px] mt-2 h-[4px] overflow-hidden rounded-full bg-white/[0.07]">
                    <motion.div
                      className={`h-full rounded-full ${c.color}`}
                      animate={{ width: `${pctVal}%` }}
                      transition={{ type: "spring", stiffness: 140, damping: 24 }}
                    />
                  </div>
                </div>
              );
            })}
          </List>
        </div>
      )}

      {/* İşlemler */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <SectionLabel>İşlemler</SectionLabel>
          <SegmentedControl
            className="w-[190px]"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "Tümü" },
              { value: "income", label: "Gelir" },
              { value: "expense", label: "Gider" },
            ]}
          />
        </div>
        {txs === null ? (
          <div className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Bu ay için işlem yok"
            sub="Sağ üstteki + düğmesiyle gelir veya gider ekle."
          />
        ) : (
          groups.map((g) => (
            <div key={g.date} className="mb-4">
              <p className="mb-1.5 px-1 text-[12px] font-semibold text-white/40">
                {dateLabel(g.date)}
              </p>
              <List>
                {g.items.map((t) => {
                  const c = CAT_MAP.get(t.category) ?? EXPENSE_CATS[8];
                  const isIncome = t.type === "income";
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <IconBadge icon={c.icon} color={c.color} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">
                          {t.note || t.category}
                        </p>
                        {t.note && (
                          <p className="truncate text-[12px] text-white/40">
                            {t.category}
                          </p>
                        )}
                      </div>
                      <p
                        className={`tnum shrink-0 text-[15px] font-semibold ${
                          isIncome ? "text-[#30D158]" : "text-white"
                        }`}
                      >
                        {isIncome ? "+" : "−"}
                        {fmtTRY(t.amount)}
                      </p>
                      <button
                        onClick={() => remove(t)}
                        className="shrink-0 text-white/20 transition-colors active:text-[#FF453A]"
                        aria-label="Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </List>
            </div>
          ))
        )}
      </div>

      <AddTxSheet
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => load(month)}
      />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Yeni işlem sayfası                                                  */
/* ------------------------------------------------------------------ */

function AddTxSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("Yemek");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType("expense");
      setAmount("");
      setCat("Yemek");
      setNote("");
      setDate(todayISO());
      setSaving(false);
    }
  }, [open]);

  const cats = type === "expense" ? EXPENSE_CATS : INCOME_CATS;
  const amtNum = Number(amount.replace(",", "."));
  const valid = Number.isFinite(amtNum) && amtNum > 0;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await jsend("/api/transactions", "POST", {
        type,
        amount: amtNum,
        category: cat,
        note: note.trim() || null,
        date,
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
      <SheetHeader title="Yeni İşlem" onClose={onClose} />
      <div className="flex flex-col gap-3.5 px-5">
        <SegmentedControl
          value={type}
          onChange={(t) => {
            setType(t);
            setCat(t === "expense" ? "Yemek" : "Yevmiye");
          }}
          options={[
            { value: "expense", label: "Gider" },
            { value: "income", label: "Gelir" },
          ]}
        />
        <p
          className={`tnum py-1 text-center text-[46px] font-extralight tracking-tight ${
            type === "income" ? "text-[#30D158]" : "text-white"
          }`}
        >
          {prettyAmount(amount)}
        </p>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5">
          {cats.map((c) => {
            const sel = cat === c.key;
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                onClick={() => {
                  buzz(6);
                  setCat(c.key);
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[14px] font-medium transition-colors ${
                  sel
                    ? "border-white/60 bg-white/15 text-white"
                    : "border-white/10 bg-white/[0.05] text-white/60"
                }`}
              >
                <Icon size={15} />
                {c.key}
              </button>
            );
          })}
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Açıklama (isteğe bağlı)"
          className="w-full rounded-[12px] bg-[#2C2C2E] px-4 py-3.5 text-[16px] outline-none placeholder:text-white/25"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="tnum w-full rounded-[12px] bg-[#2C2C2E] px-4 py-3 text-[15px] outline-none"
        />
        <Keypad value={amount} onChange={setAmount} />
        <IOSButton
          color={type === "income" ? "bg-[#30D158]" : "bg-[#FF453A]"}
          disabled={!valid || saving}
          onClick={save}
        >
          {saving
            ? "Kaydediliyor…"
            : type === "income"
              ? "Geliri Kaydet"
              : "Gideri Kaydet"}
        </IOSButton>
      </div>
    </Sheet>
  );
}
