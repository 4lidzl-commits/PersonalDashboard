import { db } from "@/db";
import { focusSessions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const rows = date
    ? await db
        .select()
        .from(focusSessions)
        .where(eq(focusSessions.date, date))
        .orderBy(desc(focusSessions.id))
    : await db.select().from(focusSessions).orderBy(desc(focusSessions.id));
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Geçersiz gövde" }, { status: 400 });
  const minutes = Math.round(Number(body.minutes));
  const date = String(body.date ?? "");
  const subject = body.subject ? String(body.subject).slice(0, 80) : null;
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 600)
    return Response.json({ error: "Geçersiz süre" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return Response.json({ error: "date gerekli" }, { status: 400 });
  const [row] = await db
    .insert(focusSessions)
    .values({ minutes, date, subject })
    .returning();
  return Response.json(row, { status: 201 });
}
