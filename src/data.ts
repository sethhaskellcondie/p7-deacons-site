export interface Duty {
  icon: string;
  role: string;
  when: string;
  who: string;
}

export interface QuorumEvent {
  month: string;
  day: string;
  time: string;
  title: string;
  blurb: string;
}

export interface ChallengeName {
  name: string;
  date: string;
}

export interface Assignment {
  month: string;
  day: string;
  bread: string;
  lesson: string;
  note: string;
}

export const duties: Duty[] = [
  { icon: '🪑', role: 'Set Up Chairs', when: 'Sunday · 7:50 AM', who: 'All Deacons' },
  { icon: '🍞', role: 'Bring Bread', when: 'Sunday · 8:15 AM', who: 'See Assignments' },
  { icon: '💧', role: 'Pass the Sacrament', when: 'Sunday · 8:30 AM', who: 'All Deacons' },
  { icon: '📖', role: 'Sunday Lesson', when: 'Sunday · 9:30 AM', who: 'See Assignments' },
];

// Evergreen fallback: shown only until live sheet data loads (or if it
// can't), so keep these recurring — never dated, never stale.
export const events: QuorumEvent[] = [
  {
    month: 'WEEKLY',
    day: 'SUN',
    time: '8:30 AM',
    title: 'Sacrament Meeting & Quorum',
    blurb: 'Show up early to serve — check your duty above.',
  },
  {
    month: 'WEEKLY',
    day: 'WED',
    time: '7:00 PM',
    title: 'Activity Night',
    blurb: "Check the group chat or ask a leader for this week's plan.",
  },
];

// Assignments are inherently dated, so an evergreen fallback is impossible —
// when this is empty, the Duties section shows a "check with a leader" note.
export const assignments: Assignment[] = [];

// Who has recited the Aaronic Priesthood Theme from memory. Like assignments,
// this is live-only data — an empty list renders the "be the first" note.
export const challenge: ChallengeName[] = [];
