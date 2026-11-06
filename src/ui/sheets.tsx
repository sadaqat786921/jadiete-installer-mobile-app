// The installer's pop-ups (bottom sheets): On my way, Can't make it, Customer not in, Report a problem,
// Progress update, Finish for today, Time off, Log a call, Message the office, and the job "more" menu.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconSend, IconClock, IconInfoCircle, IconCalendarOff, IconDoorOff, IconAlertTriangle, IconBeach, IconCircleCheck, IconPhone,
  IconMapPin, IconMessage, IconCar, IconPhoneCall, IconHistory, IconFileText, IconAlertOctagon, IconMoon, IconChartBar, IconUsers,
} from '@tabler/icons-react';
import { Sheet, Field, Check, useToast, PhotoGrid } from './kit';
import { me } from '../data/mock';
import { useStore, TODAY, addDays, fmtDate } from '../data/store';
import { PROBLEMS } from '../data/installs';
import { Booking, useActions, arrivalText, suggestedArrival, maps, plural, covers } from '../lib/jobs';

export function OnMyWaySheet({ b, onClose }: { b: Booking; onClose: () => void }) {
  const toast = useToast();
  const { onWay } = useActions();
  const [at, setAt] = useState(suggestedArrival);
  const valid = /^\d{2}:\d{2}$/.test(at);
  return (
    <Sheet title="Tell the customer you are on your way" sub={`${b.customer} · ${b.job?.phone || ''}`} onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!valid} onClick={() => { onWay(b, at); toast(`Text sent · arriving about ${at}`); onClose(); }}><IconSend size={18} />Send text</button></>}>
      <Field label="What time will you get there?" hint={`Type the time, for example 08:15. Booked to arrive ${b.time.split(' ')[0]}.`}>
        <div className="input-icon"><IconClock size={20} /><input type="time" className="input" value={at} onChange={x => setAt(x.target.value)} aria-label="Arrival time" style={{ fontSize: 18, fontWeight: 600 }} /></div>
      </Field>
      <div className="card flat tight" style={{ background: 'var(--bg)' }}><span className="tiny muted b">TEXT TO {b.job?.phone || b.customer}</span><span className="small t2">{arrivalText(b, valid ? at : '')}</span></div>
      <div className="alert info"><IconInfoCircle size={17} />The office sees it too, so they can answer if the customer calls.</div>
    </Sheet>
  );
}

export function CantMakeItSheet({ b, onClose }: { b: Booking; onClose: () => void }) {
  const toast = useToast();
  const { cantMake } = useActions();
  const [why, setWhy] = useState('Van broken down');
  const [when, setWhen] = useState(addDays(b.date < TODAY ? TODAY : b.date, 1));
  const [note, setNote] = useState('');
  return (
    <Sheet title="Can't make this job?" sub={`${b.customer} · ${fmtDate(b.date)}`} onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { cantMake(b, `${why}. Could do ${fmtDate(when, { weekday: 'long', day: 'numeric', month: 'long' })}.${note ? ' ' + note : ''}`); toast('Sent to Sarah in the office'); onClose(); }}><IconCalendarOff size={18} />Ask to move it</button></>}>
      <Field label="What is the reason?"><div className="chips wrap">{['Van broken down', 'Unwell', 'Last job is running over', 'Materials not ready', 'Other'].map(r => <button key={r} type="button" className={`chip ${why === r ? 'on' : ''}`} onClick={() => setWhy(r)}>{r}</button>)}</div></Field>
      <Field label="When could you go instead?"><input type="date" className="input" min={TODAY} value={when} onChange={x => x.target.value && setWhen(x.target.value)} /></Field>
      <Field label="Anything else? (optional)"><input className="input" value={note} onChange={x => setNote(x.target.value)} placeholder="e.g. Joe can start without me" /></Field>
      <div className="alert info"><IconInfoCircle size={17} />The office moves the booking and tells the customer and your crew.</div>
    </Sheet>
  );
}

