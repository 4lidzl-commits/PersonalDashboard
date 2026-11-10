export type Task = {
  id: number;
  title: string;
  note: string | null;
  time: string | null;
  date: string;
  priority: string;
  completed: boolean;
};

export type Tx = {
  id: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string | null;
  date: string;
};

export type WorkDay = {
  id: number;
  date: string;
  multiplier: number;
  note: string | null;
};

export type FocusSession = {
  id: number;
  minutes: number;
  subject: string | null;
  date: string;
  createdAt: string;
};

export type Settings = Record<string, string>;

export type WxHour = {
  t: string;
  temp: number;
  code: number;
  prob: number;
  isDay: boolean;
};

export type WxDay = {
  date: string;
  code: number;
  min: number;
  max: number;
  prob: number;
  uv: number;
  sunrise: string;
  sunset: string;
};

export type WxData = {
  city: string;
  country: string;
  region: string;
  current: {
    temp: number;
    feels: number;
    humidity: number;
    wind: number;
    windDir: number;
    pressure: number;
    code: number;
    isDay: boolean;
    desc: string;
    high: number;
    low: number;
  };
  hourly: WxHour[];
  daily: WxDay[];
};

export async function jget<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET ${url} başarısız: ${r.status}`);
  return (await r.json()) as T;
}

export async function jsend<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`${method} ${url} başarısız: ${r.status} ${txt}`);
  }
  return (await r.json()) as T;
}
