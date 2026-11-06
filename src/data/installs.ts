// Installer data: the job pack for each job, what the fitter records on a booking, and job messages.
// A "booking" is a diary event: an installation (one or more days) or a return / aftercare visit.

export type Fix = { fixed: boolean; note?: string; photos: number; part?: string };
export type Update = { at: string; day: string; pct: number; note?: string; photos: number };
export type Problem = { id: string; at: string; kind: string; note: string; photos: number; stop: boolean };
export type DayLog = { date: string; start: string; end?: string; note?: string };
export type Completion = { at: string; on: string; checks: Record<string, boolean>; photos: number; snags: string[]; signed: boolean; signedBy?: string; refused?: string; shown: boolean; notFitted?: string };
export type Work = {
  reviewed?: string;               // job pack read
  onWay?: string;                  // customer told "on my way"
  started?: string;                // arrived and started (time)
  pre?: Record<string, boolean>;   // before-you-start checks
  before?: number;                 // photos before work
  fitted?: Record<string, number>; // product line index → how many fitted
  days?: DayLog[];
  updates?: Update[];
  problems?: Problem[];
  paused?: string;                 // finished for today, back tomorrow
  complete?: Completion;           // install finished and handed over
  fixes?: Record<string, Fix>;     // return visit: one per snag
  visitDone?: { at: string; on: string; signed: boolean; signedBy?: string; note?: string };
  moveAsked?: string;
  noAccess?: string;
};
export type Msg = { id: string; from: 'office' | 'me' | 'customer' | 'crew' | 'system'; who: string; text: string; when: string };

export type PackItem = { name: string; qty: number; size: string; room: string; note?: string; photo: string };
export type Pack = {
  items: PackItem[];
  access: string; parking: string; waste: string; materials: string;
  surveyor: string;          // notes for the fitters from the final survey
  flags: string[];           // site checks the surveyor marked "No" / "Not sure"
  customer: string;          // what the customer asked for on the day
  contact: string;           // who is on site
  docs: [string, string][];  // file, what it is
  hours: string;
};