export function NoAccessSheet({ b, onClose }: { b: Booking; onClose: () => void }) {
  const toast = useToast();
  const nav = useNavigate();
  const { noAccess } = useActions();
  const [rang, setRang] = useState(true);
  const [called, setCalled] = useState(true);
  const [waited, setWaited] = useState(true);
  const [note, setNote] = useState('');
  return (
    <Sheet title="The customer is not in" sub={`${b.customer} · ${b.address}`} onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-danger" disabled={!rang && !called && note.trim().length < 3} onClick={() => { noAccess(b, [rang && 'No answer at the door', called && 'no answer on the phone', waited && 'waited 20 minutes'].filter(Boolean).join(', ') + (note ? `. ${note}` : '.')); toast('Sent back to the office to rebook'); onClose(); nav('/'); }}><IconDoorOff size={18} />Send back</button></>}>
      <div className="vstack" style={{ gap: 4 }}>
        <Check on={rang} onChange={setRang} label="I knocked and rang the bell" />
        <Check on={called} onChange={setCalled} label={`I called ${b.job?.phone || 'the customer'}`} />
        <Check on={waited} onChange={setWaited} label="I waited at least 20 minutes" />
      </div>
      <Field label="Anything else? (optional)"><input className="input" value={note} onChange={x => setNote(x.target.value)} placeholder="e.g. Neighbour says they are away" /></Field>
      <div className="alert warn"><IconAlertTriangle size={17} />The office books a new date with the customer and it comes back to you.</div>
    </Sheet>
  );
}

export function ProblemSheet({ b, onClose }: { b: Booking; onClose: () => void }) {
  const toast = useToast();
  const { problem } = useActions();
  const [kind, setKind] = useState('');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState(0);
  const [stop, setStop] = useState(false);
  return (
    <Sheet title="Report a problem" sub={`${b.customer} · goes to the office straight away`} onClose={onClose} full
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!kind || note.trim().length < 4} onClick={() => { problem(b, kind, note, photos, stop); toast('Sent to the office · they will call you'); onClose(); }}><IconSend size={18} />Send to the office</button></>}>
      <Field label="What is wrong?"><div className="chips wrap">{PROBLEMS.map(p => <button key={p} type="button" className={`chip ${kind === p ? 'on' : ''}`} onClick={() => setKind(p)}>{p}</button>)}</div></Field>
      <Field label="Tell the office what you found"><textarea className="textarea" value={note} onChange={x => setNote(x.target.value)} placeholder="e.g. Kitchen window is 30mm too narrow for the opening" /></Field>
      <Field label={`Photos · ${photos}`}><PhotoGrid n={photos} seed={2} onAdd={() => setPhotos(p => p + 1)} onRemove={() => setPhotos(p => Math.max(0, p - 1))} /></Field>
      <Check on={stop} onChange={setStop} label="I have had to stop work because of this" />
      <div className="alert info"><IconInfoCircle size={17} />Sarah in the office gets this now. Carry on with the rest of the job if you can.</div>
    </Sheet>
  );
}

export function UpdateSheet({ b, onClose }: { b: Booking; onClose: () => void }) {
  const toast = useToast();
  const { update } = useActions();
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState(1);
  return (
    <Sheet title="Send a progress update" sub={`${b.customer} · ${b.pct}% done · ${b.fitted} of ${plural(b.frames, 'frame')} fitted`} onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { update(b, note, photos); toast('Update sent to the office'); onClose(); }}><IconChartBar size={18} />Send update</button></>}>
      <Field label="How is it going? (optional)"><textarea className="textarea" value={note} onChange={x => setNote(x.target.value)} placeholder="e.g. Treatment rooms done, starting the waiting room" /></Field>
      <Field label={`Photos · ${photos}`}><PhotoGrid n={photos} seed={1} onAdd={() => setPhotos(p => p + 1)} onRemove={() => setPhotos(p => Math.max(0, p - 1))} /></Field>
      <div className="alert info"><IconInfoCircle size={17} />The office sees this on the job straight away.</div>
    </Sheet>
  );
}

