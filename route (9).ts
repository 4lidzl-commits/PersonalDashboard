import { db } from "@/db";
import { workDays } from "@/db/schema";
import { asc, eq, like } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month");
  const rows = month
    ? await db
        .select()
        .from(workDays)
        .where(like(workDays.date, `${month}-%`))
        .orderBy(asc(workDays.date))
    : await db.select().from(workDays).orderBy(asc(workDays.date));
  return Response.json(rows);
}

/** Çarpan 0 gönderilirse kayıt silinir (çalışılmadı). Not gönderilmezse mevcut not korunur. */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Geçersiz gövde" }, { status: 400 });
  const date = String(body.date ?? "");
  const multiplier = Number(body.multiplier);
  const noteProvided = body.note !== undefined;
  const note = body.note ? String(body.note).slice(0, 240) : null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return Response.json({ error: "date gerekli" }, { status: 400 });
  if (![0, 1, 1.5, 2].includes(multiplier))
    return Response.json(
      { error: "multiplier 0, 1, 1.5 veya 2 olmalı" },
      { status: 400 },
    );

  if (multiplier === 0) {
    await db.delete(workDays).where(eq(workDays.date, date));
    return Response.json({ ok: true, deleted: true, date });
  }

  const [row] = await db
    .insert(workDays)
    .values({ date, multiplier, note })
    .onConflictDoUpdate({
      target: workDays.date,
      set: noteProvided ? { multiplier, note } : { multiplier },
    })
    .returning();
  return Response.json(row);
}
