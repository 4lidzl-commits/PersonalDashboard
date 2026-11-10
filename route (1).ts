import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export type GeoHit = {
  id: string;
  name: string;
  detail: string;
  lat: number;
  lon: number;
  kind: string;
};

const KIND_TR: Record<string, string> = {
  city: "Şehir",
  town: "İlçe",
  village: "Köy",
  suburb: "Semt",
  neighbourhood: "Mahalle",
  quarter: "Mahalle",
  hamlet: "Mezra",
  county: "İlçe",
  state: "İl",
  province: "İl",
  administrative: "Bölge",
  residential: "Yerleşim",
  road: "Cadde",
  isolated_dwelling: "Yerleşim",
};

type NominatimItem = {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  type?: string;
  addresstype?: string;
  address?: Record<string, string>;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json([]);

  try {
    const url =
      "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({
        q,
        format: "jsonv2",
        addressdetails: "1",
        limit: "12",
        "accept-language": "tr",
      });

    const res = await fetch(url, {
      headers: {
        "User-Agent": "KaptanApp/1.0 (kisisel kontrol merkezi)",
        "Accept-Language": "tr",
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return Response.json([]);
    const rows = (await res.json()) as NominatimItem[];

    const hits: GeoHit[] = rows.map((r) => {
      const a = r.address ?? {};
      const name =
        r.name?.trim() ||
        a.neighbourhood ||
        a.suburb ||
        a.village ||
        a.town ||
        a.city ||
        r.display_name.split(",")[0];

      const parts = [
        a.suburb && a.suburb !== name ? a.suburb : null,
        a.town || a.city || a.municipality || a.county || null,
        a.province || a.state || null,
        a.country || null,
      ].filter((p): p is string => !!p);

      const detail = [...new Set(parts)].join(", ");
      const rawKind = r.addresstype || r.type || "";

      return {
        id: String(r.place_id),
        name,
        detail: detail || r.display_name,
        lat: Number(r.lat),
        lon: Number(r.lon),
        kind: KIND_TR[rawKind] ?? "",
      };
    });

    // Türkiye sonuçlarını öne al, aynı isim+detay tekrarlarını ayıkla
    const seen = new Set<string>();
    const unique = hits.filter((h) => {
      const k = `${h.name}|${h.detail}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    unique.sort((a, b) => {
      const at = a.detail.includes("Türkiye") ? 0 : 1;
      const bt = b.detail.includes("Türkiye") ? 0 : 1;
      return at - bt;
    });

    return Response.json(unique.slice(0, 8));
  } catch {
    return Response.json([]);
  }
}
