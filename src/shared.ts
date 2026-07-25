import type { Duty, QuorumEvent, ChallengeName, Assignment } from './data';
import { SCRIPT_URL } from './config';

export interface SiteData {
  duties: Duty[];
  events: QuorumEvent[];
  assignments: Assignment[];
  challenge: ChallengeName[];
}

// Sheet cells are user-entered text landing in innerHTML — escape them.
export function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

// Sheet rows have no year column, so resolve month/day against today:
// anything more than 6 months in the past is assumed to be next year's
// event (e.g. a JAN row entered in December). Returns null for rows that
// aren't dated events (e.g. the recurring "WEEKLY" fallback rows).
export function resolveDate(month: string, dayText: string, today: Date): Date | null {
  const day = Number.parseInt(dayText, 10);
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  const raw = month.trim().toUpperCase();
  let monthIdx = MONTHS.indexOf(raw.slice(0, 3));
  if (monthIdx === -1) {
    const n = Number.parseInt(raw, 10);
    monthIdx = Number.isInteger(n) && n >= 1 && n <= 12 ? n - 1 : -1;
  }
  if (monthIdx === -1) return null;

  let date = new Date(today.getFullYear(), monthIdx, day);
  const wrapCutoff = new Date(today);
  wrapCutoff.setMonth(wrapCutoff.getMonth() - 6);
  if (date < wrapCutoff) {
    date = new Date(today.getFullYear() + 1, monthIdx, day);
  }
  return date;
}

const CACHE_KEY = 'p7-quorum-data-v3';

function hasFields(rows: unknown[], fields: string[]): boolean {
  if (rows.length === 0) return true;
  const first = rows[0];
  if (typeof first !== 'object' || first === null) return false;
  return fields.every(
    (f) => typeof (first as Record<string, unknown>)[f] === 'string',
  );
}

// Validates the payload shape and returns it normalized, or null if it's
// unusable. `assignments` and `challenge` are newer than the other tabs, so a
// payload from an older script deployment (or an old cache entry) without them
// is still accepted and defaults to empty.
function parseSiteData(value: unknown): SiteData | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  const assignmentRows = v.assignments ?? [];
  const challengeRows = v.challenge ?? [];
  const ok =
    Array.isArray(v.duties) &&
    Array.isArray(v.events) &&
    Array.isArray(assignmentRows) &&
    Array.isArray(challengeRows) &&
    hasFields(v.duties, ['icon', 'role', 'when', 'who']) &&
    hasFields(v.events, ['month', 'day', 'time', 'title', 'blurb']) &&
    hasFields(assignmentRows, ['month', 'day', 'bread', 'lesson', 'note']) &&
    hasFields(challengeRows, ['name', 'date']);
  if (!ok) return null;
  return {
    duties: v.duties as Duty[],
    events: v.events as QuorumEvent[],
    assignments: assignmentRows as Assignment[],
    challenge: challengeRows as ChallengeName[],
  };
}

export function readCachedData(): SiteData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return parseSiteData(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function loadLiveData(
  onData: (data: SiteData) => void,
): Promise<void> {
  if (!SCRIPT_URL) return;
  try {
    const res = await fetch(SCRIPT_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload: unknown = await res.json();
    const data = parseSiteData(payload);
    if (!data) throw new Error('unexpected payload shape');
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      // Cache is best-effort; render regardless.
    }
    onData(data);
  } catch (err) {
    console.warn('[quorum] Live data unavailable; showing fallback data.', err);
  }
}
