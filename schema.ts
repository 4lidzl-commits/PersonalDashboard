import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  note: text("note"),
  time: text("time"),
  date: text("date").notNull(), // YYYY-MM-DD (cihazın yerel tarihi)
  priority: text("priority").notNull().default("none"), // none | low | medium | high
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // income | expense
  amount: doublePrecision("amount").notNull(),
  category: text("category").notNull(),
  note: text("note"),
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workDays = pgTable("work_days", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // YYYY-MM-DD
  multiplier: real("multiplier").notNull(), // 1 | 1.5 | 2
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const focusSessions = pgTable("focus_sessions", {
  id: serial("id").primaryKey(),
  minutes: integer("minutes").notNull(),
  subject: text("subject"),
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type WorkDay = typeof workDays.$inferSelect;
export type FocusSession = typeof focusSessions.$inferSelect;
