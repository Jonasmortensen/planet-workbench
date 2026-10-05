/** Display helpers. UI only; the generator never formats text for display. */

export function humanize(value: string): string {
  const s = value.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatPopulation(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)} trillion`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} million`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} thousand`;
  return String(n);
}

export function formatShare(share: number): string {
  return `${(share * 100).toFixed(share < 0.01 ? 1 : 0)}%`;
}

export function formatYearsAgo(date: number): string {
  const ago = -date;
  return ago === 1 ? '1 year ago' : `${ago.toLocaleString()} years ago`;
}

export function formatTemp(c: number): string {
  return `${c > 0 ? '+' : ''}${c} °C`;
}

export function formatHours(h: number): string {
  if (h >= 48) return `${h.toLocaleString()} h (${(h / 24).toFixed(1)} days)`;
  return `${h} h`;
}
