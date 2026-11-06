// What the installer sees: only the bookings the office made with them — installations (one or more days),
// return visits to fix snags, aftercare visits, workshop days and time off.
// Everything saved here goes onto the same job records the office uses.
import { useMemo } from 'react';
import { me, IMG, installers } from '../data/mock';
import { useStore, TODAY, addDays, fmtDate, DiaryEvent, JobX } from '../data/store';
import { Work, Msg, Pack, packFor } from '../data/installs';

export type BKind = 'Installation' | 'Return visit' | 'Workshop' | 'Time off';
export type BStatus = 'Booked' | 'On my way' | 'On site' | 'Paused' | 'Completed' | 'Not in';
export type Booking = {
  id: string; kind: BKind; ev: DiaryEvent; job?: JobX; pack?: Pack; work: Work;
  date: string; end: string; days: number; dayNo: number; time: string; status: BStatus;
  customer: string; address: string; town: string; photo: string; crew: { id: string; name: string; initials: string; role: string; phone: string }[];
  frames: number; fitted: number; pct: number; snags: any[]; to: string; title: string; moveAsked?: string;
};

export const statusTone: Record<BStatus, string> = { Booked: 'jade', 'On my way': 'warn', 'On site': 'warn', Paused: 'grey', Completed: 'ok', 'Not in': 'err' };
export const nowTime = () => new Date().toTimeString().slice(0, 5);
export const short = (iso: string) => fmtDate(iso, { day: '2-digit', month: 'short' });
export const img = (k?: string) => IMG[(k || 'house') as keyof typeof IMG] || IMG.house;
export const startOf = (t: string) => (t || '').split(' ')[0];
export const plural = (n: number, w: string, ws = w + 's') => `${n} ${n === 1 ? w : ws}`;
export const maps = (a: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
export const dayLabel = (iso: string) => (iso === TODAY ? 'Today' : iso === addDays(TODAY, 1) ? 'Tomorrow' : iso === addDays(TODAY, -1) ? 'Yesterday' : fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long' }));
export const range = (b: { date: string; end: string; days: number }) => (b.days > 1 ? `${fmtDate(b.date, { weekday: 'short', day: 'numeric' })} – ${fmtDate(b.end, { weekday: 'short', day: 'numeric', month: 'short' })}` : fmtDate(b.date));
export const isOpen = (b: Booking) => ['Booked', 'On my way', 'On site', 'Paused'].includes(b.status) && (b.kind === 'Installation' || b.kind === 'Return visit');
export const isCustomer = (b: Booking) => b.kind === 'Installation' || b.kind === 'Return visit';
export const covers = (b: { date: string; end: string }, d: string) => d >= b.date && d <= b.end;

export function toBooking(ev: DiaryEvent, jobs: JobX[], work: Record<string, Work>, snags: any[]): Booking {
  const job = jobs.find(j => j.id === ev.job);
  const pack = packFor(ev.job);
  const w = work[ev.id] || {};
  const kind: BKind = ev.kind === 'install' ? 'Installation' : ev.kind === 'snag' ? 'Return visit' : ev.kind === 'leave' ? 'Time off' : 'Workshop';
  const end = addDays(ev.date, ev.days - 1);
  const frames = (pack?.items || []).reduce((a, i) => a + i.qty, 0);
  const fitted = (pack?.items || []).reduce((a, i, k) => a + Math.min(i.qty, w.fitted?.[k] || 0), 0);
  const done = kind === 'Installation' ? !!w.complete : kind === 'Return visit' ? !!w.visitDone : ev.date < TODAY;
  const status: BStatus = w.noAccess ? 'Not in' : done ? 'Completed' : w.paused ? 'Paused' : w.started ? 'On site' : w.onWay ? 'On my way' : 'Booked';
  const dayNo = TODAY >= ev.date && TODAY <= end ? Math.round((new Date(TODAY).getTime() - new Date(ev.date).getTime()) / 864e5) + 1 : 0;
  const crew = (ev.crew || []).map(id => installers.find(i => i.id === id)).filter(Boolean) as any[];
  const customer = job?.customer || ev.title.split(' · ')[0];
  return {
    id: ev.id, kind, ev, job, pack, work: w, date: ev.date, end, days: ev.days, dayNo, time: ev.time || '08:00 – 17:00', status,
    customer, address: job ? `${job.address}, ${job.postcode}` : ev.sub, town: job ? job.address.split(', ').slice(-1)[0] : ev.sub,
    photo: (job?.photo || ev.photo) as string, crew, frames, fitted, pct: frames ? Math.round((fitted / frames) * 100) : 0,
    snags: (ev.snags || []).map(id => snags.find(s => s.id === id)).filter(Boolean), title: ev.title,
    to: kind === 'Installation' ? `/job/${ev.id}` : kind === 'Return visit' ? `/visit/${ev.id}` : `/day/${ev.id}`, moveAsked: w.moveAsked,
  };
}

/** Snags from this booking that are still open (installation: new snags; return visit: not fixed). */
export const openSnags = (b: Booking, snags: any[]) => b.kind === 'Installation' ? snags.filter(s => (b.work.complete?.snags || []).includes(s.id) && s.status !== 'Fixed').length : Object.values(b.work.fixes || {}).filter(f => !f.fixed).length;

export function useMyBookings(): Booking[] {
  const { events, jobs, work, snags } = useStore();
  return useMemo(() => events.filter(e => (e.crew || []).includes(me.id)).map(e => toBooking(e, jobs, work, snags)).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)), [events, jobs, work, snags]);
}
export const useBooking = (id?: string) => useMyBookings().find(b => b.id === id);

