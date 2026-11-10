"use client";

import { motion } from "framer-motion";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GeoHit } from "@/app/api/geo/search/route";
import { jget } from "@/lib/api";
import { buzz } from "@/lib/format";
import { Sheet, SheetHeader, Spinner } from "./ios";

export type PickedPlace = {
  label: string;
  detail: string;
  lat: number;
  lon: number;
};

const QUICK = [
  "Tuzla, İstanbul",
  "Pendik, İstanbul",
  "Gebze, Kocaeli",
  "Yalova",
  "Kadıköy, İstanbul",
  "Altınova, Yalova",
];

export default function LocationPicker({
  open,
  onClose,
  onPick,
  current,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (p: PickedPlace) => void;
  current: string;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<GeoHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (open) {
      setQ("");
      setHits(null);
      setErr(null);
    }
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const rows = await jget<GeoHit[]>(
          `/api/geo/search?q=${encodeURIComponent(term)}`,
        );
        if (reqId.current === id) {
          setHits(rows);
          setLoading(false);
        }
      } catch {
        if (reqId.current === id) {
          setHits([]);
          setLoading(false);
        }
      }
    }, 420);
    return () => clearTimeout(timer);
  }, [q]);

  const pick = (p: PickedPlace) => {
    buzz(10);
    onPick(p);
    onClose();
  };

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErr("Cihazın konum servisini desteklemiyor.");
      return;
    }
    setGeoBusy(true);
    setErr(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const rows = await jget<GeoHit[]>(
            `/api/geo/search?q=${latitude.toFixed(5)},${longitude.toFixed(5)}`,
          );
          const best = rows[0];
          pick({
            label: best?.name ?? "Konumum",
            detail: best?.detail ?? "Mevcut konum",
            lat: latitude,
            lon: longitude,
          });
        } catch {
          pick({
            label: "Konumum",
            detail: "Mevcut konum",
            lat: latitude,
            lon: longitude,
          });
        } finally {
          setGeoBusy(false);
        }
      },
      () => {
        setGeoBusy(false);
        setErr("Konum izni alınamadı. Arama yaparak seçebilirsin.");
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Konum Seç" onClose={onClose} />
      <div className="flex flex-col gap-3 px-5">
        {/* Arama */}
        <div className="flex items-center gap-2.5 rounded-[12px] bg-[#2C2C2E] px-3.5">
          <Search size={17} className="shrink-0 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="Mahalle, ilçe veya şehir ara…"
            className="w-full bg-transparent py-3 text-[16px] outline-none placeholder:text-white/25"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="shrink-0 text-white/30"
              aria-label="Temizle"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Konumumu kullan */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={useMyLocation}
          disabled={geoBusy}
          className="flex items-center gap-3 rounded-[14px] border border-[#0A84FF]/30 bg-[#0A84FF]/12 px-4 py-3 text-left"
        >
          <LocateFixed size={18} className="shrink-0 text-[#64A8FF]" />
          <span className="flex-1 text-[15px] font-semibold text-[#64A8FF]">
            {geoBusy ? "Konum alınıyor…" : "Mevcut konumumu kullan"}
          </span>
          {geoBusy && <Spinner className="!h-4 !w-4" />}
        </motion.button>

        {err && (
          <p className="px-1 text-[12px] text-[#FF9F97]">{err}</p>
        )}

        <p className="px-1 text-[12px] text-white/35">
          Şu anki konum: <span className="text-white/60">{current}</span>
        </p>

        {/* Sonuçlar */}
        {q.trim().length < 2 ? (
          <div>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Hızlı Seçim
            </p>
            <div className="flex flex-wrap gap-2 pb-2">
              {QUICK.map((s) => (
                <button
                  key={s}
                  onClick={() => setQ(s)}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-[13px] font-medium text-white/70"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : hits && hits.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-white/40">
            Sonuç bulunamadı. Farklı bir yazım dene.
          </p>
        ) : (
          <div className="divide-y divide-white/[0.08] overflow-hidden rounded-[16px] border border-white/[0.05] bg-[#1C1C1E]">
            {(hits ?? []).map((h) => (
              <motion.button
                key={h.id}
                whileTap={{ scale: 0.985 }}
                onClick={() =>
                  pick({
                    label: h.name,
                    detail: h.detail,
                    lat: h.lat,
                    lon: h.lon,
                  })
                }
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[#0A84FF]">
                  <MapPin size={15} strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-semibold">
                      {h.name}
                    </span>
                    {h.kind && (
                      <span className="shrink-0 rounded-full bg-white/[0.08] px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide text-white/50">
                        {h.kind}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-white/40">
                    {h.detail}
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        )}
        <p className="pb-2 pt-1 text-center text-[10px] text-white/25">
          Adres araması: OpenStreetMap / Nominatim
        </p>
      </div>
    </Sheet>
  );
}
