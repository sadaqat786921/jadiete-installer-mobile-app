// My calendar: installations (one or more days), return visits, workshop days and time off. Synced with Outlook.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight, IconBeach, IconRefresh, IconBrandWindows, IconWindow, IconTool, IconTrash, IconCalendarEvent, IconMapPin, IconBuildingWarehouse } from '@tabler/icons-react';
import { Screen, Tag, Seg, Empty, Sheet, useToast } from '../ui/kit';
import { TimeOffSheet } from '../ui/sheets';
import { useStore, TODAY, addDays, fmtDate, mondayOf } from '../data/store';
import { useMyBookings, statusTone, dayLabel, startOf, covers, Booking, plural } from '../lib/jobs';

export default function Calendar() {
  const nav = useNavigate();
  const toast = useToast();
  const { set } = useStore();
  const list = useMyBookings();
  const [day, setDay] = useState(TODAY);
  const [mode, setMode] = useState<'day' | 'list'>('day');
  const [off, setOff] = useState(false);
  const [del, setDel] = useState<Booking | null>(null);
  const [synced, setSynced] = useState('2 minutes ago');
  const mon = mondayOf(day);
  const week = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  // A job finished early drops off the days after it was completed.
  const doneIso = (b: Booking) => (b.work.complete ? (b.work.days || []).slice(-1)[0]?.date : undefined);
  const on = (d: string) => list.filter(b => covers(b, d) && !(doneIso(b) && d > doneIso(b)!));
  const open = (b: Booking) => { if (b.kind === 'Time off' && b.ev.status === 'Requested') { setDel(b); return; } nav(b.kind === 'Installation' && b.status === 'Completed' ? `/job/${b.id}/summary` : b.to); };
  const Item = ({ b, d }: { b: Booking; d: string }) => {
    const col = b.kind === 'Time off' ? '#9aa8a5' : b.kind === 'Return visit' ? '#e0a100' : b.kind === 'Workshop' ? '#6b7a78' : '#0b6e5c';
    const n = Math.round((new Date(d).getTime() - new Date(b.date).getTime()) / 864e5) + 1;
    const plain = b.kind === 'Time off' || b.kind === 'Workshop';
    return (
      <button className="card tight" style={{ flex: 1, minWidth: 0, textAlign: 'left', borderLeft: `4px solid ${col}`, background: plain ? '#f1f4f3' : '#fff', boxShadow: plain ? 'none' : undefined }} onClick={() => open(b)}>
        <div className="between"><b className="ell" style={{ fontSize: 14 }}>{b.kind === 'Time off' ? 'Time off' : b.customer}</b>{b.kind === 'Time off' ? (b.ev.status === 'Requested' ? <Tag tone="warn">Asked</Tag> : <Tag tone="grey">Agreed</Tag>) : b.kind === 'Workshop' ? <Tag tone="grey">Workshop</Tag> : <Tag tone={statusTone[b.status]}>{b.status}</Tag>}</div>
        <span className="tiny muted hstack" style={{ gap: 5 }}>{b.kind === 'Installation' ? <IconWindow size={13} /> : b.kind === 'Return visit' ? <IconTool size={13} /> : b.kind === 'Workshop' ? <IconBuildingWarehouse size={13} /> : <IconBeach size={13} />}{b.kind === 'Installation' ? `Installation${b.days > 1 ? ` · day ${n} of ${b.days}` : ''} · ${plural(b.frames, 'frame')}` : b.kind === 'Return visit' ? `Return visit · ${plural(b.snags.length, 'snag')}` : b.ev.sub}</span>
        {(b.kind === 'Installation' || b.kind === 'Return visit') && <span className="tiny t2 hstack ell" style={{ gap: 5 }}><IconMapPin size={13} />{b.town} · {b.crew.length > 1 ? `with ${b.crew.filter(c => c.id !== 'ak').map(c => c.name.split(' ')[0]).join(', ')}` : 'on your own'}</span>}
      </button>
    );
  };
  const upcoming = Array.from({ length: 21 }, (_, i) => addDays(TODAY, i)).filter(d => on(d).length);
  return (
    <Screen tabs header={<>
      <div className="hdr-lg"><h1>Calendar</h1><button className="btn btn-grey btn-sm" onClick={() => { setDay(TODAY); setMode('day'); }}>Today</button></div>
      <div style={{ padding: '0 16px 10px', display: 'grid', gap: 12 }}>
        <Seg value={mode} onChange={setMode} items={[{ id: 'day', label: 'Week' }, { id: 'list', label: 'List' }]} />
        {mode === 'day' && <>
          <div className="between">
            <button className="icon-btn" aria-label="Previous week" onClick={() => setDay(addDays(day, -7))}><IconChevronLeft size={20} /></button>
            <b style={{ fontSize: 15 }}>{fmtDate(mon, { day: 'numeric', month: 'short' })} – {fmtDate(addDays(mon, 6), { day: 'numeric', month: 'short', year: 'numeric' })}</b>
            <button className="icon-btn" aria-label="Next week" onClick={() => setDay(addDays(day, 7))}><IconChevronRight size={20} /></button>
          </div>
          <div className="week">
            {week.map(d => (
              <button key={d} className={`${d === day ? 'on' : ''} ${d === TODAY ? 'today' : ''}`} onClick={() => setDay(d)} aria-label={fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}>
                {fmtDate(d, { weekday: 'short' }).slice(0, 3)}<b>{Number(d.slice(8))}</b>
                <span className="dots">{on(d).slice(0, 3).map(b => <i key={b.id} className={b.kind === 'Time off' || b.kind === 'Workshop' ? 'o' : b.kind === 'Return visit' ? 'w' : ''} />)}</span>
              </button>
            ))}
          </div>
        </>}
      </div>
    </>}>
      <div className="pad" style={{ paddingTop: 4, paddingBottom: 90 }}>
        {mode === 'day' ? <>
          <div className="between"><b style={{ fontSize: 16 }}>{dayLabel(day)}</b><span className="tiny muted">{plural(on(day).filter(b => b.kind === 'Installation' || b.kind === 'Return visit').length, 'job')}</span></div>
          {on(day).length === 0 && <Empty icon={<IconCalendarEvent size={24} />} title={new Date(day + 'T12:00:00').getDay() === 0 ? 'Sunday · not a working day' : 'Nothing booked'} sub="The office books your jobs." />}
          {on(day).map(b => <div key={b.id} className="agenda"><span className="tm">{b.kind === 'Time off' ? 'All day' : startOf(b.time)}<small>{b.kind === 'Installation' ? 'arrive' : b.time.split('– ')[1] || ''}</small></span><Item b={b} d={day} /></div>)}
        </> : <>
          {upcoming.length === 0 && <Empty icon={<IconCalendarEvent size={24} />} title="Nothing booked" sub="The office books your jobs." />}
          {upcoming.map(d => (
            <div key={d} className="vstack" style={{ gap: 8 }}>
              <span className="tiny b muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{dayLabel(d)}</span>
              {on(d).map(b => <div key={b.id} className="agenda"><span className="tm" style={{ paddingTop: 12 }}>{b.kind === 'Time off' ? 'Off' : startOf(b.time)}</span><Item b={b} d={d} /></div>)}
            </div>
          ))}
        </>}
        <div className="card tight flat">
          <div className="hstack" style={{ gap: 10 }}><span className="tile" style={{ width: 40, height: 40, borderRadius: 12, background: '#e8f1fb', color: '#0b6e5c' }}><IconBrandWindows size={19} /></span><span className="vstack grow" style={{ gap: 0 }}><b className="small">Synced with Outlook</b><span className="tiny muted">{synced} · your jobs are on your phone calendar</span></span><button className="icon-btn" aria-label="Sync now" onClick={() => { setSynced('just now'); toast('Synced with Outlook'); }}><IconRefresh size={18} /></button></div>
        </div>
      </div>
      <button className="fab" onClick={() => setOff(true)}><IconBeach size={19} />Time off</button>
      {off && <TimeOffSheet day={day} onClose={() => setOff(false)} />}
      {del && (
        <Sheet title="Cancel this time-off request?" sub={`${fmtDate(del.date)} · ${plural(del.days, 'day')}`} onClose={() => setDel(null)}
          footer={<><button className="btn btn-grey" onClick={() => setDel(null)}>Keep it</button><button className="btn btn-danger" onClick={() => { set('events', es => es.filter(x => x.id !== del.id)); toast('Request cancelled'); setDel(null); }}><IconTrash size={18} />Cancel request</button></>}>
          <span className="t2">The office has not answered yet. Cancelling removes it.</span>
        </Sheet>
      )}
    </Screen>
  );
}
