// An installation on the installer's phone:
// job → read the job pack → On my way → Before you start → on the job (fitted counts, updates, problems,
// finish for today) → Complete the job (checks, snags, photos, handover and signature, submit) → Done → Summary.
import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  IconChevronLeft, IconDots, IconMapPin, IconPhone, IconCar, IconPlayerPlay, IconArrowRight, IconClock, IconAlertTriangle, IconInfoCircle,
  IconCircleCheck, IconFileTypePdf, IconSend, IconDownload, IconChevronRight, IconSignature, IconPhoto, IconListCheck, IconCheck, IconHome,
  IconHistory, IconFileText, IconMinus, IconPlus, IconAlertOctagon, IconChartBar, IconMoon, IconTool, IconTrash, IconMessage, IconUsers, IconCalendarOff,
  IconBox, IconParking, IconRecycle, IconUser, IconBook, IconDoorOff,
} from '@tabler/icons-react';
import { Screen, Header, Tag, Avatar, Thumb, Steps, Field, SignaturePad, PhotoGrid, Empty, useToast, Sheet, Check } from '../ui/kit';
import { OnMyWaySheet, CantMakeItSheet, NoAccessSheet, JobMenu, CallSheet, OfficeMsgSheet, ProblemSheet, UpdateSheet, PauseSheet, CrewSheet } from '../ui/sheets';
import { me } from '../data/mock';
import { useStore, TODAY, fmtDate } from '../data/store';
import { START_CHECKS, COMPLETE_CHECKS } from '../data/installs';
import { Booking, useBooking, useMyBookings, useActions, statusTone, plural, startOf, short, img, maps, nowTime, range, covers, isOpen } from '../lib/jobs';

/** What the big button does next for any booking. */
export function primary(b: Booking): { label: string; to: string; icon: 'play' | 'go' | 'pack' | 'view' } {
  const today = covers(b, TODAY) || b.date < TODAY;
  if (b.kind === 'Return visit') {
    if (b.status === 'Completed') return { label: 'View visit', to: b.to, icon: 'view' };
    if (b.status === 'On site') return { label: 'Carry on', to: b.to, icon: 'go' };
    return { label: today ? 'Start visit' : 'View visit', to: b.to, icon: today ? 'play' : 'view' };
  }
  if (b.kind !== 'Installation') return { label: 'View', to: b.to, icon: 'view' };
  if (b.status === 'Completed') return { label: 'View job summary', to: `/job/${b.id}/summary`, icon: 'view' };
  if (b.status === 'On site') return { label: 'Carry on with the job', to: `/job/${b.id}/work`, icon: 'go' };
  if (!b.work.reviewed) return { label: 'Read the job pack', to: `/job/${b.id}/pack`, icon: 'pack' };
  if (b.status === 'Paused') return covers(b, TODAY) ? ((b.work.days || []).some(d => d.date === TODAY) ? { label: 'Back on site today', to: `/job/${b.id}/start`, icon: 'play' } : { label: `Start day ${b.dayNo} of ${b.days}`, to: `/job/${b.id}/start`, icon: 'play' }) : { label: 'View job', to: b.to, icon: 'view' };
  return today ? { label: 'Start the job', to: `/job/${b.id}/start`, icon: 'play' } : { label: 'View job', to: b.to, icon: 'view' };
}
export const PIcon = ({ k }: { k: string }) => (k === 'play' ? <IconPlayerPlay size={18} /> : k === 'go' ? <IconArrowRight size={18} /> : k === 'pack' ? <IconFileText size={18} /> : <IconChevronRight size={18} />);

function NotMine() {
  return <Screen header={<Header back="/jobs" title="Job" />}><Empty icon={<IconTool size={24} />} title="This job is not booked for you" sub="It may have been moved to another fitter." action={<Link to="/jobs" className="btn btn-primary btn-sm">Back to my jobs</Link>} /></Screen>;
}
const useJob = () => { const { id } = useParams(); const b = useBooking(id); return b && b.kind === 'Installation' ? b : undefined; };

export function JobSheets({ b, sheet, setSheet }: { b: Booking; sheet: string | null; setSheet: (s: string | null) => void }) {
  const nav = useNavigate();
  const close = () => setSheet(null);
  return <>
    {sheet === 'menu' && <JobMenu b={b} onClose={close} onPick={k => (k === 'history' ? nav(`/history/${b.job?.id}`) : k === 'pack' ? nav(`/job/${b.id}/pack`) : setSheet(k))} />}
    {sheet === 'way' && <OnMyWaySheet b={b} onClose={close} />}
    {sheet === 'cant' && <CantMakeItSheet b={b} onClose={close} />}
    {sheet === 'noaccess' && <NoAccessSheet b={b} onClose={close} />}
    {sheet === 'call' && <CallSheet b={b} onClose={close} />}
    {sheet === 'msg' && <OfficeMsgSheet b={b} onClose={close} />}
    {sheet === 'problem' && <ProblemSheet b={b} onClose={close} />}
    {sheet === 'update' && <UpdateSheet b={b} onClose={close} />}
    {sheet === 'pause' && <PauseSheet b={b} onClose={close} />}
    {sheet === 'crew' && <CrewSheet b={b} onClose={close} />}
  </>;
}

