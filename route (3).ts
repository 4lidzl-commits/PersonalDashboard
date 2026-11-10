import { db } from "@/db";
import { settings } from "@/db/schema";

export const dynamic = "force-dynamic";

const DEFAULTS: Record<string, string> = {
  name: "Kaptan",
  wage: "1500",
  city: "İstanbul",
  cityDetail: "",
  lat: "",
  lon: "",
  clockStyle: "minimal",
};

export async function GET() {
  const rows = await db.select().from(settings);
  const map: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) map[r.key] = r.value;
  return Response.json(map);
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return Response.json({ error: "Geçersiz gövde" }, { status: 400 });

  for (const [key, raw] of Object.entries(body as Record<string, unknown>)) {
    if (typeof raw !== "string" && typeof raw !== "number") continue;
    const value = String(raw).slice(0, 200);
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  return GET();
}
