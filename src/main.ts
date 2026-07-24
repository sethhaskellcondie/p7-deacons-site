import './style.css';
import {
  duties,
  events,
  gallery,
  assignments,
  type Duty,
  type QuorumEvent,
  type GalleryItem,
  type Assignment,
} from './data';
import { SCRIPT_URL } from './config';

interface SiteData {
  duties: Duty[];
  events: QuorumEvent[];
  gallery: GalleryItem[];
  assignments: Assignment[];
}

// Sheet cells are user-entered text landing in innerHTML — escape them.
function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderNav(): string {
  return `
    <nav class="nav">
      <div class="nav__brand">
        <div class="logo-tile logo-tile--nav">P7</div>
        <div class="nav__wordmark">
          THE QUORUM<br />
          <span class="nav__wordmark-sub">PAYSON 7TH WARD</span>
        </div>
      </div>
      <div class="nav__links">
        <a href="#duties">Duties</a>
        <a href="#events">Events</a>
        <a href="#theme">Theme</a>
        <a href="#media">Album</a>
      </div>
    </nav>
  `;
}

function renderHero(): string {
  return `
    <header class="hero">
      <div class="hero__facet hero__facet--1"></div>
      <div class="hero__facet hero__facet--2"></div>
      <div class="hero__facet hero__facet--3"></div>
      <div class="accent-square hero__accent-lg"></div>
      <div class="accent-square hero__accent-sm"></div>
      ${renderNav()}
      <div class="hero__content">
        <h1 class="hero__title">
        SHOW UP.<br />
        SERVE. GROW.
        </h1>
        <p class="hero__sub">
          Good things are happening every week in the Payson 7th Ward Deacon's Quorum. Serve hard, laugh harder, and grow together with the quorum.
        </p>
        <div class="hero__actions">
          <a href="#events" class="btn btn--primary">See What's Next</a>
          <a href="#media" class="btn btn--ghost">Watch Latest ▶</a>
        </div>
      </div>
    </header>
  `;
}

// The next two Sundays of bread/lesson assignments. Rows without a parseable
// date (blank day, stray notes) are dropped rather than sorted to the top.
const ASSIGNMENT_COUNT = 2;

function upcomingAssignments(items: Assignment[]): Assignment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return items
    .map((a) => ({ a, date: resolveDate(a.month, a.day, today) }))
    .filter((x): x is { a: Assignment; date: Date } => x.date !== null && x.date >= today)
    .sort((x, y) => x.date.getTime() - y.date.getTime())
    .slice(0, ASSIGNMENT_COUNT)
    .map(({ a }) => a);
}

function renderAssignmentCard(a: Assignment): string {
  const note = a.note.trim()
    ? `<p class="assignment-card__note">${esc(a.note)}</p>`
    : '';
  return `
    <div class="assignment-card">
      <div class="assignment-card__date">
        <div class="assignment-card__day">${esc(a.day)}</div>
        <div class="assignment-card__mon">${esc(a.month)}</div>
      </div>
      <div class="assignment-card__body">
        <div class="assignment-card__row">
          <span class="assignment-card__label">Bread</span>
          <span class="assignment-card__value">${esc(a.bread.trim() || '—')}</span>
        </div>
        <div class="assignment-card__row">
          <span class="assignment-card__label">Lesson</span>
          <span class="assignment-card__value">${esc(a.lesson.trim() || '—')}</span>
        </div>
        ${note}
      </div>
    </div>
  `;
}

function renderAssignments(items: Assignment[]): string {
  const upcoming = upcomingAssignments(items);
  const body = upcoming.length
    ? `<div class="assignments__grid">${upcoming.map(renderAssignmentCard).join('')}</div>`
    : `<p class="assignments__empty">Assignments haven't been posted yet — check with a leader.</p>`;

  return `
    <div class="assignments">
      <h3 class="assignments__title">ASSIGNMENTS</h3>
      <p class="assignments__sub">Here is who is on deck for the next two weeks.</p>
      ${body}
    </div>
  `;
}

function renderDuties(items: Duty[], assignmentItems: Assignment[]): string {
  const cards = items
    .map(
      (a) => `
        <div class="duty-card">
          <div class="duty-card__icon">${esc(a.icon)}</div>
          <h3 class="duty-card__role">${esc(a.role)}</h3>
          <p class="duty-card__when">${esc(a.when)}</p>
          <div class="duty-card__assigned">
            <div class="duty-card__assigned-label">NEXT UP: </div>
            <div class="duty-card__who">${esc(a.who)}</div>
          </div>
        </div>
      `,
    )
    .join('');

  return `
    <section id="duties" class="duties">
      <div class="accent-square duties__accent"></div>
      <div class="duties__inner">
        <div class="eyebrow eyebrow--cyan">Priesthood duties</div>
        <h2 class="section-title section-title--light">SUNDAY SERVICES</h2>
        <p class="duties__sub">
          We all have a part to play. Here is how our quorum serves each Sunday.
        </p>
        <div class="duties__grid">${cards}</div>
        ${renderAssignments(assignmentItems)}
      </div>
    </section>
  `;
}

const HOME_EVENT_COUNT = 4;

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

// Sheet rows have no year column, so resolve month/day against today:
// anything more than 6 months in the past is assumed to be next year's
// event (e.g. a JAN row entered in December). Returns null for rows that
// aren't dated events (e.g. the recurring "WEEKLY" fallback rows).
function resolveDate(month: string, dayText: string, today: Date): Date | null {
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

function upcomingEvents(items: QuorumEvent[]): QuorumEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return items
    .map((ev) => ({ ev, date: resolveDate(ev.month, ev.day, today) }))
    .filter(({ date }) => date === null || date >= today)
    .sort(
      (a, b) =>
        (a.date ?? today).getTime() - (b.date ?? today).getTime(),
    )
    .slice(0, HOME_EVENT_COUNT)
    .map(({ ev }) => ev);
}

