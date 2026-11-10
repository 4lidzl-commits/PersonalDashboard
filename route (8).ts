import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const WMO_TR: Record<number, string> = {
  0: "Açık",
  1: "Az Bulutlu",
  2: "Parçalı Bulutlu",
  3: "Kapalı",
  45: "Sisli",
  48: "Kırağılı Sis",
  51: "Hafif Çisenti",
  53: "Çisenti",
  55: "Yoğun Çisenti",
  56: "Dondurucu Çisenti",
  57: "Dondurucu Çisenti",
  61: "Hafif Yağmur",
  63: "Yağmurlu",
  65: "Şiddetli Yağmur",
  66: "Dondurucu Yağmur",
  67: "Dondurucu Yağmur",
  71: "Hafif Kar",
  73: "Karlı",
  75: "Yoğun Kar",
  77: "Kar Taneleri",
  80: "Hafif Sağanak",
  81: "Sağanak Yağmur",
  82: "Şiddetli Sağanak",
  85: "Kar Sağanağı",
  86: "Yoğun Kar Sağanağı",
  95: "Gök Gürültülü Fırtına",
  96: "Dolulu Fırtına",
  99: "Şiddetli Dolu Fırtınası",
};

type Place = {
  country_code?: string;
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
  admin1?: string;
};

async function resolveCity(city: string): Promise<Place | null> {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city,
  )}&count=10&language=tr&format=json`;
  const geoRes = await fetch(geoUrl, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(10000),
  });
  const geo = await geoRes.json();
  const results: Place[] = geo?.results ?? [];
  return results.find((r) => r.country_code === "TR") ?? results[0] ?? null;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const latParam = Number(sp.get("lat"));
  const lonParam = Number(sp.get("lon"));
  const label = sp.get("label")?.trim();
  const detail = sp.get("detail")?.trim() ?? "";
  const city = sp.get("city")?.trim() || "İstanbul";

  try {
    let lat: number;
    let lon: number;
    let name: string;
    let country = "";
    let region = detail;

    if (Number.isFinite(latParam) && Number.isFinite(lonParam)) {
      lat = latParam;
      lon = lonParam;
      name = label || "Seçilen Konum";
    } else {
      const place = await resolveCity(city);
      if (!place)
        return Response.json({ error: `"${city}" bulunamadı` }, { status: 404 });
      lat = place.latitude;
      lon = place.longitude;
      name = place.name;
      country = place.country ?? "";
      region = place.admin1 ?? "";
    }

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure",
      hourly: "temperature_2m,precipitation_probability,weather_code,is_day",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max",
      forecast_days: "7",
      timezone: "auto",
    });
    const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      next: { revalidate: 1200 },
      signal: AbortSignal.timeout(10000),
    });
    const wx = await wxRes.json();
    if (!wx?.current)
      return Response.json({ error: "Tahmin alınamadı" }, { status: 502 });

    const c = wx.current;
    const nowHour = `${c.time.slice(0, 13)}:00`;
    let start = (wx.hourly.time as string[]).findIndex((t) => t >= nowHour);
    if (start < 0) start = 0;

    const hourly = (wx.hourly.time as string[])
      .slice(start, start + 18)
      .map((t, i) => ({
        t: t.slice(11, 16),
        temp: Math.round(wx.hourly.temperature_2m[start + i]),
        code: wx.hourly.weather_code[start + i],
        prob: wx.hourly.precipitation_probability?.[start + i] ?? 0,
        isDay: wx.hourly.is_day[start + i] === 1,
      }));

    const daily = (wx.daily.time as string[]).map((t, i) => ({
      date: t,
      code: wx.daily.weather_code[i],
      min: Math.round(wx.daily.temperature_2m_min[i]),
      max: Math.round(wx.daily.temperature_2m_max[i]),
      prob: wx.daily.precipitation_probability_max?.[i] ?? 0,
      uv: Math.round((wx.daily.uv_index_max?.[i] ?? 0) * 10) / 10,
      sunrise: (wx.daily.sunrise[i] as string).slice(11, 16),
      sunset: (wx.daily.sunset[i] as string).slice(11, 16),
    }));

    return Response.json({
      city: name,
      country,
      region,
      current: {
        temp: Math.round(c.temperature_2m),
        feels: Math.round(c.apparent_temperature),
        humidity: c.relative_humidity_2m,
        wind: Math.round(c.wind_speed_10m),
        windDir: c.wind_direction_10m,
        pressure: Math.round(c.surface_pressure),
        code: c.weather_code,
        isDay: c.is_day === 1,
        desc: WMO_TR[c.weather_code] ?? "Bilinmiyor",
        high: daily[0]?.max ?? 0,
        low: daily[0]?.min ?? 0,
      },
      hourly,
      daily,
    });
  } catch {
    return Response.json(
      { error: "Hava durumu servisine ulaşılamadı" },
      { status: 502 },
    );
  }
}
