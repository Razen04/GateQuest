/** "180 min" → "3h",  "90" → "1h 30m",  "45" → "45 min" */
export function formatDuration(seconds: number): string {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
}

/** 3600 → "1h", 65 → "1m 5s", 8 → "8s", null → "" */
export function formatCountdown(seconds: number | null): string {
    if (seconds == null) return '';
    if (seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (h === 0 && s > 0) parts.push(`${s}s`);
    return parts.join(' ') || '0s';
}

/** ISO date → "Mar 14, 6:00 PM" (locale). Safe for bad input. */
export function formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export const fmtNum = (n: number): string => {
    const abs = Math.abs(n);
    if (abs < 0.005) return '0.00';
    return n.toFixed(2);
};
