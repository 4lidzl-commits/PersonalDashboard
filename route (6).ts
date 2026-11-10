import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId))
    return Response.json({ error: "Geçersiz id" }, { status: 400 });
  const [row] = await db
    .delete(transactions)
    .where(eq(transactions.id, numericId))
    .returning();
  if (!row) return Response.json({ error: "Bulunamadı" }, { status: 404 });
  return Response.json({ ok: true });
}
