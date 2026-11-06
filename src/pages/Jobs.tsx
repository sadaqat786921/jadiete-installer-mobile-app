// My jobs (installations and return visits), search, notifications, and a workshop / time-off day.
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IconSearch, IconClock, IconMapPin, IconChevronRight, IconClipboardList, IconBell, IconAlertTriangle, IconCalendarEvent, IconWindow, IconTool, IconChecks, IconFileText, IconMessage, IconBuildingWarehouse, IconBeach, IconX } from '@tabler/icons-react';
import { Screen, Header, Tag, Thumb, Empty, Seg, useToast } from '../ui/kit';
import { TODAY, fmtDate, useStore } from '../data/store';
import { useMyBookings, useAlerts, isOpen, statusTone, Booking, plural, dayLabel, range, covers, isCustomer, useBooking } from '../lib/jobs';
import { openSnags } from '../lib/jobs';

const FILTERS: [string, string, (b: Booking) => boolean][] = [
  ['todo', 'To do', isOpen],
  ['today', 'Today', b => covers(b, TODAY) && isCustomer(b)],
  ['progress', 'On site', b => b.status === 'On site' || b.status === 'Paused'],
  ['pack', 'Pack to read', b => b.kind === 'Installation' && isOpen(b) && !b.work.reviewed],
  ['visits', 'Return visits', b => b.kind === 'Return visit' && isOpen(b)],
  ['done', 'Done', b => b.status === 'Completed' && isCustomer(b)],
  ['all', 'All', isCustomer],
];

export function JobRow({ b }: { b: Booking }) {
  const { snags } = useStore();
  const to = b.kind === 'Installation' && b.status === 'Completed' ? `/job/${b.id}/summary` : b.to;
  const sn = openSnags(b, snags);
  return (
    <Link to={to} className={`vcard ${b.kind === 'Return visit' ? 'k-ins' : 'k-sv'}`}>
      <div className="top">
        <Thumb src={b.photo} size={52} />
        <div className="vstack grow" style={{ gap: 3 }}>
          <div className="between"><b className="ell" style={{ fontSize: 15 }}>{b.customer}</b><Tag tone={statusTone[b.status]}>{b.status === 'Paused' ? 'Back next day' : b.status}</Tag></div>
          <span className="small t2 hstack" style={{ gap: 5 }}><IconMapPin size={14} />{b.town}</span>
          <span className="tiny muted">{b.kind}{b.kind === 'Installation' ? ` · ${b.job?.products || plural(b.frames, 'frame')}` : ` · ${plural(b.snags.length, 'snag')}`}</span>
        </div>
      </div>
      <div className="meta">
        <span className="hstack" style={{ gap: 5 }}><IconClock size={14} />{range(b)}</span>
        {b.status === 'Completed' ? (sn ? <Tag tone="warn">{plural(sn, 'snag')}</Tag> : <Tag tone="ok">{b.kind === 'Installation' ? 'Signed off' : 'All fixed'}</Tag>)
          : b.status === 'On site' && b.kind === 'Installation' ? <Tag tone="jade">{b.pct}% fitted</Tag>
          : b.kind === 'Installation' && !b.work.reviewed ? <Tag tone="warn">Read the job pack</Tag>
          : b.moveAsked ? <Tag tone="warn">Move asked</Tag>
          : <span className="hstack b" style={{ color: 'var(--primary-dark)', gap: 2 }}>Open<IconChevronRight size={15} /></span>}
      </div>
    </Link>
  );
}

export default function Jobs() {
  const list = useMyBookings();
  const [sp, setSp] = useSearchParams();
  const f = sp.get('show') || 'todo';
  const [kind, setKind] = useState<'all' | 'inst' | 'visit'>('all');
  const [q, setQ] = useState('');
  const pass = FILTERS.find(x => x[0] === f)?.[2] || isCustomer;
  const base = list.filter(b => isCustomer(b) && (kind === 'all' || (kind === 'inst' ? b.kind === 'Installation' : b.kind === 'Return visit')) && (b.customer + b.address + (b.job?.id || '') + (b.job?.products || '')).toLowerCase().includes(q.toLowerCase()));
  const shown = base.filter(pass);
  const sorted = f === 'done' || f === 'all' ? [...shown].reverse() : shown;
  const groups = useMemo(() => { const g: [string, Booking[]][] = []; sorted.forEach(b => { const d = covers(b, TODAY) ? TODAY : b.date; const last = g[g.length - 1]; if (last && last[0] === d) last[1].push(b); else g.push([d, [b]]); }); return g; }, [sorted]);
  return (
    <Screen tabs header={<>
      <div className="hdr-lg"><h1>My jobs</h1></div>
      <div style={{ padding: '0 16px 10px', display: 'grid', gap: 10 }}>
        <div className="input-icon"><IconSearch size={18} /><input className="input" placeholder="Search customer, town or job" value={q} onChange={e => setQ(e.target.value)} /></div>
        <Seg value={kind} onChange={setKind} items={[{ id: 'all', label: 'All' }, { id: 'inst', label: <><IconWindow size={15} />Installs</> }, { id: 'visit', label: <><IconTool size={15} />Visits</> }]} />
        <div className="chips" style={{ margin: '0 -16px', padding: '0 16px' }}>{FILTERS.map(([id, l, p]) => <button key={id} className={`chip ${f === id ? 'on' : ''}`} onClick={() => setSp({ show: id })}>{l}<span className="n">{base.filter(p).length}</span></button>)}</div>
      </div>
    </>}>
      <div className="pad" style={{ paddingTop: 4 }}>
        {groups.map(([d, bs]) => (
          <React.Fragment key={d}>
            <span className="tiny b muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{dayLabel(d)}</span>
            {bs.map(b => <JobRow key={b.id} b={b} />)}
          </React.Fragment>
        ))}
        {shown.length === 0 && <Empty icon={<IconClipboardList size={26} />} title="Nothing here" sub="Try another filter." />}
      </div>
    </Screen>
  );
}