export function CrewRow({ b, onOpen }: { b: Booking; onOpen: () => void }) {
  return (
    <button className="card tight" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, border: 0, textAlign: 'left' }} onClick={onOpen}>
      <span className="hstack" style={{ gap: 0 }}>{b.crew.map((c, i) => <span key={c.id} style={{ marginLeft: i ? -10 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px #fff' }}><Avatar i={c.initials} size={36} bg={c.id === me.id ? '#00c7a1' : undefined} fg={c.id === me.id ? '#0b1f1b' : undefined} /></span>)}</span>
      <span className="vstack grow" style={{ gap: 1 }}><b style={{ fontSize: 14 }}>{b.crew.length > 1 ? `With ${b.crew.filter(c => c.id !== me.id).map(c => c.name).join(' and ')}` : 'Just you'}</b><span className="tiny muted">{b.crew.map(c => c.role).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}</span></span>
      <IconChevronRight size={18} color="#a5b2af" />
    </button>
  );
}

export function ProgressCard({ b }: { b: Booking }) {
  return (
    <div className="card">
      <div className="between"><span className="vstack" style={{ gap: 2 }}><span className="tiny muted">Fitted so far</span><b style={{ fontSize: 20 }}>{b.fitted} of {plural(b.frames, 'frame')}</b></span><span className="tag jade" style={{ height: 32, fontSize: 14 }}>{b.pct}%</span></div>
      <div style={{ height: 8, borderRadius: 4, background: '#e6ecea', overflow: 'hidden' }}><div style={{ width: `${b.pct}%`, height: '100%', background: 'var(--primary)', transition: 'width .3s' }} /></div>
      <span className="tiny muted">{b.days > 1 ? `Day ${b.dayNo || 1} of ${b.days}` : 'One-day job'} · started {b.work.started}{b.work.updates?.length ? ` · last update ${b.work.updates[b.work.updates.length - 1].at.split(', ')[1]}` : ''}</span>
    </div>
  );
}

/* ================= Job page ================= */
export function JobPage() {
  const b = useJob();
  if (!b) return <NotMine />;
  return <JobView key={b.id} b={b} />;
}
function JobView({ b }: { b: Booking }) {
  const nav = useNavigate();
  const toast = useToast();
  const [sheet, setSheet] = useState<string | null>(null);
  const w = b.work; const pack = b.pack; const j = b.job;
  const p = primary(b);
  const step = !w.reviewed ? 0 : b.status === 'Completed' ? 3 : w.started ? 2 : 1;
  const today = covers(b, TODAY);
  const foot = b.status === 'Not in' ? undefined
    : b.status === 'Completed' ? <button className="btn btn-primary btn-block" onClick={() => nav(p.to)}>View job summary</button>
    : b.status === 'On site' ? <div className="row2"><button className="btn btn-outline" onClick={() => setSheet('problem')}><IconAlertOctagon size={18} />Problem</button><button className="btn btn-primary" onClick={() => nav(p.to)}>Carry on<IconArrowRight size={18} /></button></div>
    : !w.reviewed ? <button className="btn btn-primary btn-block" onClick={() => nav(p.to)}><IconFileText size={18} />Read the job pack</button>
    : !today && b.date > TODAY ? <><button className="btn btn-primary btn-block" disabled><IconClock size={18} />Starts {fmtDate(b.date, { weekday: 'long', day: 'numeric', month: 'short' })}</button><button className="btn btn-ghost btn-sm" onClick={() => setSheet('cant')}><IconCalendarOff size={16} />Can't make it</button></>
    : b.status === 'Paused' && p.icon === 'view' ? <button className="btn btn-primary btn-block" disabled><IconMoon size={18} />Finished for today</button>
    : <div className="row2">{b.status !== 'On my way' && <button className="btn btn-outline" onClick={() => setSheet('way')}><IconCar size={18} />On my way</button>}<button className="btn btn-primary" onClick={() => nav(p.to)}><IconPlayerPlay size={18} />{b.status === 'Paused' ? ((w.days || []).some(d => d.date === TODAY) ? 'Back on site' : `Start day ${b.dayNo}`) : 'Start job'}</button></div>;
  return (
    <Screen dark foot={foot}>
      <div className="vhero" style={{ backgroundImage: `url(${img(b.photo)})` }}>
        <div className="between" style={{ padding: '6px 16px' }}>
          <button className="icon-btn glass" aria-label="Back" onClick={() => nav(-1)}><IconChevronLeft size={22} /></button>
          <button className="icon-btn glass" aria-label="More" onClick={() => setSheet('menu')}><IconDots size={20} /></button>
        </div>
        <div style={{ marginTop: 'auto', padding: '0 20px 30px' }} className="vstack">
          <span className="hstack" style={{ gap: 6 }}><Tag tone="jade">Installation</Tag><Tag tone={statusTone[b.status]}>{b.status === 'Paused' ? 'Back next day' : b.status}</Tag></span>
          <b style={{ fontSize: 20, letterSpacing: -0.5 }}>{b.customer}</b>
          <span className="hstack small" style={{ gap: 5, color: '#e3eeeb' }}><IconMapPin size={15} />{b.address}</span>
        </div>
      </div>
      <div className="sheet-up pad">
        <div className="card"><Steps at={step} done={b.status === 'Completed'} labels={['Job pack', 'Ready', 'On site', 'Completed']} times={[w.reviewed?.split(', ')[1] || (w.reviewed ? 'read' : undefined), w.onWay, w.started]} /></div>
        {w.noAccess && <div className="alert err"><IconDoorOff size={17} /><span><b>Customer not in.</b> {w.noAccess} The office will rebook.</span></div>}
        {w.moveAsked && b.status !== 'Completed' && <div className="alert warn"><IconCalendarOff size={17} /><span><b>You asked the office to move this job.</b> {w.moveAsked}</span></div>}
        {b.status !== 'Completed' && !w.noAccess && <div className="alert info"><IconArrowRight size={17} /><span>{!w.reviewed ? <><b>Next: read the job pack.</b> Sizes, access, notes and documents are all in it.</> : b.status === 'On site' ? <><b>On site since {w.started}.</b> Update what you have fitted as you go.</> : b.status === 'Paused' ? <><b>Finished for today.</b> {(w.days || []).slice(-1)[0]?.note || 'Everything is saved.'}</> : today ? <><b>Next: {w.onWay ? 'start the job when you arrive' : 'tell the customer you are on your way'}.</b></> : <><b>Booked for {range(b)}.</b> Read everything now; start it on the day.</>}</span></div>}
        {w.started && b.status !== 'Completed' && <ProgressCard b={b} />}
        {b.status === 'Completed' && w.complete && <div className="alert ok"><IconCircleCheck size={17} /><span><b>Completed {w.complete.on}.</b> {w.complete.signed ? `Signed off by ${w.complete.signedBy}.` : 'Not signed by the customer.'} {w.complete.snags.length ? `${plural(w.complete.snags.length, 'snag')} for a return visit.` : 'No snags.'}</span></div>}
        <div className="kv">
          <div><span>When</span><b>{range(b)}</b></div>
          <div><span>Arrive</span><b>{startOf(b.time)}</b></div>
          <div><span>Frames</span><b>{plural(b.frames, 'frame')}</b></div>
          <div><span>Job</span><b>{j?.id}</b></div>
        </div>
        <CrewRow b={b} onOpen={() => setSheet('crew')} />
        {pack && <>
          <div className="sec"><h3>What you are fitting</h3><Link to={`/job/${b.id}/pack`}>Job pack<IconChevronRight size={15} /></Link></div>
          {pack.items.map((i, k) => (
            <div key={k} className="card tight">
              <div className="hstack" style={{ gap: 12, alignItems: 'flex-start' }}>
                <Thumb src={i.photo} size={48} r={12} />
                <div className="vstack grow" style={{ gap: 3 }}><b style={{ fontSize: 14 }}>{i.qty} × {i.name}</b><span className="tiny muted">{i.room}</span><span className="hstack" style={{ gap: 6 }}><Tag tone="jade">{i.size}</Tag>{i.note && <Tag tone="warn">{i.note}</Tag>}</span></div>
                {w.started && <Tag tone={(w.fitted?.[k] || 0) >= i.qty ? 'ok' : 'grey'}>{w.fitted?.[k] || 0}/{i.qty}</Tag>}
              </div>
            </div>
          ))}
          <div className="sec"><h3>Notes for the fitters</h3></div>
          <div className="alert warn"><IconAlertTriangle size={17} /><span><b>From the surveyor:</b> {pack.surveyor}</span></div>
          {pack.flags.map(f => <div key={f} className="alert err"><IconAlertTriangle size={17} /><span>{f}</span></div>)}
          {pack.customer !== '—' && <div className="alert info"><IconUser size={17} /><span><b>The customer asked:</b> {pack.customer}</span></div>}
        </>}
        <div className="sec"><h3>Customer</h3></div>
        <div className="card">
          <div className="hstack" style={{ gap: 12 }}><Avatar i={j?.initials || 'C'} size={44} /><div className="vstack grow" style={{ gap: 1 }}><b>{b.customer}</b><span className="small muted">{j?.phone}</span></div></div>
          <div className="grid-2">
            <a className="btn btn-outline btn-sm" href={`tel:${(j?.phone || '').replace(/\s/g, '')}`} onClick={() => toast(`Calling ${b.customer}`)}><IconPhone size={16} />Call</a>
            <a className="btn btn-outline btn-sm" href={maps(b.address)} target="_blank" rel="noreferrer"><IconMapPin size={16} />Directions</a>
          </div>
        </div>
        <div className="grid-2">
          <Link className="btn btn-grey btn-sm" to={`/messages/${j?.id}`}><IconMessage size={16} />Messages</Link>
          <Link className="btn btn-grey btn-sm" to={`/history/${j?.id}`}><IconHistory size={16} />History</Link>
        </div>
      </div>
      <JobSheets b={b} sheet={sheet} setSheet={setSheet} />
    </Screen>
  );
}

/* ================= Job pack ================= */
export function JobPack() {
  const b = useJob();
  const nav = useNavigate();
  const toast = useToast();
  const { review } = useActions();
  if (!b || !b.pack) return <NotMine />;
  const p = b.pack;
  return (
    <Screen header={<Header back onBack={() => nav(`/job/${b.id}`)} title="Job pack" sub={`${b.customer} · ${b.job?.id}`} white />}
      foot={b.work.reviewed ? <><span className="tiny muted" style={{ textAlign: 'center' }}>You read this on {b.work.reviewed}</span><button className="btn btn-outline btn-block" onClick={() => nav(`/job/${b.id}`)}>Back to the job</button></> : <button className="btn btn-primary btn-block" onClick={() => { review(b); toast('Job pack read · the office can see it'); nav(`/job/${b.id}`); }}><IconCheck size={18} />I have read the job pack</button>}>
      <div className="pad">
        <div className="card">
          <div className="between"><span className="vstack" style={{ gap: 2 }}><span className="tiny muted">When</span><b style={{ fontSize: 16 }}>{range(b)}</b></span><Tag tone="jade">{b.days > 1 ? `${b.days} days` : '1 day'}</Tag></div>
          <div className="divider" />
          <div className="facts">
            <span><IconClock size={16} />Arrive {startOf(b.time)} · {p.hours}</span>
            <span><IconUsers size={16} />{b.crew.map(c => c.name).join(', ')}</span>
            <span><IconUser size={16} />On site: {p.contact}</span>
          </div>
        </div>
        <div className="sec"><h3>Sizes and positions</h3><span className="tiny muted">{plural(b.frames, 'frame')}</span></div>
        <div className="card flush"><div className="list">
          {p.items.map((i, k) => (
            <div key={k} className="li" style={{ alignItems: 'flex-start' }}>
              <Thumb src={i.photo} size={44} r={12} />
              <span className="vstack grow" style={{ gap: 3 }}><b style={{ fontSize: 14 }}>{i.qty} × {i.name}</b><span className="tiny muted">{i.room}</span>{i.note && <span className="tiny" style={{ color: '#8a6400' }}>{i.note}</span>}</span>
              <span className="tag jade">{i.size}</span>
            </div>
          ))}
        </div></div>
        <div className="sec"><h3>On site</h3></div>
        <div className="card flush"><div className="list">
          {([[IconMapPin, 'Access', p.access], [IconParking, 'Parking', p.parking], [IconBox, 'Materials', p.materials], [IconRecycle, 'Waste', p.waste]] as [any, string, string][]).map(([I, l, v]) => (
            <div key={l} className="li" style={{ alignItems: 'flex-start' }}><span className="ic"><I size={18} /></span><span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{l}</b><span className="small t2">{v}</span></span></div>
          ))}
        </div></div>
        <div className="sec"><h3>Notes</h3></div>
        <div className="alert warn"><IconAlertTriangle size={17} /><span><b>From the surveyor:</b> {p.surveyor}</span></div>
        {p.flags.map(f => <div key={f} className="alert err"><IconAlertTriangle size={17} /><span>{f}</span></div>)}
        {p.customer !== '—' && <div className="alert info"><IconUser size={17} /><span><b>The customer asked:</b> {p.customer}</span></div>}
        <div className="sec"><h3>Documents</h3></div>
        {p.docs.map(([f, s]) => <button key={f} className="file" onClick={() => toast(`Opening ${f}`)}><IconFileTypePdf size={26} color="#d64545" /><span className="grow vstack" style={{ gap: 1 }}><b className="small">{f}</b><span className="tiny muted">{s}</span></span><IconChevronRight size={18} color="#a5b2af" /></button>)}
      </div>
    </Screen>
  );
}

/* ================= Before you start ================= */
export function StartJob() {
  const b = useJob();
  const nav = useNavigate();
  const toast = useToast();
  const { start } = useActions();
  const [pre, setPre] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState(0);
  if (!b) return <NotMine />;
  if (b.status === 'Completed') return <Navigate to={`/job/${b.id}/summary`} replace />;
  if (b.status === 'On site') return <Navigate to={`/job/${b.id}/work`} replace />;
  const firstDay = !b.work.started;
  const ok = START_CHECKS.every(([k]) => pre[k]) && (!firstDay || photos > 0);
  return (
    <Screen header={<Header back onBack={() => nav(`/job/${b.id}`)} title="Before you start" sub={`${b.customer}${b.days > 1 ? ` · day ${b.dayNo || 1} of ${b.days}` : ''}`} />}
      foot={<><button className="btn btn-primary btn-block" disabled={!ok} onClick={() => { const back = (b.work.days || []).some(d => d.date === TODAY); start(b, pre, photos); toast(`${back ? 'Back on site' : 'Started'} at ${nowTime()} · the office can see it`); nav(`/job/${b.id}/work`, { replace: true }); }}><IconPlayerPlay size={18} />{firstDay ? 'Start the job' : (b.work.days || []).some(d => d.date === TODAY) ? 'Back on site' : `Start day ${b.dayNo}`}</button>{!ok && <span className="tiny muted" style={{ textAlign: 'center' }}>Tick every check{firstDay ? ' and take at least one photo before you start' : ''}.</span>}</>}>
      <div className="pad" style={{ paddingTop: 6 }}>
        <span className="small t2">A quick check so the job starts safely and the customer knows what is happening.</span>
        <div className="card">
          <div className="between"><b style={{ fontSize: 15 }}>Checks</b><button className="link" onClick={() => setPre(Object.fromEntries(START_CHECKS.map(([k]) => [k, true])))}>Tick all</button></div>
          <div className="vstack" style={{ gap: 2 }}>{START_CHECKS.map(([k, l]) => <Check key={k} on={!!pre[k]} onChange={v => setPre(p => ({ ...p, [k]: v }))} label={l} />)}</div>
        </div>
        {b.pack?.flags.map(f => <div key={f} className="alert err"><IconAlertTriangle size={17} /><span>{f}</span></div>)}
        <div className="card">
          <div className="between"><b style={{ fontSize: 15 }}>Photos before you start</b><span className="tiny muted">{plural(photos, 'photo')}</span></div>
          <span className="small t2">The old frames and anything already damaged, so nobody blames the work later.</span>
          <PhotoGrid n={photos} seed={0} onAdd={() => { setPhotos(p => p + 1); toast('Photo added'); }} onRemove={() => setPhotos(p => Math.max(0, p - 1))} />
        </div>
      </div>
    </Screen>
  );
}

/* ================= On the job ================= */
export function Work() {
  const b = useJob();
  const nav = useNavigate();
  const toast = useToast();
  const { setFitted } = useActions();
  const [sheet, setSheet] = useState<string | null>(null);
  if (!b) return <NotMine />;
  if (b.status === 'Completed') return <Navigate to={`/job/${b.id}/summary`} replace />;
  if (b.status !== 'On site') return <Navigate to={`/job/${b.id}`} replace />;
  const w = b.work; const items = b.pack?.items || [];
  const multi = b.days > 1 && (b.dayNo || 1) < b.days;
  return (
    <Screen header={<Header back onBack={() => nav(`/job/${b.id}`)} title={b.customer} sub={`On site${b.days > 1 ? ` · day ${b.dayNo || 1} of ${b.days}` : ''} · since ${w.started}`} right={<button className="icon-btn" aria-label="More" onClick={() => setSheet('menu')}><IconDots size={19} /></button>} />}
      foot={<div className="row2">{multi && <button className="btn btn-outline" onClick={() => setSheet('pause')}><IconMoon size={18} />Finish today</button>}<button className="btn btn-primary" onClick={() => nav(`/job/${b.id}/complete/checks`)}><IconCircleCheck size={18} />{multi ? 'Complete' : 'Complete the job'}</button></div>}>
      <div className="pad" style={{ paddingTop: 6 }}>
        <ProgressCard b={b} />
        <div className="grid-2">
          <button className="btn btn-outline btn-sm" onClick={() => setSheet('update')}><IconChartBar size={16} />Send update</button>
          <button className="btn btn-outline btn-sm" onClick={() => setSheet('problem')}><IconAlertOctagon size={16} />Report a problem</button>
        </div>
        {(w.problems || []).map(p => <div key={p.id} className={`alert ${p.stop ? 'err' : 'warn'}`}><IconAlertOctagon size={17} /><span><b>{p.kind}</b> · {p.note}<br /><span className="tiny muted">Sent to the office {p.at}{p.stop ? ' · work stopped' : ''}</span></span></div>)}
        <div className="sec"><h3>Mark what you have fitted</h3><button className="link" onClick={() => { items.forEach((i, k) => setFitted(b, k, i.qty)); toast('Everything marked as fitted'); }}>All fitted</button></div>
        {items.map((i, k) => {
          const n = Math.min(i.qty, w.fitted?.[k] || 0); const full = n >= i.qty;
          return (
            <div key={k} className={`mrow ${full ? 'ok' : ''}`}>
              <div className="hstack" style={{ gap: 12, alignItems: 'flex-start' }}>
                <Thumb src={i.photo} size={44} r={12} />
                <div className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 14 }}>{i.qty} × {i.name}</b><span className="tiny muted">{i.room} · {i.size}</span></div>
                {full ? <Tag tone="ok" icon={<IconCheck size={12} />}>Fitted</Tag> : <Tag tone="grey">{i.qty - n} to go</Tag>}
              </div>
              <div className="between">
                <span className="small t2"><b style={{ color: 'var(--text)', fontSize: 16 }}>{n}</b> of {i.qty} fitted</span>
                <span className="hstack" style={{ gap: 8 }}>
                  <button className="icon-btn" aria-label={`One less ${i.name}`} disabled={n === 0} onClick={() => setFitted(b, k, n - 1)}><IconMinus size={18} /></button>
                  <button className="icon-btn" aria-label={`One more ${i.name}`} disabled={full} style={{ background: full ? undefined : 'var(--primary)', borderColor: full ? undefined : 'var(--primary)', color: full ? undefined : 'var(--deep)' }} onClick={() => { setFitted(b, k, n + 1); if (n + 1 === i.qty) toast(`${i.qty} × ${i.name} fitted`); }}><IconPlus size={18} /></button>
                </span>
              </div>
            </div>
          );
        })}
        {(w.updates || []).length > 0 && <>
          <div className="sec"><h3>Updates sent</h3></div>
          <div className="card flush"><div className="list">{[...(w.updates || [])].reverse().map((u, i) => <div key={i} className="li" style={{ alignItems: 'flex-start' }}><span className="ic"><IconChartBar size={18} /></span><span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{u.pct}% done{u.photos ? ` · ${plural(u.photos, 'photo')}` : ''}</b>{u.note && <span className="small t2">{u.note}</span>}<span className="tiny muted">{u.at}</span></span></div>)}</div></div>
        </>}
        <CrewRow b={b} onOpen={() => setSheet('crew')} />
      </div>
      <JobSheets b={b} sheet={sheet} setSheet={setSheet} />
    </Screen>
  );
}

