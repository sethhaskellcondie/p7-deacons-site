import './style.css';
import {
  duties,
  events,
  gallery,
  assignments,
  type Duty,
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
        <a href="calendar.html">Calendar</a>
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
          <a href="calendar.html" class="events__calendar-link">See the full calendar →</a>
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

function renderAlbum(items: SiteData['gallery']): string {
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
          <a href="calendar.html">Calendar</a>
          <a href="#duties">Ward Website</a>
        </div>
      </div>
    </footer>
  `;
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
  void loadLiveData(rerenderDataSections);
}