export const PACK: Record<string, Pack> = {
  'JG-10493': {
    items: [
      { name: 'Aluminium casement window', qty: 6, size: '1200 x 1050 mm', room: 'Treatment rooms 1–3 (front)', photo: 'window' },
      { name: 'Aluminium casement window', qty: 3, size: '900 x 1050 mm', room: 'Waiting room', photo: 'window', note: 'Safety glass — low cill' },
      { name: 'Aluminium fixed light', qty: 1, size: '1800 x 600 mm', room: 'Reception', photo: 'house' },
    ],
    access: 'Rear entrance off Back Lane. Front door stays clear for patients.',
    parking: 'Two bays at the rear are kept free for the van.',
    waste: 'Old frames go in the van — no skip on a high street.',
    materials: 'Delivered 14 Oct. Stored in the rear store room, checked 10 of 10.',
    surveyor: 'Patients in all day. Do treatment rooms before 10am, then waiting room. Reception last (Saturday morning).',
    flags: ['Lintel above reception window has a hairline crack — check before removing the old frame.'],
    customer: 'Please keep drilling noise down between 10:00 and 12:00.',
    contact: 'Dr Hartley (practice owner) · 0116 496 0222',
    docs: [['Survey report EN-2268.pdf', 'Final survey · Ravi Kumar'], ['Order SO-48190.pdf', 'Origin order confirmation'], ['Window schedule.pdf', 'Sizes and positions']],
    hours: 'Practice open 08:00 – 18:00. Day 1 from 09:30 (after Mrs Patel), day 2 from 08:00.',
  },
  'JG-10477': {
    items: [
      { name: 'uPVC casement window', qty: 5, size: '1100 x 1200 mm', room: 'Front · lounge, bedrooms', photo: 'window' },
      { name: 'uPVC casement window', qty: 2, size: '600 x 900 mm', room: 'Bathroom, landing', photo: 'window', note: 'Obscure glass' },
      { name: 'uPVC casement window', qty: 1, size: '1500 x 1050 mm', room: 'Kitchen', photo: 'window' },
    ],
    access: 'Side gate is unlocked during the day. Rear garden has a step down.',
    parking: 'Driveway — the customer moves their car the night before.',
    waste: 'Skip booked for 20 Oct, on the driveway.',
    materials: 'Delivered 15 Oct to the garage. 8 of 8 checked by the office.',
    surveyor: 'Bedroom 2 window is the fire escape — keep the egress hinge. Dog in the house; keep the side gate shut.',
    flags: ['Scaffold tower needed for the landing window (in the van).'],
    customer: 'Mr Baker works from home in the back bedroom — start at the front.',
    contact: 'Mr & Mrs Baker · 07700 900 561',
    docs: [['Survey report EN-2262.pdf', 'Final survey · Ravi Kumar'], ['Order SO-48213.pdf', 'Emplas order confirmation']],
    hours: 'Start 08:00. Customer home all day.',
  },
  'JG-10471': {
    items: [{ name: '4-pane bi-fold door', qty: 1, size: '3600 x 2100 mm', room: 'Kitchen', photo: 'bifold' }, { name: 'Casement window', qty: 2, size: '1000 x 1100 mm', room: 'Bedrooms', photo: 'window' }],
    access: 'Front door.', parking: 'On the road outside.', waste: 'Take any packaging with you.', materials: 'New handle is in your van (collected 15 Oct).',
    surveyor: 'Bi-fold track was set level; check after fixing.', flags: [], customer: 'Mrs Patel is home from 9am.', contact: 'Mrs Patel · 07700 900 643',
    docs: [['Snag report SN-117.pdf', 'Photos of the scratch']], hours: 'Any time after 9am.',
  },
  'JG-10455': {
    items: [{ name: 'Orangery roof lantern', qty: 1, size: '3000 x 2000 mm', room: 'Garden room', photo: 'roof' }],
    access: 'Side of the house.', parking: 'Driveway.', waste: 'Skip on the driveway.', materials: 'Delivered 9 Oct.',
    surveyor: 'Scaffold booked for all three days.', flags: [], customer: '—', contact: 'Mr Khan · 07700 900 233', docs: [['Survey report.pdf', 'Final survey']], hours: '08:00 – 17:00',
  },
  'JG-10398': {
    items: [{ name: 'Casement window', qty: 4, size: '1000 x 1100 mm', room: 'Bedrooms and lounge', photo: 'window' }],
    access: 'Front door.', parking: 'On the road.', waste: 'Take any packaging with you.', materials: 'Spare handle in the van stock.',
    surveyor: 'Fitted in June. Back bedroom handle is loose.', flags: [], customer: 'Mrs Cooper is home in the morning.', contact: 'Mrs Cooper · 07700 900 990',
    docs: [['Completion report JG-10398.pdf', 'Signed off 10 Jun']], hours: 'Morning.',
  },
};
export const packFor = (job?: string): Pack | undefined => (job ? PACK[job] : undefined);

export const START_CHECKS: [string, string][] = [
  ['walk', 'Walked round with the customer and agreed the order of work'],
  ['protect', 'Dust sheets and floor protection down'],
  ['materials', 'Frames and glass checked against the job pack — nothing damaged'],
  ['safety', 'Work area safe: ladders, tools, cables and pets'],
];
export const COMPLETE_CHECKS: [string, string][] = [
  ['fitted', 'Every frame fitted, level and fixed'],
  ['open', 'Every window and door opens, closes and locks'],
  ['glass', 'Glass is clean and has no marks or chips'],
  ['seal', 'Sealed inside and out'],
  ['trims', 'Trims, cills and boards fitted'],
  ['keys', 'Keys and handles handed over'],
  ['waste', 'Old frames and waste taken away'],
  ['clean', 'House left clean and tidy'],
];
export const PROBLEMS = ['Wrong size', 'Damaged frame or glass', 'Missing part', 'Opening is not as surveyed', 'Customer is not happy', 'Something else'];
export const FIX_REASONS = ['Needs a part', 'Needs another visit', 'Not a fault — advice given', 'Customer not happy yet'];

