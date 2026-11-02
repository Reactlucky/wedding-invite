const pad = (n: number) => String(n).padStart(2, "0");

/** Parse YYYY-MM-DDTHH:mm (or YYYY-MM-DD + HH:mm) as local time without timezone surprises. */
export function parseLocal(date: string, time?: string): Date {
  const [d, t] = time ? [date, time] : date.split("T");
  const [y, m, day] = (d ?? "").split("-").map(Number);
  const [hh, mm] = (t ?? "00:00").split(":").map(Number);
  return new Date(y || 2000, (m || 1) - 1, day || 1, hh || 0, mm || 0);
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatDayMonth(date: Date): { weekday: string; day: string; month: string; year: string } {
  return {
    weekday: date.toLocaleDateString("en-GB", { weekday: "long" }),
    day: pad(date.getDate()),
    month: date.toLocaleDateString("en-GB", { month: "long" }),
    year: String(date.getFullYear()),
  };
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function numericDate(date: Date): string {
  return `${pad(date.getDate())} · ${pad(date.getMonth() + 1)} · ${date.getFullYear()}`;
}

export function mapsEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

export function mapsDirectionsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function calendarUrl(title: string, start: Date, hours: number, location: string, details: string): string {
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const end = new Date(start.getTime() + hours * 3600_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    location,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