export function PauseSheet({ b, onClose }: { b: Booking; onClose: () => void }) {
  const toast = useToast();
  const nav = useNavigate();
  const { pause } = useActions();
  const tomorrowIn = covers(b, addDays(TODAY, 1));
  const [back, setBack] = useState(tomorrowIn ? `tomorrow at ${b.time.split(' ')[0]}` : 'on the next booked day');
  const [note, setNote] = useState('');
  return (
    <Sheet title="Finish for today?" sub={`${b.customer} · day ${b.dayNo || 1} of ${b.days} · ${b.pct}% done`} onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { pause(b, note, back); toast('Day saved · the customer and office are told'); onClose(); nav('/'); }}><IconMoon size={18} />Finish for today</button></>}>
      <div className="card flat tight" style={{ background: 'var(--bg)' }}><span className="small t2"><b style={{ color: 'var(--text)' }}>{b.fitted} of {plural(b.frames, 'frame')}</b> fitted so far. Leave the house safe, locked and tidy.</span></div>
      <Field label="What is left to do?"><textarea className="textarea" value={note} onChange={x => setNote(x.target.value)} placeholder="e.g. Waiting room and reception, then seal and trims" /></Field>
      <Field label="When are you back?"><input className="input" value={back} onChange={x => setBack(x.target.value)} /></Field>
      <div className="alert info"><IconInfoCircle size={17} />The customer gets a text saying when you are back. Everything you did today is saved.</div>
    </Sheet>
  );
}

export function TimeOffSheet({ onClose, day }: { onClose: () => void; day?: string }) {
  const toast = useToast();
  const { set, events } = useStore();
  const [date, setDate] = useState(day && day > TODAY ? day : addDays(TODAY, 10));
  const [days, setDays] = useState(1);
  const [why, setWhy] = useState('Holiday');
  const clash = events.find(e => (e.crew || []).includes(me.id) && e.kind !== 'leave' && date <= addDays(e.date, e.days - 1) && addDays(date, days - 1) >= e.date);
  return (
    <Sheet title="Ask for time off" sub="The office says yes or no. Nothing is booked for you then." onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!!clash} onClick={() => { set('events', es => [...es, { id: 'lv' + Date.now(), team: 'crew', crew: [me.id], date, days, kind: 'leave', title: `${me.name} · ${why}`, sub: 'Waiting for the office to agree', photo: 'window', status: 'Requested' }]); toast(`Asked for ${plural(days, 'day')} off from ${fmtDate(date)}`); onClose(); }}><IconBeach size={18} />Send request</button></>}>
      <Field label="First day"><input type="date" className="input" min={TODAY} value={date} onChange={x => x.target.value && setDate(x.target.value)} /></Field>
      <Field label="How many days?"><div className="seg">{[1, 2, 3, 5].map(n => <button key={n} type="button" className={days === n ? 'on' : ''} onClick={() => setDays(n)}>{n}</button>)}</div></Field>
      <Field label="Reason"><div className="chips wrap">{['Holiday', 'Appointment', 'Training', 'Other'].map(r => <button key={r} type="button" className={`chip ${why === r ? 'on' : ''}`} onClick={() => setWhy(r)}>{r}</button>)}</div></Field>
      {clash ? <div className="alert err"><IconAlertTriangle size={17} />You are booked on {clash.title} then. Ask the office to move that job first.</div> : <div className="alert ok"><IconCircleCheck size={17} />Nothing is booked for you then.</div>}
    </Sheet>
  );
}

export function CallSheet({ b, onClose }: { b: Booking; onClose: () => void }) {
  const toast = useToast();
  const { say } = useActions();
  const [dir, setDir] = useState('I called');
  const [out, setOut] = useState('Spoke to customer');
  const [txt, setTxt] = useState('');
  return (
    <Sheet title="Log a phone call" sub={`${b.customer} · ${b.job?.phone || ''}`} onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!txt.trim()} onClick={() => { say(b.job?.id, `Call · ${dir === 'I called' ? 'I called the customer' : 'Customer called me'} · ${out}: ${txt}`, 'me'); toast('Call saved on the job'); onClose(); }}>Save call</button></>}>
      <Field label="Who called"><div className="seg">{['I called', 'They called'].map(o => <button key={o} type="button" className={dir === o ? 'on' : ''} onClick={() => setDir(o)}>{o}</button>)}</div></Field>
      <Field label="What happened"><div className="chips wrap">{['Spoke to customer', 'Left a voicemail', 'No answer'].map(o => <button key={o} type="button" className={`chip ${out === o ? 'on' : ''}`} onClick={() => setOut(o)}>{o}</button>)}</div></Field>
      <Field label="What was said"><textarea className="textarea" value={txt} onChange={x => setTxt(x.target.value)} placeholder="Short summary of the call" /></Field>
    </Sheet>
  );
}

