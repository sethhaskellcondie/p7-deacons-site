import './style.css';
import {
  duties,
  events,
  assignments,
  challenge,
  type Duty,
  type QuorumEvent,
  type Assignment,
  type ChallengeName,
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
        <a href="#challenge">Challenge</a>
      </div>
    </nav>
  `;
}

function renderHero(): string {
  return `
    <header id="top" class="hero">
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
          <a href="#events" class="btn btn--primary">Upcoming Events</a>
          <a href="#challenge" class="btn btn--ghost">Take the Challenge</a>
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
          <div class="event-row__time">${esc(ev.time)}</div>
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

const CHALLENGE_VIDEO_ID = 'lwbmCcON_yg';

function renderChallengeNames(items: ChallengeName[]): string {
  if (!items.length) {
    return `<p class="challenge__empty">No one yet — be the first to pass it off!</p>`;
  }
  const rows = items
    .map((c) => {
      const date = c.date.trim()
        ? `<span class="challenge__date">${esc(c.date)}</span>`
        : '';
      return `
        <li class="challenge__name">
          <span class="challenge__check">✓</span>
          <span class="challenge__who">${esc(c.name)}</span>
          ${date}
        </li>
      `;
    })
    .join('');
  return `<ol class="challenge__names">${rows}</ol>`;
}

function renderChallenge(items: ChallengeName[]): string {
  return `
    <section id="challenge" class="challenge">
      <div class="accent-square challenge__accent"></div>
      <div class="challenge__inner">
        <div class="challenge__header">
          <div class="eyebrow eyebrow--teal">The challenge</div>
          <h2 class="section-title section-title--dark">MEMORIZE THE THEME</h2>
          <p class="challenge__sub">
            Learn the Aaronic Priesthood Theme by heart, then recite it to a leader
            to pass it off. Watch the video below as many times as it takes.
          </p>
        </div>
        <div class="challenge__grid">
          <div class="challenge__roster">
            <h3 class="challenge__roster-title">PASSED IT OFF</h3>
            <div id="challenge-names">${renderChallengeNames(items)}</div>
          </div>
          <div class="challenge__video">
            <iframe
              src="https://www.youtube-nocookie.com/embed/${CHALLENGE_VIDEO_ID}"
              title="Aaronic Priesthood Theme"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>
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
          <a href="#top">Top</a>
          <a href="calendar.html">Calendar</a>
          <a
            href="https://local.churchofjesuschrist.org/en/units/us/ut/payson-7th-ward"
            target="_blank"
            rel="noopener noreferrer"
            >Ward Website</a
          >
        </div>
      </div>
    </footer>
  `;
}

function rerenderDataSections(data: SiteData): void {
  const sections: Array<[string, string]> = [
    ['#duties', renderDuties(data.duties, data.assignments)],
    ['#events', renderEvents(upcomingEvents(data.events))],
  ];
  for (const [selector, html] of sections) {
    const el = document.querySelector(selector);
    if (el) el.outerHTML = html;
  }
  // Swap only the roster, not the whole section — replacing it would reload the
  // embedded video and cut off anyone already watching.
  const names = document.querySelector('#challenge-names');
  if (names) names.innerHTML = renderChallengeNames(data.challenge);
}

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  const initial = readCachedData() ?? { duties, events, assignments, challenge };
  app.innerHTML = [
    renderHero(),
    renderDuties(initial.duties, initial.assignments),
    renderEvents(upcomingEvents(initial.events)),
    renderTheme(),
    renderChallenge(initial.challenge),
    renderFooter(),
  ].join('');
  void loadLiveData(rerenderDataSections);
}
