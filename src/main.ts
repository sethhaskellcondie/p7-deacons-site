import './style.css';
import {
  assignments,
  events,
  gallery,
  type Assignment,
  type QuorumEvent,
  type GalleryItem,
} from './data';
import { SCRIPT_URL } from './config';

interface SiteData {
  assignments: Assignment[];
  events: QuorumEvent[];
  gallery: GalleryItem[];
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
        <a href="#assignments">Assignments</a>
        <a href="#calendar">Calendar</a>
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
        <h1 class="hero__title">SHOW UP.<br />SERVE. GROW.</h1>
        <p class="hero__sub">
          Good things are happening every week in the Payson 7th Ward Deacon's
          Quorum. Serve hard, laugh harder, and grow together with the crew.
        </p>
        <div class="hero__actions">
          <a href="#calendar" class="btn btn--primary">See What's Next</a>
          <a href="#media" class="btn btn--ghost">Watch Latest ▶</a>
        </div>
      </div>
    </header>
  `;
}

function renderAssignments(items: Assignment[]): string {
  const cards = items
    .map(
      (a) => `
        <div class="assignment-card">
          <div class="assignment-card__icon">${esc(a.icon)}</div>
          <h3 class="assignment-card__role">${esc(a.role)}</h3>
          <p class="assignment-card__when">${esc(a.when)}</p>
          <div class="assignment-card__assigned">
            <div class="assignment-card__assigned-label">ASSIGNED</div>
            <div class="assignment-card__who">${esc(a.who)}</div>
          </div>
        </div>
      `,
    )
    .join('');

  return `
    <section id="assignments" class="assignments">
      <div class="accent-square assignments__accent"></div>
      <div class="assignments__inner">
        <div class="eyebrow eyebrow--cyan">Priesthood duties</div>
        <h2 class="section-title section-title--light">ASSIGNMENTS</h2>
        <p class="assignments__sub">
          Know your role for Sunday. Show up ready to serve — check who's
          assigned this week.
        </p>
        <div class="assignments__grid">${cards}</div>
      </div>
    </section>
  `;
}

function renderCalendar(items: QuorumEvent[]): string {
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
          <a href="#calendar" class="event-row__details">Details →</a>
        </div>
      `,
    )
    .join('');

  return `
    <section id="calendar" class="calendar">
      <div class="accent-square calendar__accent"></div>
      <div class="calendar__inner">
        <div class="calendar__header">
          <div class="eyebrow eyebrow--teal">On the calendar</div>
          <h2 class="section-title section-title--dark">Upcoming events</h2>
        </div>
        <div class="calendar__list">${rows}</div>
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
          <a href="#assignments">Presidency</a>
          <a href="#assignments">Ward Website</a>
        </div>
      </div>
    </footer>
  `;
}

const CACHE_KEY = 'p7-quorum-data';

function hasFields(rows: unknown[], fields: string[]): boolean {
  if (rows.length === 0) return true;
  const first = rows[0];
  if (typeof first !== 'object' || first === null) return false;
  return fields.every(
    (f) => typeof (first as Record<string, unknown>)[f] === 'string',
  );
}

function isSiteData(value: unknown): value is SiteData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.assignments) &&
    Array.isArray(v.events) &&
    Array.isArray(v.gallery) &&
    hasFields(v.assignments, ['icon', 'role', 'when', 'who']) &&
    hasFields(v.events, ['month', 'day', 'time', 'title', 'blurb']) &&
    hasFields(v.gallery, ['slot', 'ph'])
  );
}

function readCachedData(): SiteData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSiteData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function rerenderDataSections(data: SiteData): void {
  const sections: Array<[string, string]> = [
    ['#assignments', renderAssignments(data.assignments)],
    ['#calendar', renderCalendar(data.events)],
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
    if (!isSiteData(payload)) throw new Error('unexpected payload shape');
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Cache is best-effort; render regardless.
    }
    rerenderDataSections(payload);
  } catch (err) {
    console.warn('[quorum] Live data unavailable; showing fallback data.', err);
  }
}

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  const initial = readCachedData() ?? { assignments, events, gallery };
  app.innerHTML = [
    renderHero(),
    renderAssignments(initial.assignments),
    renderCalendar(initial.events),
    renderTheme(),
    renderAlbum(initial.gallery),
    renderFooter(),
  ].join('');
  void loadLiveData();
}