/* ================= Complete the job: five steps ================= */
const CSTEPS = [['checks', 'Final checks'], ['snags', 'Snags'], ['photos', 'Photos'], ['handover', 'Handover'], ['review', 'Check and submit']] as const;
type NewSnag = { title: string; detail: string; severity: 'Minor' | 'Major'; part: string; photos: number };

export function Complete() {
  const b = useJob();
  if (!b) return <NotMine />;
  if (b.status === 'Completed') return <Navigate to={`/job/${b.id}/summary`} replace />;
  if (b.status !== 'On site') return <Navigate to={`/job/${b.id}`} replace />;
  return <CompleteFlow key={b.id} b={b} />;
}
function CompleteFlow({ b }: { b: Booking }) {
  const { step = 'checks' } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { set, updateJob, log } = useStore();
  const { put, say } = useActions();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notFitted, setNotFitted] = useState('');
  const [snags, setSnags] = useState<NewSnag[]>([]);
  const [noSnags, setNoSnags] = useState(false);
  const [draft, setDraft] = useState<NewSnag | null>(null);
  const [photos, setPhotos] = useState(0);
  const [shown, setShown] = useState(false);
  const [guarantee, setGuarantee] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signer, setSigner] = useState(b.customer);
  const [refused, setRefused] = useState('');
  const [confirm, setConfirm] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [step]);
  const idx = Math.max(0, CSTEPS.findIndex(s => s[0] === step));
  const go = (i: number) => nav(`/job/${b.id}/complete/${CSTEPS[i][0]}`, { replace: true });
  const allFitted = b.pct >= 100;
  const done: Record<string, boolean> = {
    checks: COMPLETE_CHECKS.every(([k]) => checks[k]) && (allFitted || notFitted.trim().length > 4),
    snags: noSnags || snags.length > 0,
    photos: photos > 0,
    handover: shown && (signed || refused.trim().length > 3),
    review: false,
  };
  const ready = done.checks && done.snags && done.photos && done.handover;
  const allSnags = [...snags, ...(!allFitted && notFitted ? [{ title: 'Not everything fitted', detail: notFitted, severity: 'Major' as const, part: '', photos: 0 }] : [])];
  const submit = () => {
    const ids = allSnags.map((_, i) => `SN-${130 + Math.floor(Math.random() * 60) + i}`);
    set('snags', ss => [...allSnags.map((s, i) => ({ id: ids[i], job: b.job!.id, customer: b.customer, title: s.title, detail: `${s.detail}${s.part ? ` Part needed: ${s.part}.` : ''}`, reported: `Installer · ${short(TODAY)}`, status: 'Open', tone: 'err', severity: s.severity, photo: b.photo, owner: 'Aftercare team', kind: 'Snag' as 'Snag' | 'Aftercare' })), ...ss]);
    put(b.id, w => ({ ...w, complete: { at: nowTime(), on: short(TODAY), checks, photos, snags: ids, signed, signedBy: signed ? signer : undefined, refused: signed ? undefined : refused, shown, notFitted: allFitted ? undefined : notFitted }, days: (w.days || []).map(d => (d.date === TODAY ? { ...d, end: nowTime() } : d)) }));
    updateJob(b.job!.id, { stage: ids.length ? 'Snag' : 'Complete', next: ids.length ? 'Book return visit' : 'Send guarantee pack', due: 'Today', signedOff: signed ? { by: signer, when: fmtDate(TODAY) } : { by: b.customer, when: fmtDate(TODAY), refused } });
    log(b.job!.id, `Installation completed by ${me.name} · ${plural(photos, 'photo')} · ${signed ? `signed by ${signer}` : `not signed: ${refused}`} · ${ids.length ? `${plural(ids.length, 'snag')} for a return visit` : 'no snags'}`, me.name);
    say(b.job!.id, `Job completed. ${b.fitted} of ${plural(b.frames, 'frame')} fitted. ${ids.length ? `${plural(ids.length, 'snag')} need a return visit.` : 'No snags.'} ${signed ? `Signed off by ${signer}.` : `Customer did not sign: ${refused}.`}`, 'me');
    nav(`/done/${b.id}`, { replace: true });
  };
  const foot = idx < 4
    ? <div className="row2">{idx > 0 && <button className="btn btn-outline" style={{ flex: '0 0 auto' }} onClick={() => go(idx - 1)} aria-label="Previous step"><IconChevronLeft size={20} /></button>}<button className="btn btn-primary" onClick={() => go(idx + 1)}>Next: {CSTEPS[idx + 1][1]}<IconArrowRight size={18} /></button></div>
    : <><button className="btn btn-primary btn-block" disabled={!ready} onClick={() => setConfirm(true)}><IconSend size={18} />Submit completion</button>{!ready && <span className="tiny muted" style={{ textAlign: 'center' }}>Finish the steps marked in amber first.</span>}</>;
  return (
    <Screen scrollRef={scroller} header={<>
      <Header back onBack={() => nav(`/job/${b.id}/work`)} title="Complete the job" sub={`Step ${idx + 1} of 5 · ${CSTEPS[idx][1]}`} />
      <div className="prog">{CSTEPS.map(([s], i) => <span key={s} className={i === idx ? 'now' : done[s] ? 'done' : ''} />)}</div>
    </>} foot={foot}>
      <div className="pad" style={{ paddingTop: 6 }}>
        {step === 'checks' && <>
          <span className="small t2">Walk round every opening before you hand over.</span>
          {!allFitted && <div className="card" style={{ borderColor: '#f0cf73' }}><span className="hstack" style={{ gap: 8 }}><IconAlertTriangle size={18} color="#8a6400" /><b style={{ fontSize: 14 }}>{b.frames - b.fitted} of {plural(b.frames, 'frame')} not marked as fitted</b></span><Field label="Why not? This becomes a snag for the office"><textarea className="textarea" value={notFitted} onChange={x => setNotFitted(x.target.value)} placeholder="e.g. Reception window glass was cracked on delivery" /></Field><button className="btn btn-outline btn-sm" onClick={() => nav(`/job/${b.id}/work`)}>Go back and mark them fitted</button></div>}
          <div className="card">
            <div className="between"><b style={{ fontSize: 15 }}>Final checks</b><button className="link" onClick={() => setChecks(Object.fromEntries(COMPLETE_CHECKS.map(([k]) => [k, true])))}>Tick all</button></div>
            <div className="vstack" style={{ gap: 2 }}>{COMPLETE_CHECKS.map(([k, l]) => <Check key={k} on={!!checks[k]} onChange={v => setChecks(c => ({ ...c, [k]: v }))} label={l} />)}</div>
          </div>
        </>}

        {step === 'snags' && <>
          <span className="small t2">Anything that needs putting right later? The office books a return visit for each snag.</span>
          {snags.map((s, i) => (
            <div key={i} className="card tight">
              <div className="between" style={{ alignItems: 'flex-start' }}><span className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 14 }}>{s.title}</b><span className="small t2">{s.detail}</span>{s.part && <span className="tiny muted">Part needed: {s.part}</span>}</span><button className="icon-btn" aria-label={`Remove ${s.title}`} onClick={() => setSnags(x => x.filter((_, j) => j !== i))}><IconTrash size={17} /></button></div>
              <span className="hstack" style={{ gap: 6 }}><Tag tone={s.severity === 'Major' ? 'err' : 'warn'}>{s.severity}</Tag>{s.photos > 0 && <Tag tone="grey">{plural(s.photos, 'photo')}</Tag>}</span>
            </div>
          ))}
          {draft ? (
            <div className="card">
              <b style={{ fontSize: 15 }}>New snag</b>
              <Field label="What is it?"><input className="input" value={draft.title} onChange={x => setDraft({ ...draft, title: x.target.value })} placeholder="e.g. Scratch on the reception window frame" aria-label="Snag title" /></Field>
              <Field label="More detail"><textarea className="textarea" value={draft.detail} onChange={x => setDraft({ ...draft, detail: x.target.value })} placeholder="Where it is and what needs doing" aria-label="Snag detail" /></Field>
              <Field label="How bad is it?"><div className="seg">{(['Minor', 'Major'] as const).map(o => <button key={o} type="button" className={draft.severity === o ? 'on' : ''} onClick={() => setDraft({ ...draft, severity: o })}>{o}</button>)}</div></Field>
              <Field label="Part needed (optional)"><input className="input" value={draft.part} onChange={x => setDraft({ ...draft, part: x.target.value })} placeholder="e.g. Replacement cill end cap" /></Field>
              <Field label={`Photos · ${draft.photos}`}><PhotoGrid n={draft.photos} seed={3} onAdd={() => setDraft({ ...draft, photos: draft.photos + 1 })} onRemove={() => setDraft({ ...draft, photos: Math.max(0, draft.photos - 1) })} /></Field>
              <div className="grid-2"><button className="btn btn-grey btn-sm" onClick={() => setDraft(null)}>Cancel</button><button className="btn btn-primary btn-sm" disabled={draft.title.trim().length < 3} onClick={() => { setSnags(x => [...x, draft]); setDraft(null); setNoSnags(false); toast('Snag added'); }}>Add snag</button></div>
            </div>
          ) : <button className="btn btn-outline btn-block" onClick={() => setDraft({ title: '', detail: '', severity: 'Minor', part: '', photos: 0 })}><IconPlus size={18} />Add a snag</button>}
          {snags.length === 0 && !draft && <button className={`card tight`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, textAlign: 'left', border: noSnags ? '1.5px solid #a8dcc0' : 0 }} onClick={() => setNoSnags(!noSnags)}><span className={`tile`} style={{ width: 40, height: 40, borderRadius: 12, background: noSnags ? '#e3f6ec' : 'var(--bg)', color: noSnags ? 'var(--ok)' : 'var(--muted)' }}><IconCircleCheck size={22} /></span><span className="vstack grow" style={{ gap: 1 }}><b style={{ fontSize: 14 }}>No snags — everything is right</b><span className="tiny muted">Tap if there is nothing to put right</span></span></button>}
          {!allFitted && notFitted && <div className="alert warn"><IconAlertTriangle size={17} />"Not everything fitted" is added as a snag too.</div>}
        </>}

        {step === 'photos' && <>
          <span className="small t2">The finished work, inside and out. At least one photo; one per room is best.</span>
          <div className="card"><div className="between"><b style={{ fontSize: 14 }}>Finished work</b><span className="tiny muted">{plural(photos, 'photo')}</span></div><PhotoGrid n={photos} seed={4} onAdd={() => { setPhotos(p => p + 1); toast('Photo added'); }} onRemove={() => setPhotos(p => Math.max(0, p - 1))} /></div>
        </>}

        {step === 'handover' && <>
          <span className="small t2">Show the customer everything and ask them to sign to say they are happy.</span>
          <div className="card">
            <Check on={shown} onChange={setShown} label="I showed the customer how every window and door opens, locks and is cleaned" />
            <Check on={guarantee} onChange={setGuarantee} label="I told them the guarantee pack is coming by email (optional)" />
          </div>
          <div className="card">
            <span className="hstack" style={{ gap: 8 }}><IconSignature size={20} color="#0b6e5c" /><b style={{ fontSize: 15 }}>Customer signature</b></span>
            <Field label="Customer name"><input className="input" value={signer} onChange={x => setSigner(x.target.value)} /></Field>
            <SignaturePad value={signed} onChange={setSigned} name={signer} />
            {!signed && <Field label="Customer won't sign? Say why"><input className="input" value={refused} onChange={x => setRefused(x.target.value)} placeholder="e.g. Wants the snag fixed first" /></Field>}
          </div>
        </>}

        {step === 'review' && <>
          <span className="small t2">Tap a line to go back to it.</span>
          <div className="card flush"><div className="list">
            {([[IconListCheck, 'Final checks', done.checks ? (allFitted ? 'All checks done' : 'Checks done · not everything fitted') : 'Not finished', done.checks, 0], [IconTool, 'Snags', allSnags.length ? plural(allSnags.length, 'snag') + ' for a return visit' : noSnags ? 'No snags' : 'Not answered', done.snags, 1], [IconPhoto, 'Photos', photos ? plural(photos, 'photo') : 'No photos yet', done.photos, 2], [IconSignature, 'Handover', signed ? `Signed by ${signer}` : refused ? `Not signed: ${refused}` : !shown ? 'Not shown round yet' : 'Not signed yet', done.handover, 3]] as [any, string, string, boolean, number][]).map(([I, l, v, ok, i]) => (
              <button key={l} className="li" onClick={() => go(i)}>
                <span className="ic" style={ok ? { background: '#e3f6ec', color: 'var(--ok)' } : { background: '#fdf3d9', color: '#8a6400' }}>{ok ? <IconCircleCheck size={20} /> : <I size={19} />}</span>
                <span className="vstack grow" style={{ gap: 1 }}><b style={{ fontSize: 14 }}>{l}</b><span className="small t2">{v}</span></span>
                <IconChevronRight size={18} className="chev" />
              </button>
            ))}
          </div></div>
          <div className="kv"><div><span>Fitted</span><b>{b.fitted} of {b.frames}</b></div><div><span>Days on site</span><b>{(b.work.days || []).length || 1}</b></div></div>
          {ready && (allSnags.length ? <div className="alert info"><IconInfoCircle size={17} />The office books a return visit for {allSnags.length === 1 ? 'the snag' : `the ${allSnags.length} snags`}.</div> : <div className="alert ok"><IconCircleCheck size={17} />No snags. The office sends the guarantee pack and the final bill.</div>)}
        </>}
      </div>
      {confirm && (
        <Sheet title="Submit the completion?" sub={`${b.customer} · ${b.job?.id}`} onClose={() => setConfirm(false)}
          footer={<><button className="btn btn-grey" onClick={() => setConfirm(false)}>Keep working</button><button className="btn btn-primary" onClick={submit}><IconSend size={18} />Submit</button></>}>
          <span className="t2">It goes to the office straight away and the job is marked as fitted.</span>
          {allSnags.length ? <div className="alert warn"><IconAlertTriangle size={17} />{plural(allSnags.length, 'snag')} · the office books a return visit.</div> : <div className="alert ok"><IconCircleCheck size={17} />No snags · ready for the guarantee pack.</div>}
        </Sheet>
      )}
    </Screen>
  );
}

