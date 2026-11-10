import { db } from "@/db";
import { tasks } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const rows = date
    ? await db
        .select()
        .from(tasks)
        .where(eq(tasks.date, date))
        .orderBy(
          asc(tasks.completed),
          sql`${tasks.time} asc nulls last`,
          asc(tasks.id),
        )
    : await db.select().from(tasks).orderBy(asc(tasks.date), asc(tasks.id));
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Geçersiz gövde" }, { status: 400 });
  const title = String(body.title ?? "").trim();
  const date = String(body.date ?? "");
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "title ve date gerekli" }, { status: 400 });
  }
  const [row] = await db
    .insert(tasks)
    .values({
      title,
      date,
      time: body.time ? String(body.time) : null,
      priority: typeof body.priority === "string" ? body.priority : "none",
      note: body.note ? String(body.note) : null,
    })
    .returning();
  return Response.json(row, { status: 201 });
}
