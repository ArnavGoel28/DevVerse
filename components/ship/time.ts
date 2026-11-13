export function timeAgoShort(iso: string, now: number): string {
  const m = Math.round((now - Date.parse(iso)) / 60000);
  if (m < 60) return `${Math.max(m, 0)}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}