/* ================= Done ================= */
export function Done() {
  const { id } = useParams();
  const nav = useNavigate();
  const list = useMyBookings();
  const b = list.find(x => x.id === id && x.status === 'Completed');
  const nextB = list.find(x => isOpen(x) && x.id !== id && (covers(x, TODAY) || x.date > TODAY));
  if (!b) return <Navigate to="/" replace />;
  const inst = b.kind === 'Installation';
  const sn = inst ? b.work.complete?.snags.length || 0 : Object.values(b.work.fixes || {}).filter(f => !f.fixed).length;
  return (
    <Screen bg="#fff">
      <div className="success" style={{ minHeight: 640 }}>
        <span className={`ring ${sn ? 'warn' : ''}`}>{sn ? <IconAlertTriangle size={48} /> : <IconCircleCheck size={52} />}</span>
        <h2>{inst ? 'Job completed' : 'Visit completed'}</h2>
        <span className="t2" style={{ fontSize: 15 }}>
          {inst ? (sn ? `${plural(sn, 'snag')} sent to the office. They will book a return visit.` : 'No snags. The office sends the guarantee pack and the final bill.')
            : sn ? `${plural(sn, 'snag')} still open. The office will book what is needed.` : 'Every snag fixed. The office closes them and tells the customer.'}
        </span>
        <div className="card flat tight" style={{ width: '100%', textAlign: 'left' }}>
          <div className="hstack" style={{ gap: 12 }}><Thumb src={b.photo} size={44} r={12} /><span className="vstack grow" style={{ gap: 1 }}><b>{b.customer}</b><span className="tiny muted">{b.kind} · submitted {nowTime()}</span></span><Tag tone={sn ? 'warn' : 'ok'}>{sn ? `${sn} open` : 'All done'}</Tag></div>
        </div>
        <div className="vstack" style={{ width: '100%', gap: 8, marginTop: 8 }}>
          {nextB && <button className="btn btn-primary btn-block" onClick={() => nav(nextB.to)}><IconArrowRight size={18} />Next · {nextB.customer} {covers(nextB, TODAY) ? 'today' : fmtDate(nextB.date)}</button>}
          <button className={`btn ${nextB ? 'btn-outline' : 'btn-primary'} btn-block`} onClick={() => nav(inst ? `/job/${b.id}/summary` : b.to)}>{inst ? 'View job summary' : 'View the visit'}</button>
          <button className="btn btn-ghost btn-block" onClick={() => nav('/')}><IconHome size={18} />Back to Today</button>
        </div>
      </div>
    </Screen>
  );
}