/** Things the installer should know about (the bell). */
export type Alert = { id: string; title: string; sub: string; to: string; tone: string; icon: 'job' | 'fix' | 'alert' | 'cal' | 'msg' | 'pack' };
export function useAlerts(): Alert[] {
  const list = useMyBookings();
  const { msgs } = useStore();
  return useMemo(() => {
    const out: Alert[] = [];
    list.filter(b => b.status === 'On site' && !covers(b, TODAY)).forEach(b => out.push({ id: 'p' + b.id, title: `Not finished: ${b.customer}`, sub: 'You started this job but have not completed it', to: b.to, tone: 'err', icon: 'alert' }));
    list.filter(b => b.kind === 'Installation' && isOpen(b) && !b.work.reviewed).forEach(b => out.push({ id: 'k' + b.id, title: `Read the job pack: ${b.customer}`, sub: `${range(b)} · ${plural(b.frames, 'frame')}`, to: `/job/${b.id}/pack`, tone: 'warn', icon: 'pack' }));
    list.filter(b => covers(b, TODAY) && isOpen(b)).forEach(b => out.push({ id: 't' + b.id, title: `Today: ${b.customer}`, sub: `${b.kind}${b.days > 1 ? ` · day ${b.dayNo} of ${b.days}` : ''} · arrive ${startOf(b.time)}`, to: b.to, tone: 'jade', icon: b.kind === 'Installation' ? 'job' : 'fix' }));
    list.filter(b => b.date > TODAY && isOpen(b)).slice(0, 3).forEach(b => out.push({ id: 'b' + b.id, title: `Booked for you: ${b.customer}`, sub: `${range(b)} · ${b.kind}`, to: b.to, tone: 'ok', icon: 'cal' }));
    Object.entries(msgs).forEach(([job, ms]) => { const last = ms[ms.length - 1]; if (last && last.from !== 'me' && last.from !== 'system') { const b = list.find(x => x.job?.id === job && isOpen(x)); out.push({ id: 'm' + last.id, title: `${last.who}: ${last.text.slice(0, 40)}${last.text.length > 40 ? '…' : ''}`, sub: `${b?.customer || job} · ${last.when}`, to: `/messages/${job}`, tone: 'jade', icon: 'msg' }); } });
    return out;
  }, [list, msgs]);
}

/* ---------- Messages: one conversation per job ---------- */
export const needsReply = (ms: Msg[]) => { const last = [...ms].reverse().find(m => m.from !== 'system'); return !!last && last.from !== 'me'; };
export function useConversations() {
  const list = useMyBookings();
  const { msgs, jobs } = useStore();
  return useMemo(() => {
    const ids = Array.from(new Set([...list.filter(b => b.job).map(b => b.job!.id), ...Object.keys(msgs)]));
    return ids.map(id => ({ job: jobs.find(j => j.id === id)!, ms: msgs[id] || [], b: list.find(b => b.job?.id === id && isOpen(b)) || list.filter(b => b.job?.id === id).slice(-1)[0] }))
      .filter(r => r.job && r.b && (r.ms.length > 0 || isOpen(r.b)))
      .sort((a, b) => (b.ms.length ? 1 : 0) - (a.ms.length ? 1 : 0) || (needsReply(b.ms) ? 1 : 0) - (needsReply(a.ms) ? 1 : 0));
  }, [list, msgs, jobs]);
}