function renderEvents(items: QuorumEvent[]): string {
  const rows = items
    .map(
      (ev) => `
        <div class="event-row">
          <div class="event-row__date">
            <div class="event-row__day">${esc(ev.day)}</div>
            <div class="event-row__mon">${esc(ev.month)}</div>
          </div>
          <div class="event-row__body">
            <h3 class="event-row__title">${esc(ev.title)}</h3>
            <p class="event-row__meta">${esc(ev.time)} · ${esc(ev.blurb)}</p>
          </div>
          <a href="#events" class="event-row__details">Details →</a>
        </div>
      `,
    )
    .join('');

  return `
    <section id="events" class="events">
      <div class="accent-square events__accent"></div>
      <div class="events__inner">
        <div class="events__header">
          <div class="eyebrow eyebrow--teal">Coming up</div>
          <h2 class="section-title section-title--dark">UPCOMING EVENTS</h2>
        </div>
        <div class="events__list">${rows}</div>
      </div>
    </section>
  `;
}

function renderTheme(): string {
  return `
    <section id="theme" class="theme">
      <div class="theme__facet"></div>
      <div class="accent-square theme__accent-lg"></div>
      <div class="accent-square theme__accent-sm"></div>
      <div class="theme__inner">
        <div class="eyebrow eyebrow--theme">2026 Youth Theme</div>
        <blockquote class="theme__quote">"Walk with me."</blockquote>
        <div class="theme__citation">Moses 6:34</div>
      </div>
    </section>
  `;
}

function renderAlbum(items: GalleryItem[]): string {
  const tiles = items
    .map(
      (g) => `
        <div class="album__tile">
          <div class="image-placeholder" id="${esc(g.slot)}">${esc(g.ph)}</div>
        </div>
      `,
    )
    .join('');

  return `
    <section id="media" class="album">
      <div class="accent-square album__accent"></div>
      <div class="album__inner">
        <div class="album__header">
          <div>
            <div class="eyebrow eyebrow--teal">Life in the quorum</div>
            <h2 class="section-title section-title--dark">Album</h2>
          </div>
          <a href="#media" class="album__gallery-link">See the full gallery →</a>
        </div>
        <div class="album__grid">
          <div class="album__featured">
            <div class="image-placeholder" id="med_feat">Drop a highlight photo</div>
          </div>
          ${tiles}
        </div>
      </div>
    </section>
  `;
}

function renderFooter(): string {
  return `
    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__brand">
          <div class="logo-tile logo-tile--footer">P7</div>
          <span class="footer__wordmark">The Quorum · Payson 7th Ward</span>
        </div>
        <div class="footer__links">
          <a href="#duties">Presidency</a>
          <a href="#duties">Ward Website</a>
        </div>
      </div>
    </footer>
  `;
}

const CACHE_KEY = 'p7-quorum-data-v2';

function hasFields(rows: unknown[], fields: string[]): boolean {
  if (rows.length === 0) return true;
  const first = rows[0];
  if (typeof first !== 'object' || first === null) return false;
  return fields.every(
    (f) => typeof (first as Record<string, unknown>)[f] === 'string',
  );
}

// Validates the payload shape and returns it normalized, or null if it's
// unusable. `assignments` is newer than the other tabs, so a payload from an
// older script deployment (or an old cache entry) without it is still
// accepted and defaults to empty.
function parseSiteData(value: unknown): SiteData | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  const assignmentRows = v.assignments ?? [];
  const ok =
    Array.isArray(v.duties) &&
    Array.isArray(v.events) &&
    Array.isArray(v.gallery) &&
    Array.isArray(assignmentRows) &&
    hasFields(v.duties, ['icon', 'role', 'when', 'who']) &&
    hasFields(v.events, ['month', 'day', 'time', 'title', 'blurb']) &&
    hasFields(v.gallery, ['slot', 'ph']) &&
    hasFields(assignmentRows, ['month', 'day', 'bread', 'lesson', 'note']);
  if (!ok) return null;
  return {
    duties: v.duties as Duty[],
    events: v.events as QuorumEvent[],
    gallery: v.gallery as GalleryItem[],
    assignments: assignmentRows as Assignment[],
  };
}

function readCachedData(): SiteData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return parseSiteData(JSON.parse(raw));
  } catch {
    return null;
  }
}

function rerenderDataSections(data: SiteData): void {
  const sections: Array<[string, string]> = [
    ['#duties', renderDuties(data.duties, data.assignments)],
    ['#events', renderEvents(upcomingEvents(data.events))],
    ['#media', renderAlbum(data.gallery)],
  ];
  for (const [selector, html] of sections) {
    const el = document.querySelector(selector);
    if (el) el.outerHTML = html;
  }
}

async function loadLiveData(): Promise<void> {
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
    rerenderDataSections(data);
  } catch (err) {
    console.warn('[quorum] Live data unavailable; showing fallback data.', err);
  }
}

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  const initial = readCachedData() ?? { duties, events, gallery, assignments };
  app.innerHTML = [
    renderHero(),
    renderDuties(initial.duties, initial.assignments),
    renderEvents(upcomingEvents(initial.events)),
    renderTheme(),
    renderAlbum(initial.gallery),
    renderFooter(),
  ].join('');
  void loadLiveData();
}
