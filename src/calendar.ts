import './style.css';
import {
  duties,
  events,
  assignments,
  challenge,
  type QuorumEvent,
  type Assignment,
} from './data';
import {
  esc,
  resolveDate,
  readCachedData,
  loadLiveData,
  type SiteData,
} from './shared';

type Filter = 'all' | 'events' | 'assignments';

interface DayItems {
  events: QuorumEvent[];
  assignments: Assignment[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_TITLES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// The page always shows exactly two months: the current one and the next.
function windowMonths(today: Date): Date[] {
  return [0, 1].map(
    (offset) => new Date(today.getFullYear(), today.getMonth() + offset, 1),
  );
}

function daysOfMonth(monthStart: Date): Date[] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => new Date(year, month, i + 1));
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function monthTitle(monthStart: Date): string {
  return `${MONTH_TITLES[monthStart.getMonth()]} ${monthStart.getFullYear()}`;
}

function bucketByDay(data: SiteData, months: Date[]): Map<string, DayItems> {
  const today = startOfToday();
  const bucket = new Map<string, DayItems>();
  const at = (date: Date): DayItems => {
    const key = dayKey(date);
    let items = bucket.get(key);
    if (!items) {
      items = { events: [], assignments: [] };
      bucket.set(key, items);
    }
    return items;
  };
  const inWindow = (date: Date): boolean =>
    months.some(
      (m) =>
        m.getFullYear() === date.getFullYear() &&
        m.getMonth() === date.getMonth(),
    );

  for (const ev of data.events) {
    const date = resolveDate(ev.month, ev.day, today);
    if (date) {
      if (inWindow(date)) at(date).events.push(ev);
      continue;
    }
    // Undated rows like {month: 'WEEKLY', day: 'SUN'} recur on that weekday.
    const weekday = WEEKDAYS.findIndex(
      (w) => w.toUpperCase() === ev.day.trim().toUpperCase().slice(0, 3),
    );
    if (weekday === -1) continue;
    for (const month of months) {
      for (const date2 of daysOfMonth(month)) {
        if (date2.getDay() === weekday) at(date2).events.push(ev);
      }
    }
  }

  for (const a of data.assignments) {
    const date = resolveDate(a.month, a.day, today);
    if (date && inWindow(date)) at(date).assignments.push(a);
  }

  return bucket;
}

/* ---------- Month grid (desktop) ---------- */

function eventChip(ev: QuorumEvent): string {
  const tip = [ev.time, ev.blurb]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · ');
  return `<div class="cal-chip cal-chip--event" title="${esc(tip)}">${esc(ev.title)}</div>`;
}

function assignmentChips(a: Assignment): string {
  const chips: string[] = [];
  if (a.bread.trim()) {
    chips.push(
      `<div class="cal-chip cal-chip--assignment" title="Bread · ${esc(a.bread)}">Bread · ${esc(a.bread)}</div>`,
    );
  }
  if (a.lesson.trim()) {
    chips.push(
      `<div class="cal-chip cal-chip--assignment" title="Lesson · ${esc(a.lesson)}">Lesson · ${esc(a.lesson)}</div>`,
    );
  }
  if (chips.length === 0 && a.note.trim()) {
    chips.push(
      `<div class="cal-chip cal-chip--note" title="${esc(a.note)}">${esc(a.note)}</div>`,
    );
  }
  return chips.join('');
}

function renderMonth(
  monthStart: Date,
  bucket: Map<string, DayItems>,
  today: Date,
): string {
  const cells: string[] = [];
  const blank = '<div class="cal__cell cal__cell--blank"></div>';
  for (let i = 0; i < monthStart.getDay(); i++) cells.push(blank);
  for (const date of daysOfMonth(monthStart)) {
    const items = bucket.get(dayKey(date));
    const chips = items
      ? items.events.map(eventChip).join('') +
        items.assignments.map(assignmentChips).join('')
      : '';
    const todayClass =
      date.getTime() === today.getTime() ? ' cal__cell--today' : '';
    cells.push(`
      <div class="cal__cell${todayClass}">
        <div class="cal__daynum">${date.getDate()}</div>
        ${chips}
      </div>
    `);
  }
  while (cells.length % 7 !== 0) cells.push(blank);

  const weekdayCells = WEEKDAYS.map(
    (w) => `<div class="cal__weekday">${w}</div>`,
  ).join('');

  return `
    <section class="cal-month">
      <h2 class="cal-month__title">${monthTitle(monthStart).toUpperCase()}</h2>
      <div class="cal__weekdays">${weekdayCells}</div>
      <div class="cal__grid">${cells.join('')}</div>
    </section>
  `;
}

/* ---------- Agenda list (mobile) ---------- */

function agendaEvent(ev: QuorumEvent): string {
  const meta = [ev.time, ev.blurb]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · ');
  return `
    <div class="cal-agenda__item">
      <div class="cal-agenda__title">${esc(ev.title)}</div>
      ${meta ? `<div class="cal-agenda__meta">${esc(meta)}</div>` : ''}
    </div>
  `;
}

function agendaAssignment(a: Assignment): string {
  const rows = [
    ['Bread', a.bread],
    ['Lesson', a.lesson],
  ]
    .filter(([, value]) => value.trim())
    .map(
      ([label, value]) => `
        <div class="cal-agenda__arow">
          <span class="cal-agenda__alabel">${label}</span>
          <span class="cal-agenda__avalue">${esc(value)}</span>
        </div>
      `,
    )
    .join('');
  const note = a.note.trim()
    ? `<div class="cal-agenda__meta">${esc(a.note)}</div>`
    : '';
  if (!rows && !note) return '';
  return `<div class="cal-agenda__item">${rows}${note}</div>`;
}

function renderAgendaDay(
  date: Date,
  items: DayItems,
  filter: Filter,
): string {
  const rows: string[] = [];
  if (filter !== 'assignments') rows.push(...items.events.map(agendaEvent));
  if (filter !== 'events') {
    rows.push(...items.assignments.map(agendaAssignment).filter(Boolean));
  }
  if (rows.length === 0) return '';
  return `
    <div class="cal-agenda__day">
      <div class="cal-agenda__date">
        <div class="cal-agenda__daynum">${date.getDate()}</div>
        <div class="cal-agenda__wk">${WEEKDAYS[date.getDay()]}</div>
      </div>
      <div class="cal-agenda__items">${rows.join('')}</div>
    </div>
  `;
}

function renderAgenda(
  bucket: Map<string, DayItems>,
  months: Date[],
  filter: Filter,
  today: Date,
): string {
  // The agenda is the phone view — start it at today rather than the 1st,
  // so the first thing on screen is always the next thing happening.
  const sections = months
    .map((month) => {
      const dayRows = daysOfMonth(month)
        .filter((date) => date.getTime() >= today.getTime())
        .map((date) => {
          const items = bucket.get(dayKey(date));
          return items ? renderAgendaDay(date, items, filter) : '';
        })
        .join('');
      if (!dayRows.trim()) return '';
      return `
        <div class="cal-agenda__month">
          <h3 class="cal-agenda__month-title">${monthTitle(month).toUpperCase()}</h3>
          ${dayRows}
        </div>
      `;
    })
    .join('');

  const body = sections.trim()
    ? sections
    : `<p class="cal-agenda__empty">Nothing on the calendar for this filter yet — check back soon.</p>`;

  const button = (value: Filter, label: string): string =>
    `<button type="button" class="cal-filter__btn${filter === value ? ' is-active' : ''}" data-filter="${value}">${label}</button>`;

  return `
    <div class="cal-agenda">
      <div class="cal-filter">
        ${button('all', 'All')}
        ${button('events', 'Events')}
        ${button('assignments', 'Assignments')}
      </div>
      ${body}
    </div>
  `;
}

/* ---------- Page shell ---------- */

function renderHeader(): string {
  return `
    <header class="cal-hero">
      <div class="hero__facet hero__facet--1"></div>
      <div class="hero__facet hero__facet--2"></div>
      <nav class="nav">
        <div class="nav__brand">
          <div class="logo-tile logo-tile--nav">P7</div>
          <div class="nav__wordmark">
            THE QUORUM<br />
            <span class="nav__wordmark-sub">PAYSON 7TH WARD</span>
          </div>
        </div>
        <a href="./" class="btn btn--ghost btn--back">← Back to Home</a>
      </nav>
      <div class="cal-hero__content">
        <div class="eyebrow eyebrow--theme">This month &amp; next</div>
        <h1 class="cal-hero__title">QUORUM CALENDAR</h1>
      </div>
    </header>
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
          <a href="./">Home</a>
        </div>
      </div>
    </footer>
  `;
}

let filter: Filter = 'all';
let data: SiteData = readCachedData() ?? { duties, events, assignments, challenge };

const app = document.querySelector<HTMLDivElement>('#app');

function render(): void {
  if (!app) return;
  const today = startOfToday();
  const months = windowMonths(today);
  const bucket = bucketByDay(data, months);
  app.innerHTML = [
    renderHeader(),
    `
      <main class="calendar">
        <div class="calendar__inner">
          <div class="cal-months">
            ${months.map((month) => renderMonth(month, bucket, today)).join('')}
          </div>
          ${renderAgenda(bucket, months, filter, today)}
        </div>
      </main>
    `,
    renderFooter(),
  ].join('');
}

if (app) {
  render();
  void loadLiveData((live) => {
    data = live;
    render();
  });
  // Filter buttons are re-created on every render, so delegate the clicks.
  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    const btn = e.target.closest<HTMLElement>('[data-filter]');
    if (!btn) return;
    filter = btn.dataset.filter as Filter;
    render();
  });
}