/* ---------- Actions ---------- */
export const arrivalText = (b: Booking, at: string) => `Hello ${b.customer}, this is ${me.name} from Jadeite Glazing. I am on my way ${b.kind === 'Installation' ? (b.dayNo > 1 ? 'for day ' + b.dayNo + ' of your installation' : 'to fit your new ' + (b.job?.products || 'windows').toLowerCase()) : 'for your return visit'} and should be with you at about ${at || '…'}.`;
export const suggestedArrival = () => { const d = new Date(); d.setMinutes(Math.ceil((d.getMinutes() + 20) / 5) * 5); return d.toTimeString().slice(0, 5); };

export function useActions() {
  const { set, now, log } = useStore();
  const put = (id: string, fn: (w: Work) => Work) => set('work', ws => ({ ...ws, [id]: fn(ws[id] || {}) }));
  const say = (job: string | undefined, text: string, from: Msg['from'] = 'system', who = me.name) => { if (!job) return; set('msgs', ms => ({ ...ms, [job]: [...(ms[job] || []), { id: 'm' + Date.now() + Math.random().toString(36).slice(2, 5), from, who, text, when: now() }] })); };
  const jl = (b: Booking, what: string) => { if (b.job) log(b.job.id, what, me.name); };
  return {
    put, say,
    review: (b: Booking) => { put(b.id, w => ({ ...w, reviewed: now() })); jl(b, 'Job pack read by the installer'); },
    onWay: (b: Booking, at: string) => { put(b.id, w => ({ ...w, onWay: nowTime(), paused: undefined })); say(b.job?.id, `Text sent to the customer: on my way, arriving about ${at}.`); },
    start: (b: Booking, pre: Record<string, boolean>, before: number) => {
      put(b.id, w => ({ ...w, started: w.started || nowTime(), pre, before: (w.before || 0) + before, paused: undefined, days: (w.days || []).some(d => d.date === TODAY) ? (w.days || []).map(d => (d.date === TODAY ? { ...d, end: undefined } : d)) : [...(w.days || []), { date: TODAY, start: nowTime() }] }));
      const back = (b.work.days || []).some(d => d.date === TODAY);
      jl(b, back ? 'Installer back on site' : b.kind === 'Installation' ? `Installer started on site${b.days > 1 ? ` · day ${b.dayNo || 1} of ${b.days}` : ''}` : 'Installer arrived for the return visit');
      say(b.job?.id, `${me.first} ${back ? 'back on site' : 'started on site'} at ${nowTime()}.`);
    },
    setFitted: (b: Booking, k: number, n: number) => put(b.id, w => ({ ...w, fitted: { ...(w.fitted || {}), [k]: n } })),
    update: (b: Booking, note: string, photos: number) => {
      put(b.id, w => ({ ...w, updates: [...(w.updates || []), { at: now(), day: TODAY, pct: b.pct, note, photos }] }));
      jl(b, `Progress update · ${b.pct}% done${note ? ` · ${note}` : ''}`);
      say(b.job?.id, `${b.pct}% done.${note ? ' ' + note : ''}${photos ? ` (${plural(photos, 'photo')})` : ''}`, 'me');
    },
    problem: (b: Booking, kind: string, note: string, photos: number, stop: boolean) => {
      put(b.id, w => ({ ...w, problems: [...(w.problems || []), { id: 'p' + Date.now(), at: now(), kind, note, photos, stop }] }));
      jl(b, `Problem reported: ${kind} — ${note}`);
      say(b.job?.id, `Problem: ${kind}. ${note}${stop ? ' I have had to stop work.' : ''}`, 'me');
    },
    pause: (b: Booking, note: string, back: string) => {
      put(b.id, w => ({ ...w, paused: nowTime(), onWay: undefined, days: (w.days || []).map(d => (d.date === TODAY ? { ...d, end: nowTime(), note } : d)) }));
      jl(b, `Finished for today · ${b.pct}% done · back ${back}`);
      say(b.job?.id, `Finished for today at ${nowTime()}. ${b.pct}% done.${note ? ' ' + note : ''} Back ${back}.`, 'me');
    },
    cantMake: (b: Booking, text: string) => { put(b.id, w => ({ ...w, moveAsked: text })); say(b.job?.id, `Can't make ${fmtDate(b.date)}: ${text}`, 'me'); },
    noAccess: (b: Booking, reason: string) => { put(b.id, w => ({ ...w, noAccess: reason })); jl(b, `Customer not in — ${reason}`); say(b.job?.id, `Customer not in. ${reason} Please rebook.`, 'me'); },
  };
}
export { addDays };
