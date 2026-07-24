export interface Assignment {
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

export interface GalleryItem {
  slot: string;
  ph: string;
}

export const assignments: Assignment[] = [
  { icon: '🪑', role: 'Set Up Chairs', when: 'Sunday · 7:50 AM', who: 'All Deacons' },
  { icon: '🍞', role: 'Bring Bread', when: 'Sunday · 8:15 AM', who: 'Check the Calendar' },
  { icon: '💧', role: 'Pass the Sacrament', when: 'Sunday · 8:30 AM', who: 'All Deacons' },
  { icon: '📖', role: 'Sunday Lesson', when: 'Sunday · 9:30 AM', who: 'Check the Calendar' },
];

// Evergreen fallback: shown only until live sheet data loads (or if it
// can't), so keep these recurring — never dated, never stale.
export const events: QuorumEvent[] = [
  {
    month: 'WEEKLY',
    day: 'SUN',
    time: '8:30 AM',
    title: 'Sacrament Meeting & Quorum',
    blurb: 'Show up early to serve — check your assignment above.',
  },
  {
    month: 'WEEKLY',
    day: 'WED',
    time: '7:00 PM',
    title: 'Activity Night',
    blurb: "Check the group chat or ask a leader for this week's plan.",
  },
];

export const gallery: GalleryItem[] = [
  { slot: 'med_g1', ph: 'Activity photo' },
  { slot: 'med_g2', ph: 'Service project clip' },
  { slot: 'med_g3', ph: 'Camp photo' },
  { slot: 'med_g4', ph: 'Testimony video' },
];
