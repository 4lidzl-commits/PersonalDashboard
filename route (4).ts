import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId))
    return Response.json({ error: "Geçersiz id" }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Geçersiz gövde" }, { status: 400 });

  const patch: Partial<{
    title: string;
    completed: boolean;
    time: string | null;
    priority: string;
    note: string | null;
    date: string;
  }> = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.completed === "boolean") patch.completed = body.completed;
  if (typeof body.time === "string" || body.time === null)
    patch.time = body.time;
  if (typeof body.priority === "string") patch.priority = body.priority;
  if (typeof body.note === "string" || body.note === null)
    patch.note = body.note;
  if (typeof body.date === "string") patch.date = body.date;

  const [row] = await db
    .update(tasks)
    .set(patch)
    .where(eq(tasks.id, numericId))
    .returning();
  if (!row) return Response.json({ error: "Bulunamadı" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId))
    return Response.json({ error: "Geçersiz id" }, { status: 400 });
  const [row] = await db
    .delete(tasks)
    .where(eq(tasks.id, numericId))
    .returning();
  if (!row) return Response.json({ error: "Bulunamadı" }, { status: 404 });
  return Response.json({ ok: true });
}
