import { db } from "@/db";
import { transactions } from "@/db/schema";
import { desc, like } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month");
  const rows = month
    ? await db
        .select()
        .from(transactions)
        .where(like(transactions.date, `${month}-%`))
        .orderBy(desc(transactions.date), desc(transactions.id))
    : await db
        .select()
        .from(transactions)
        .orderBy(desc(transactions.date), desc(transactions.id));
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Geçersiz gövde" }, { status: 400 });
  const type = body.type === "income" ? "income" : body.type === "expense" ? "expense" : null;
  const amount = Number(body.amount);
  const category = String(body.category ?? "Diğer").trim() || "Diğer";
  const date = String(body.date ?? "");
  if (!type || !Number.isFinite(amount) || amount <= 0)
    return Response.json({ error: "type ve pozitif amount gerekli" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return Response.json({ error: "date gerekli" }, { status: 400 });

  const [row] = await db
    .insert(transactions)
    .values({
      type,
      amount,
      category,
      note: body.note ? String(body.note) : null,
      date,
    })
    .returning();
  return Response.json(row, { status: 201 });
}
