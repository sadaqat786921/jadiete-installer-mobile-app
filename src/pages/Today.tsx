// Today: the job you are on, who you are with, what to fit, and what is coming next.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconBell, IconSearch, IconClock, IconMapPin, IconTool, IconPhone, IconCar, IconDots, IconAlertTriangle, IconChevronRight,
  IconCalendarEvent, IconBeach, IconMessage, IconCircleCheck, IconUsers, IconFileText, IconBox, IconBuildingWarehouse, IconWindow,
} from '@tabler/icons-react';
import { Screen, Tag, Avatar, Thumb, useToast } from '../ui/kit';
import { OnMyWaySheet, TimeOffSheet } from '../ui/sheets';
import { me, IMG } from '../data/mock';
import { useStore, TODAY, fmtDate, addDays, mondayOf } from '../data/store';
import { useMyBookings, useAlerts, isOpen, statusTone, Booking, startOf, plural, maps, img, range, covers, isCustomer } from '../lib/jobs';
import { openSnags } from '../lib/jobs';
import { primary, PIcon, JobSheets } from './Job';

export default function Today() {
  const nav = useNavigate();
  const toast = useToast();
  const list = useMyBookings();
  const alerts = useAlerts();
  const { msgs, snags } = useStore();
  const [sheet, setSheet] = useState<{ k: string; b?: Booking } | null>(null);
  const todays = list.filter(b => covers(b, TODAY) && b.kind !== 'Time off');
  const current = todays.find(b => b.status === 'On site') || todays.find(isOpen);
  const nextUp = list.find(b => isOpen(b) && b.date > TODAY);
  const hero = current || nextUp;
  const weekEnd = addDays(mondayOf(TODAY), 6);
  const week = list.filter(b => b.end >= TODAY && b.date <= addDays(TODAY, 8) && b !== current && b.kind !== 'Time off' && b.status !== 'Completed');
  const jobsWeek = list.filter(b => isCustomer(b) && b.end >= TODAY && b.date <= weekEnd).length;
  const framesLeft = current && current.kind === 'Installation' ? current.frames - current.fitted : 0;
  const snagsToFix = list.filter(b => b.kind === 'Return visit' && isOpen(b)).reduce((a, b) => a + b.snags.length, 0);
  const done = list.filter(b => b.status === 'Completed' && isCustomer(b)).sort((a, b) => b.end.localeCompare(a.end)).slice(0, 3);
  const notFinished = list.filter(b => b.status === 'On site' && b !== current);
  const packs = list.filter(b => b.kind === 'Installation' && isOpen(b) && !b.work.reviewed && b !== hero);
  const fromOffice = Object.entries(msgs).flatMap(([job, ms]) => ms.filter(m => m.from === 'office').slice(-1).map(m => ({ job, m, b: list.find(x => x.job?.id === job) }))).filter(x => x.b).sort((a, b) => b.m.when.localeCompare(a.m.when)).slice(0, 3);
  const hello = 'Good morning';
  const open = (k: string, b?: Booking) => setSheet({ k, b });
  const p = hero ? primary(hero) : null;

  return (
    <Screen dark tabs>
      <div className="hero" style={{ paddingBottom: 70 }}>
        <div className="photo" style={{ backgroundImage: `url(${IMG.window})` }} />
        <span className="glow" />
        <div className="between" style={{ paddingTop: 6 }}>
          <Link to="/profile" className="hstack" style={{ gap: 10 }}><Avatar i={me.initials} size={42} bg="#00c7a1" fg="#0b1f1b" /><span className="vstack" style={{ gap: 0 }}><span style={{ fontSize: 12, color: '#cfe0db' }}>{fmtDate(TODAY, { weekday: 'long', day: 'numeric', month: 'long' })}</span><b style={{ fontSize: 14 }}>{me.name}</b></span></Link>
          <span className="hstack">
            <button className="icon-btn glass" aria-label="Search" onClick={() => nav('/search')}><IconSearch size={20} /></button>
            <button className="icon-btn glass" aria-label="Notifications" onClick={() => nav('/notifications')}><IconBell size={20} />{alerts.length > 0 && <span className="badge">{alerts.length}</span>}</button>
          </span>
        </div>
        <h1 style={{ fontSize: 20, letterSpacing: -0.4, marginTop: 22, lineHeight: 1.25 }}>{hello}, {me.first}</h1>
        <span style={{ color: '#cfe0db', fontSize: 14, display: 'block', marginTop: 6 }}>{current ? `${current.customer} today${current.days > 1 ? ` · day ${current.dayNo} of ${current.days}` : ''}. Arrive ${startOf(current.time)}.` : todays.some(isCustomer) ? `Today's jobs are done.${nextUp ? ` Next is ${nextUp.customer}, ${fmtDate(nextUp.date)}.` : ''}` : todays.length ? `${todays[0].title} today.` : nextUp ? `No jobs today. Next is ${nextUp.customer}, ${fmtDate(nextUp.date)}.` : 'Nothing booked.'}</span>
        <div className="hstack" style={{ gap: 8, marginTop: 18 }}>
          <button className="stat" onClick={() => nav('/jobs')}><b>{jobsWeek}</b><span>Jobs this week</span></button>
          <button className="stat" onClick={() => (current ? nav(`/job/${current.id}/work`) : nav('/jobs'))}><b>{framesLeft}</b><span>Frames to fit today</span></button>
          <button className="stat" onClick={() => nav('/jobs?show=visits')}><b>{snagsToFix}</b><span>Snags to fix</span></button>
        </div>
      </div>

      <div className="pad" style={{ marginTop: -54, position: 'relative' }}>
        {hero && p ? (
          <div className="next">
            <div className="pic" style={{ backgroundImage: `url(${img(hero.photo)})` }}>
              <div className="between" style={{ padding: 12 }}><Tag tone="glass">{hero.status === 'On site' ? 'You are on this job' : current ? 'Today' : `Next · ${fmtDate(hero.date)}`}</Tag><Tag tone={hero.kind === 'Installation' ? 'jade' : 'warn'}>{hero.kind}</Tag></div>
              <div style={{ position: 'absolute', left: 16, bottom: 12, right: 16, color: '#fff' }} className="between"><b style={{ fontSize: 20, letterSpacing: -0.3 }}>{hero.customer}</b><span className="hstack" style={{ gap: 5, fontSize: 13, fontWeight: 600 }}><IconClock size={15} />{hero.days > 1 ? `Day ${hero.dayNo || 1} of ${hero.days}` : startOf(hero.time)}</span></div>
            </div>
            <div className="body">
              <div className="facts">
                <span><IconMapPin size={16} />{hero.address}</span>
                {hero.kind === 'Installation' ? <span><IconWindow size={16} />{hero.job?.products} · {hero.work.started ? `${hero.fitted} of ${hero.frames} fitted` : plural(hero.frames, 'frame')}</span> : <span><IconTool size={16} />{plural(hero.snags.length, 'snag')} to put right</span>}
                <span><IconUsers size={16} />{hero.crew.length > 1 ? `With ${hero.crew.filter(c => c.id !== me.id).map(c => c.name).join(' and ')}` : 'Just you'}</span>
                {hero.pack && <span><IconBox size={16} />{hero.pack.materials}</span>}
              </div>
              {hero.status === 'On site' && <div style={{ height: 8, borderRadius: 4, background: '#e6ecea', overflow: 'hidden' }}><div style={{ width: `${hero.pct}%`, height: '100%', background: 'var(--primary)' }} /></div>}
              {hero.kind === 'Installation' && !hero.work.reviewed && <div className="alert warn" style={{ padding: '10px 12px' }}><IconFileText size={16} /><span><b>Read the job pack</b> before you start: sizes, access and notes.</span></div>}
              {hero.pack?.flags[0] && hero.status !== 'Completed' && <div className="alert err" style={{ padding: '10px 12px' }}><IconAlertTriangle size={16} /><span>{hero.pack.flags[0]}</span></div>}
              <div className="qa">
                <a href={maps(hero.address)} target="_blank" rel="noreferrer"><span className="ic"><IconMapPin size={18} /></span>Directions</a>
                <a href={`tel:${(hero.job?.phone || '').replace(/\s/g, '')}`} onClick={() => toast(`Calling ${hero.customer}`)}><span className="ic"><IconPhone size={18} /></span>Call</a>
                {hero.status === 'Booked' && covers(hero, TODAY) ? <button onClick={() => open('way', hero)}><span className="ic"><IconCar size={18} /></span>On my way</button> : <button onClick={() => nav(`/messages/${hero.job?.id}`)}><span className="ic"><IconMessage size={18} /></span>Messages</button>}
                <button onClick={() => open('menu', hero)}><span className="ic"><IconDots size={18} /></span>More</button>
              </div>
              <div className="hstack" style={{ gap: 8 }}>
                <Link to={hero.to} className="btn btn-outline" style={{ flex: '0 0 auto' }}>Details</Link>
                <button className="btn btn-primary grow" onClick={() => nav(p.to)}><PIcon k={p.icon} />{p.label}</button>
              </div>
              {hero.status === 'On my way' && <span className="tiny muted" style={{ textAlign: 'center' }}>Customer told you are on your way · {hero.work.onWay}</span>}
            </div>
          </div>
        ) : (
          <div className="card" style={{ alignItems: 'center', textAlign: 'center' }}><span className="tile" style={{ width: 56, height: 56, borderRadius: '50%', background: '#e3f6ec', color: 'var(--ok)' }}><IconCircleCheck size={30} /></span><b style={{ fontSize: 16 }}>Nothing booked</b><span className="small muted">The office books your jobs.</span></div>
        )}

        {todays.filter(b => b !== current && b.kind === 'Workshop').map(b => <Link key={b.id} to={b.to} className="alert info"><IconBuildingWarehouse size={17} /><span className="grow"><b>Today:</b> {b.title}</span><IconChevronRight size={16} /></Link>)}
        {(notFinished.length > 0 || packs.length > 0) && (
          <div className="vstack" style={{ gap: 8 }}>
            {notFinished.map(b => <Link key={b.id} to={primary(b).to} className="alert err"><IconAlertTriangle size={17} /><span className="grow"><b>Not finished:</b> {b.customer}. Tap to carry on.</span><IconChevronRight size={16} /></Link>)}
            {packs.map(b => <Link key={b.id} to={`/job/${b.id}/pack`} className="alert warn"><IconFileText size={17} /><span className="grow"><b>Job pack to read:</b> {b.customer} · {range(b)}</span><IconChevronRight size={16} /></Link>)}
          </div>
        )}

        <div className="sec"><h3>Coming up</h3><Link to="/calendar">Calendar<IconChevronRight size={15} /></Link></div>
        <div className="card">
          {week.length === 0 && <span className="small muted">Nothing else booked yet.</span>}
          <div className="route">
            {week.map((b, i) => (
              <div key={b.id} className="stop">
                <div className="rail"><span className={`pin ${b.status === 'Completed' ? 'done' : ''}`}>{b.kind === 'Installation' ? <IconWindow size={14} /> : b.kind === 'Return visit' ? <IconTool size={14} /> : <IconBuildingWarehouse size={14} />}</span>{i < week.length - 1 && <span className="line" />}</div>
                <Link to={b.to} className="hstack grow" style={{ gap: 10, alignItems: 'flex-start', paddingBottom: 12 }}>
                  <Thumb src={b.photo} size={46} r={12} />
                  <span className="vstack grow" style={{ gap: 3 }}>
                    <b style={{ fontSize: 14 }}>{b.customer}</b>
                    <span className="tiny muted ell">{range(b)} · {b.kind === 'Installation' ? plural(b.frames, 'frame') : b.kind === 'Return visit' ? plural(b.snags.length, 'snag') : 'Workshop'}</span>
                    <span className="hstack" style={{ gap: 6 }}><Tag tone={b.kind === 'Workshop' ? 'grey' : statusTone[b.status]}>{b.kind === 'Workshop' ? 'Workshop' : b.status}</Tag>{b.kind === 'Installation' && !b.work.reviewed && <Tag tone="warn">Read pack</Tag>}</span>
                  </span>
                  <IconChevronRight size={18} color="#a5b2af" style={{ marginTop: 12 }} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="sec"><h3>From the office</h3><Link to="/messages">Messages<IconChevronRight size={15} /></Link></div>
        <div className="card flush"><div className="list">
          {fromOffice.length === 0 && <span className="small muted" style={{ padding: 16 }}>Nothing new.</span>}
          {fromOffice.map(({ job, m, b }) => (
            <Link key={m.id} to={`/messages/${job}`} className="li" style={{ alignItems: 'flex-start' }}>
              <Avatar i="SM" size={40} />
              <span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{m.text}</b><span className="tiny muted">{b?.customer} · {m.when}</span></span>
            </Link>
          ))}
        </div></div>

        <div className="sec"><h3>Recently completed</h3><Link to="/jobs?show=done">All<IconChevronRight size={15} /></Link></div>
        <div className="card flush"><div className="list">
          {done.map(b => {
            const sn = openSnags(b, snags);
            return (
              <Link key={b.id} to={b.kind === 'Installation' ? `/job/${b.id}/summary` : b.to} className="li">
                <Thumb src={b.photo} size={40} r={12} />
                <span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{b.customer}</b><span className="tiny muted">{b.kind} · {range(b)}</span></span>
                {sn ? <Tag tone="warn">{plural(sn, 'snag')}</Tag> : <Tag tone="ok">{b.kind === 'Installation' ? 'Signed off' : 'All fixed'}</Tag>}
              </Link>
            );
          })}
          {done.length === 0 && <span className="small muted" style={{ padding: 16 }}>Nothing completed yet.</span>}
        </div></div>

        <div className="grid-2" style={{ marginBottom: 8 }}>
          <button className="card tight" style={{ alignItems: 'flex-start', textAlign: 'left', border: 0 }} onClick={() => open('off')}><span className="tile" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--tint)', color: 'var(--primary-dark)' }}><IconBeach size={20} /></span><b style={{ fontSize: 14 }}>Ask for time off</b><span className="tiny muted">The office agrees it</span></button>
          <button className="card tight" style={{ alignItems: 'flex-start', textAlign: 'left', border: 0 }} onClick={() => nav('/calendar')}><span className="tile" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--tint)', color: 'var(--primary-dark)' }}><IconCalendarEvent size={20} /></span><b style={{ fontSize: 14 }}>My calendar</b><span className="tiny muted">Jobs, visits, workshop</span></button>
        </div>
      </div>

      {sheet?.k === 'way' && sheet.b && <OnMyWaySheet b={sheet.b} onClose={() => setSheet(null)} />}
      {sheet?.k === 'off' && <TimeOffSheet onClose={() => setSheet(null)} />}
      {sheet?.k === 'menu' && sheet.b && <JobSheets b={sheet.b} sheet="menu" setSheet={k => setSheet(k ? { k: 'sub-' + k, b: sheet.b } : null)} />}
      {sheet?.k.startsWith('sub-') && sheet.b && <JobSheets b={sheet.b} sheet={sheet.k.slice(4)} setSheet={k => setSheet(k ? { k: 'sub-' + k, b: sheet.b } : null)} />}
    </Screen>
  );
}