export function Search() {
  const nav = useNavigate();
  const list = useMyBookings().filter(isCustomer);
  const [q, setQ] = useState('');
  const res = q.trim() ? list.filter(b => (b.customer + b.address + (b.job?.id || '') + b.kind + (b.job?.products || '')).toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <Screen header={<div className="hdr"><div className="input-icon grow"><IconSearch size={18} /><input className="input" autoFocus placeholder="Search my jobs" value={q} onChange={e => setQ(e.target.value)} aria-label="Search my jobs" /></div><button className="link" onClick={() => nav(-1)}>Cancel</button></div>}>
      <div className="pad">
        {!q.trim() && <>
          <span className="tiny b muted">TRY</span>
          <div className="chips wrap">{['Hartley', 'Bakers', 'Patel', 'Ripon', 'Return visit'].map(s => <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>)}</div>
        </>}
        {res.map(b => <JobRow key={b.id} b={b} />)}
        {q.trim() && res.length === 0 && <Empty icon={<IconSearch size={24} />} title="No jobs found" sub="Search by customer, town or job number." />}
      </div>
    </Screen>
  );
}

export function Notifications() {
  const nav = useNavigate();
  const alerts = useAlerts();
  const [read, setRead] = useState<string[]>([]);
  const toast = useToast();
  const icon = { job: IconWindow, fix: IconTool, alert: IconAlertTriangle, cal: IconCalendarEvent, msg: IconMessage, pack: IconFileText };
  const col: Record<string, [string, string]> = { err: ['#fdeeee', '#d64545'], warn: ['#fdf3d9', '#8a6400'], ok: ['#e3f6ec', '#1f9d5b'], jade: ['#ebf7f3', '#0b6e5c'] };
  return (
    <Screen header={<Header back title="Notifications" right={<button className="icon-btn" aria-label="Mark all as read" onClick={() => { setRead(alerts.map(a => a.id)); toast('All marked as read'); }}><IconChecks size={19} /></button>} />}>
      <div className="pad">
        {alerts.length === 0 && <Empty icon={<IconBell size={24} />} title="Nothing new" />}
        <div className="card flush"><div className="list">
          {alerts.map(a => { const I = icon[a.icon]; const [bg, fg] = col[a.tone] || col.jade; const unread = !read.includes(a.id); return (
            <button key={a.id} className="li" style={{ alignItems: 'flex-start' }} onClick={() => { setRead(r => [...r, a.id]); nav(a.to); }}>
              <span className="tile" style={{ width: 40, height: 40, borderRadius: 12, background: bg, color: fg }}><I size={19} /></span>
              <span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 13, fontWeight: unread ? 600 : 500 }}>{a.title}</b><span className="tiny muted">{a.sub}</span></span>
              {unread && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--primary)', marginTop: 6 }} />}
            </button>
          ); })}
        </div></div>
      </div>
    </Screen>
  );
}

/** A workshop day or time off. */
export function Day() {
  const { id } = useParams();
  const b = useBooking(id);
  if (!b) return <Screen header={<Header back="/calendar" title="Day" />}><Empty icon={<IconX size={24} />} title="Not found" /></Screen>;
  const off = b.kind === 'Time off';
  return (
    <Screen header={<Header back title={off ? 'Time off' : 'Workshop day'} sub={range(b)} />}>
      <div className="pad">
        <div className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
          <span className="tile" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--tint)', color: 'var(--primary-dark)' }}>{off ? <IconBeach size={30} /> : <IconBuildingWarehouse size={30} />}</span>
          <b style={{ fontSize: 18 }}>{b.title}</b>
          <span className="small t2">{b.ev.sub}</span>
          {b.ev.status === 'Requested' ? <Tag tone="warn">Waiting for the office</Tag> : <Tag tone="jade">{off ? 'Agreed' : 'Booked'}</Tag>}
        </div>
        <div className="kv">
          <div><span>From</span><b>{fmtDate(b.date)}</b></div>
          <div><span>Days</span><b>{b.days}</b></div>
          {!off && <div style={{ gridColumn: 'span 2' }}><span>Where</span><b>Head office workshop · Unit 4, Leeds Road</b></div>}
          {!off && <div style={{ gridColumn: 'span 2' }}><span>With</span><b>{b.crew.map(c => c.name).join(', ')}</b></div>}
        </div>
        {!off && <div className="alert info"><IconBuildingWarehouse size={17} />Workshop days are for preparing frames, trims and glazing. No customer visit.</div>}
      </div>
    </Screen>
  );
}