export function OfficeMsgSheet({ b, onClose }: { b: Booking; onClose: () => void }) {
  const toast = useToast();
  const { say } = useActions();
  const [txt, setTxt] = useState('');
  return (
    <Sheet title="Message the office" sub="Only staff see this · Sarah Mitchell" onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!txt.trim()} onClick={() => { say(b.job?.id, txt, 'me'); toast('Sent to the office'); onClose(); }}><IconSend size={18} />Send</button></>}>
      <textarea className="textarea" style={{ height: 130, background: '#fffbef' }} value={txt} onChange={x => setTxt(x.target.value)} placeholder="e.g. Running 20 minutes late" autoFocus />
      <div className="chips wrap">{['Running about 20 minutes late', 'Need an extra pair of hands tomorrow', 'Customer has asked about the price'].map(s => <button key={s} type="button" className="chip" onClick={() => setTxt(s)}>{s}</button>)}</div>
    </Sheet>
  );
}

/** The "more" menu on a job or visit. */
export function JobMenu({ b, onClose, onPick }: { b: Booking; onClose: () => void; onPick: (k: string) => void }) {
  const toast = useToast();
  const open = ['Booked', 'On my way', 'On site', 'Paused'].includes(b.status);
  const item = (k: string, I: any, l: string, s: string, tone?: string) => (
    <button key={k} className="menu-item" onClick={() => { onClose(); onPick(k); }}>
      <span className="ic" style={tone === 'warn' ? { background: '#fdf3d9', color: '#8a6400' } : tone === 'err' ? { background: '#fdeeee', color: '#d64545' } : undefined}><I size={20} /></span>
      <span className="grow">{l}<small>{s}</small></span>
    </button>
  );
  return (
    <Sheet title={b.customer} sub={`${b.kind} · ${b.job?.id || ''}`} onClose={onClose}>
      <div className="vstack" style={{ gap: 0 }}>
        <a className="menu-item" href={`tel:${(b.job?.phone || '').replace(/\s/g, '')}`} onClick={() => { toast(`Calling ${b.customer}`); onClose(); }}><span className="ic"><IconPhone size={20} /></span><span className="grow">Call the customer<small>{b.job?.phone}</small></span></a>
        <a className="menu-item" href={maps(b.address)} target="_blank" rel="noreferrer" onClick={onClose}><span className="ic"><IconMapPin size={20} /></span><span className="grow">Directions<small>{b.address}</small></span></a>
        {b.kind === 'Installation' && item('pack', IconFileText, 'Job pack', 'Sizes, access, notes and documents')}
        {b.crew.length > 1 && item('crew', IconUsers, 'My crew', b.crew.map(c => c.name.split(' ')[0]).join(', '))}
        {open && b.status === 'Booked' && item('way', IconCar, 'On my way', 'Text the customer your arrival time')}
        {open && b.status === 'On site' && item('problem', IconAlertOctagon, 'Report a problem', 'Wrong size, damage, missing part…', 'warn')}
        {item('call', IconPhoneCall, 'Log a phone call', 'Saved on the job')}
        {item('msg', IconMessage, 'Message the office', 'Only staff see this')}
        {item('history', IconHistory, 'Job history', 'Everything on this job')}
        {open && b.status !== 'On site' && item('cant', IconCalendarOff, "Can't make it", 'Ask the office to move this booking', 'warn')}
        {open && b.status !== 'On site' && b.date <= TODAY && item('noaccess', IconDoorOff, 'Customer not in', 'Send it back to the office to rebook', 'err')}
      </div>
    </Sheet>
  );
}

export function CrewSheet({ b, onClose }: { b: Booking; onClose: () => void }) {
  const toast = useToast();
  return (
    <Sheet title="My crew" sub={`${b.customer} · ${b.days > 1 ? `${b.days} days` : '1 day'}`} onClose={onClose}>
      <div className="vstack" style={{ gap: 0 }}>
        {b.crew.map(c => (
          <a key={c.id} className="menu-item" href={c.id === me.id ? undefined : `tel:${c.phone.replace(/\s/g, '')}`} onClick={() => c.id !== me.id && toast(`Calling ${c.name}`)}>
            <span className="ic" style={{ fontWeight: 600, fontSize: 13 }}>{c.initials}</span>
            <span className="grow">{c.name}{c.id === me.id ? ' (you)' : ''}<small>{c.role} · {c.phone}</small></span>
            {c.id !== me.id && <IconPhone size={18} color="#0b6e5c" />}
          </a>
        ))}
      </div>
    </Sheet>
  );
}