const done = (n: number) => Object.fromEntries(COMPLETE_CHECKS.map(([k]) => [k, n > 0]));
export const WORK0: Record<string, Work> = {
  // Today: Hartley Dental, day 1 of 2. Job pack already read yesterday.
  ev3: { reviewed: '15 Oct, 16:40' },
  // Past jobs
  ev2: { reviewed: '11 Oct', started: '08:05', fitted: { 0: 1 }, before: 4, days: [{ date: '2026-10-12', start: '08:05', end: '16:30' }, { date: '2026-10-13', start: '08:00', end: '16:10' }, { date: '2026-10-14', start: '08:10', end: '14:20' }], updates: [{ at: '13 Oct, 12:00', day: '2026-10-13', pct: 60, note: 'Roof frame up, glazing tomorrow.', photos: 2 }], complete: { at: '14:20', on: '14 Oct', checks: done(1), photos: 8, snags: ['SN-116'], signed: true, signedBy: 'Mr Khan', shown: true } },
  ev7: { reviewed: '07 Oct', started: '08:00', fitted: { 0: 1, 1: 2 }, before: 3, days: [{ date: '2026-10-08', start: '08:00', end: '16:45' }, { date: '2026-10-09', start: '08:00', end: '15:30' }], complete: { at: '15:30', on: '09 Oct', checks: done(1), photos: 6, snags: ['SN-117'], signed: true, signedBy: 'Mrs Patel', shown: true } },
  ev9: { reviewed: '08 Jun', started: '08:00', fitted: { 0: 4 }, before: 2, days: [{ date: '2026-06-09', start: '08:00', end: '16:00' }, { date: '2026-06-10', start: '08:00', end: '12:00' }], complete: { at: '12:00', on: '10 Jun', checks: done(1), photos: 5, snags: [], signed: true, signedBy: 'Mrs Cooper', shown: true } },
};

export const MSGS0: Record<string, Msg[]> = {
  'JG-10493': [
    { id: 'm1', from: 'office', who: 'Sarah Mitchell', text: 'Job pack is ready for Hartley Dental. Use the rear entrance — patients come in the front.', when: '15 Oct, 14:10' },
    { id: 'm2', from: 'me', who: 'Amir Khan', text: 'Read it, thanks. We will start with the treatment rooms.', when: '15 Oct, 16:42' },
    { id: 'm3', from: 'office', who: 'Sarah Mitchell', text: 'Dr Hartley asked if you can keep the noise down between 10 and 12. Thanks!', when: '16 Oct, 07:30' },
  ],
  'JG-10477': [
    { id: 'm4', from: 'office', who: 'Sarah Mitchell', text: 'The Bakers are booked for 20–21 Oct with you and Joe. Job pack is out — please read it before Monday.', when: '16 Oct, 09:15' },
    { id: 'm5', from: 'customer', who: 'Mrs Baker', text: 'We will move the car the night before. The dog will be in the kitchen.', when: '16 Oct, 09:40' },
  ],
  'JG-10471': [
    { id: 'm6', from: 'office', who: 'Sarah Mitchell', text: 'The new handle for Mrs Patel arrived. Can you fit it first thing Friday before Hartley Dental? Same town.', when: '15 Oct, 11:05' },
  ],
  'JG-10398': [
    { id: 'm7', from: 'office', who: 'Sarah Mitchell', text: 'Mrs Cooper says the back bedroom handle is loose. Priya is checking the draught the same week.', when: '16 Oct, 10:20' },
  ],
};