/* ================= Summary ================= */
export function Summary() {
  const b = useJob();
  const toast = useToast();
  const { snags } = useStore();
  if (!b) return <NotMine />;
  const c = b.work.complete;
  if (!c) return <Navigate to={`/job/${b.id}`} replace />;
  const all = snags.filter(s => c.snags.includes(s.id));
  const sn = all.filter(s => s.status !== 'Fixed');
  const photos = (b.work.before || 0) + c.photos + (b.work.updates || []).reduce((a, u) => a + u.photos, 0);
  return (
    <Screen header={<Header back title="Job summary" sub={`${b.customer} · ${b.job?.id}`} white />} foot={<button className="btn btn-primary btn-block" onClick={() => toast(`Completion report ${b.job?.id}.pdf downloaded`)}><IconDownload size={18} />Download report (PDF)</button>}>
      <div className="pad">
        <div className="card" style={{ background: sn.length ? '#fffaf0' : '#f2fbf6', borderColor: sn.length ? '#f2e0a8' : '#bfe8d3' }}>
          <div className="hstack" style={{ gap: 12 }}>
            <span className="tile" style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', color: sn.length ? '#9a6f00' : 'var(--ok)' }}>{sn.length ? <IconAlertTriangle size={24} /> : <IconCircleCheck size={26} />}</span>
            <span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 16 }}>{sn.length ? `Completed · ${plural(sn.length, 'snag')} open` : all.length ? 'Completed · snags fixed' : 'Completed · no snags'}</b><span className="small t2">{sn.length ? 'The office books a return visit.' : 'Ready for the guarantee pack.'}</span></span>
          </div>
        </div>
        <div className="kv">
          <div><span>Fitted</span><b>{b.fitted} of {plural(b.frames, 'frame')}</b></div>
          <div><span>Completed</span><b>{c.on} · {c.at}</b></div>
          <div><span>Days on site</span><b>{(b.work.days || []).length || 1}</b></div>
          <div><span>Customer signature</span><b>{c.signed ? c.signedBy : 'Not signed'}</b></div>
          <div><span>Photos</span><b>{photos}</b></div>
          <div><span>Crew</span><b>{b.crew.map(x => x.name.split(' ')[0]).join(', ')}</b></div>
        </div>
        {!c.signed && c.refused && <div className="alert warn"><IconSignature size={17} /><span><b>Not signed:</b> {c.refused}</span></div>}
        {c.notFitted && <div className="alert warn"><IconAlertTriangle size={17} /><span><b>Not everything fitted:</b> {c.notFitted}</span></div>}
        {all.length > 0 && <>
          <div className="sec"><h3>Snags</h3></div>
          <div className="card flush"><div className="list">{all.map(s => <div key={s.id} className="li" style={{ alignItems: 'flex-start' }}><span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{s.title}</b><span className="tiny muted">{s.id} · {s.detail}</span></span><Tag tone={s.tone}>{s.status}</Tag></div>)}</div></div>
        </>}
        <div className="sec"><h3>Final checks</h3></div>
        <div className="card flush"><div className="list">{COMPLETE_CHECKS.map(([k, l]) => <div key={k} className="li"><span className="grow small">{l}</span><Tag tone={c.checks[k] ? 'ok' : 'warn'}>{c.checks[k] ? 'Yes' : 'No'}</Tag></div>)}</div></div>
        <div className="sec"><h3>Days on site</h3></div>
        <div className="card flush"><div className="list">{(b.work.days || []).map(d => <div key={d.date} className="li" style={{ alignItems: 'flex-start' }}><span className="ic"><IconClock size={18} /></span><span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{fmtDate(d.date)}</b><span className="tiny muted">{d.start} – {d.end || '…'}{d.note ? ` · ${d.note}` : ''}</span></span></div>)}</div></div>
        <PhotoGrid n={photos} disabled max={6} />
        <Link to={`/history/${b.job?.id}`} className="btn btn-grey btn-sm"><IconHistory size={16} />Job history</Link>
      </div>
    </Screen>
  );
}

/* ================= History ================= */
export function History() {
  const { id } = useParams();
  const { jobs } = useStore();
  const j = jobs.find(x => x.id === id);
  if (!j) return <Navigate to="/jobs" replace />;
  return (
    <Screen header={<Header back title="Job history" sub={`${j.customer} · ${j.id}`} />}>
      <div className="pad">
        <div className="card">
          {j.history.map((h, i, a) => (
            <div key={i} className="hstack" style={{ gap: 12, alignItems: 'flex-start' }}>
              <span className="vstack" style={{ alignItems: 'center', gap: 0, alignSelf: 'stretch' }}><span className="tile" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg)', color: h.who === me.name ? '#0b6e5c' : '#6b7a78' }}>{h.who === me.name ? <IconTool size={16} /> : <IconBook size={16} />}</span>{i < a.length - 1 && <span style={{ flex: 1, width: 2, background: 'var(--border)', margin: '4px 0' }} />}</span>
              <span className="vstack grow" style={{ gap: 3, paddingBottom: 12 }}><b style={{ fontSize: 13 }}>{h.what}</b><span className="tiny muted">{h.who} · {h.when}</span></span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
