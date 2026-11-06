// A return visit (snags from an installation) or an aftercare visit: put each problem right, photo it,
// the customer signs, submit. Fixed snags close; anything not fixed goes back to the office with the reason.
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconChevronLeft, IconDots, IconMapPin, IconCar, IconPlayerPlay, IconSend, IconClock, IconCalendarOff, IconTool, IconCircleCheck, IconAlertTriangle, IconPhone, IconHistory, IconMessage, IconArrowRight, IconDoorOff, IconInfoCircle, IconPackage } from '@tabler/icons-react';
import { Screen, Header, Tag, Avatar, Steps, Field, PhotoGrid, SignaturePad, Empty, useToast, Sheet } from '../ui/kit';
import { me } from '../data/mock';
import { useStore, TODAY, fmtDate } from '../data/store';
import { FIX_REASONS, Fix } from '../data/installs';
import { useBooking, useActions, statusTone, img, maps, plural, short, nowTime, covers, Booking } from '../lib/jobs';
import { JobSheets } from './Job';

export default function Visit() {
  const { id } = useParams();
  const b = useBooking(id);
  if (!b || b.kind !== 'Return visit') return <Screen header={<Header back="/jobs" title="Visit" />}><Empty icon={<IconTool size={24} />} title="This visit is not booked for you" sub="It may have been moved to another fitter." action={<Link to="/jobs" className="btn btn-primary btn-sm">Back to my jobs</Link>} /></Screen>;
  return <View key={b.id} b={b} />;
}

function View({ b }: { b: Booking }) {
  const nav = useNavigate();
  const toast = useToast();
  const { set, updateJob, log } = useStore();
  const { start, put, say } = useActions();
  const [sheet, setSheet] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const w = b.work; const j = b.job;
  const [fixes, setFixes] = useState<Record<string, Fix & { reason?: string }>>(w.fixes || {});
  const [signed, setSigned] = useState(false);
  const [note, setNote] = useState('');
  const done = b.status === 'Completed';
  const onSite = b.status === 'On site';
  const canStart = b.date <= TODAY;
  const step = ['Booked', 'On my way', 'On site', 'Completed'].indexOf(b.status);
  const upd = (id: string, p: Partial<Fix & { reason?: string }>) => setFixes(f => ({ ...f, [id]: { fixed: true, photos: 0, ...f[id], ...p } }));
  const answered = b.snags.every(s => fixes[s.id] && (fixes[s.id].fixed ? fixes[s.id].photos > 0 : !!fixes[s.id].reason));
  const fixedN = b.snags.filter(s => fixes[s.id]?.fixed).length;
  const submit = () => {
    put(b.id, x => ({ ...x, fixes, visitDone: { at: nowTime(), on: short(TODAY), signed, signedBy: signed ? b.customer : undefined, note } }));
    set('snags', ss => ss.map(s => {
      const f = fixes[s.id]; if (!f || !b.snags.some(x => x.id === s.id)) return s;
      return f.fixed ? { ...s, status: 'Fixed', tone: 'ok', detail: `${s.detail} — Fixed by ${me.name} ${short(TODAY)}${f.note ? `: ${f.note}` : ''}.` } : { ...s, status: 'Open', tone: 'err', owner: 'Aftercare team', detail: `${s.detail} — Not fixed on ${short(TODAY)}: ${f.reason}${f.note ? ` (${f.note})` : ''}${f.part ? `. Part: ${f.part}` : ''}.` };
    }));
    const open = b.snags.length - fixedN;
    if (j) {
      updateJob(j.id, open ? { next: 'Book another return visit', due: 'Today' } : { stage: 'Complete', next: 'Send guarantee pack', due: 'Mon 19 Oct', blocked: undefined });
      log(j.id, `Return visit done by ${me.name} · ${fixedN} of ${plural(b.snags.length, 'snag')} fixed${signed ? ' · customer signed' : ''}`, me.name);
    }
    say(j?.id, `Return visit done. ${fixedN} of ${plural(b.snags.length, 'snag')} fixed.${open ? ` ${open} still open — see my notes.` : ''}${note ? ' ' + note : ''}`, 'me');
    nav(`/done/${b.id}`, { replace: true });
  };
  const foot = done ? undefined
    : onSite ? <><button className="btn btn-primary btn-block" disabled={!answered} onClick={() => setConfirm(true)}><IconSend size={18} />Submit the visit</button>{!answered && <span className="tiny muted" style={{ textAlign: 'center' }}>For each snag: fixed with a photo, or not fixed with a reason.</span>}</>
    : !canStart ? <><button className="btn btn-primary btn-block" disabled><IconClock size={18} />Starts {fmtDate(b.date, { weekday: 'long', day: 'numeric', month: 'short' })}</button><button className="btn btn-ghost btn-sm" onClick={() => setSheet('cant')}><IconCalendarOff size={16} />Can't make it</button></>
    : <div className="row2">{b.status === 'Booked' && <button className="btn btn-outline" onClick={() => setSheet('way')}><IconCar size={18} />On my way</button>}<button className="btn btn-primary" onClick={() => { start(b, {}, 0); toast('Visit started'); }}><IconPlayerPlay size={18} />Start visit</button></div>;
  return (
    <Screen dark foot={foot}>
      <div className="vhero" style={{ backgroundImage: `url(${img(b.photo)})`, height: 210 }}>
        <div className="between" style={{ padding: '6px 16px' }}>
          <button className="icon-btn glass" aria-label="Back" onClick={() => nav(-1)}><IconChevronLeft size={22} /></button>
          <button className="icon-btn glass" aria-label="More" onClick={() => setSheet('menu')}><IconDots size={20} /></button>
        </div>
        <div style={{ marginTop: 'auto', padding: '0 20px 30px' }} className="vstack">
          <span className="hstack" style={{ gap: 6 }}><Tag tone="warn">{b.snags.some(s => s.kind === 'Aftercare') ? 'Aftercare visit' : 'Return visit'}</Tag><Tag tone={statusTone[b.status]}>{b.status}</Tag></span>
          <b style={{ fontSize: 20, letterSpacing: -0.4 }}>{b.customer}</b>
          <span className="hstack small" style={{ gap: 5, color: '#e3eeeb' }}><IconMapPin size={15} />{b.address}</span>
        </div>
      </div>
      <div className="sheet-up pad">
        <div className="card"><Steps at={step} done={done} times={[undefined, w.onWay, w.started]} /></div>
        {w.noAccess && <div className="alert err"><IconDoorOff size={17} /><span><b>Customer not in.</b> {w.noAccess}</span></div>}
        {w.moveAsked && !done && <div className="alert warn"><IconCalendarOff size={17} /><span><b>You asked the office to move this visit.</b> {w.moveAsked}</span></div>}
        <div className="kv">
          <div><span>When</span><b>{fmtDate(b.date)} · {b.time}</b></div>
          <div><span>Job</span><b>{j?.id}</b></div>
          <div><span>To put right</span><b>{plural(b.snags.length, 'snag')}</b></div>
          <div><span>Fitted</span><b>{j?.dates.find(d => d.label === 'Installation')?.date || '—'}</b></div>
        </div>
        {(() => { const t = b.snags.map(s => s.detail.split(' — ')[0].split('. ').find((x: string) => /workshop|van stock/i.test(x))).find(Boolean); return t && !done ? <div className="alert info"><IconPackage size={17} /><span><b>Bring the part.</b> {t.replace(/\.$/, '')}.</span></div> : null; })()}
        {!done && !onSite && <div className="alert info"><IconArrowRight size={17} /><span>{canStart ? <><b>Next: {w.onWay ? 'start the visit when you arrive' : 'tell the customer you are on your way'}.</b></> : <>Booked for {fmtDate(b.date, { weekday: 'long', day: 'numeric', month: 'long' })}.</>}</span></div>}
        {done && w.visitDone && <div className={`alert ${fixedN === b.snags.length ? 'ok' : 'warn'}`}><IconCircleCheck size={17} /><span><b>Submitted {w.visitDone.on}.</b> {fixedN} of {plural(b.snags.length, 'snag')} fixed.{w.visitDone.signed ? ` Signed by ${w.visitDone.signedBy}.` : ''}</span></div>}

        <div className="sec"><h3>What to put right</h3><span className="tiny muted">{onSite ? `${Object.keys(fixes).length} of ${b.snags.length} answered` : plural(b.snags.length, 'snag')}</span></div>
        {b.snags.map(s => {
          const f = fixes[s.id];
          return (
            <div key={s.id} className={`mrow ${f ? (f.fixed ? 'ok' : 'changed') : ''}`}>
              <div className="between" style={{ alignItems: 'flex-start' }}><span className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 14 }}>{s.title}</b><span className="tiny muted">{s.id} · reported by {s.reported}</span></span><Tag tone={done ? s.tone : s.severity === 'Major' ? 'err' : 'warn'}>{done ? s.status : s.severity}</Tag></div>
              <span className="small t2">{s.detail.split(' — ')[0]}</span>
              {onSite && <>
                <div className="yn" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <button type="button" aria-label={`${s.title}: fixed`} className={f?.fixed ? 'yes' : ''} onClick={() => upd(s.id, { fixed: true })}>Fixed</button>
                  <button type="button" aria-label={`${s.title}: not fixed`} className={f && !f.fixed ? 'no' : ''} onClick={() => upd(s.id, { fixed: false })}>Not fixed</button>
                </div>
                {f && !f.fixed && <Field label="Why not?"><div className="chips wrap">{FIX_REASONS.map(r => <button key={r} type="button" className={`chip ${f.reason === r ? 'on' : ''}`} onClick={() => upd(s.id, { reason: r })}>{r}</button>)}</div></Field>}
                {f && !f.fixed && f.reason === 'Needs a part' && <input className="input" placeholder="Which part?" value={f.part || ''} onChange={x => upd(s.id, { part: x.target.value })} aria-label={`Part for ${s.title}`} />}
                {f && <input className="input" placeholder={f.fixed ? 'What did you do? (optional)' : 'Notes for the office (optional)'} value={f.note || ''} onChange={x => upd(s.id, { note: x.target.value })} aria-label={`Note for ${s.title}`} />}
                {f && <PhotoGrid n={f.photos} seed={2} onAdd={() => { upd(s.id, { photos: f.photos + 1 }); toast('Photo added'); }} onRemove={() => upd(s.id, { photos: Math.max(0, f.photos - 1) })} />}
              </>}
              {done && w.fixes?.[s.id] && <span className="small" style={{ color: w.fixes[s.id].fixed ? 'var(--ok)' : '#8a6400' }}>{w.fixes[s.id].fixed ? `Fixed${w.fixes[s.id].note ? ` · ${w.fixes[s.id].note}` : ''}` : `Not fixed · ${(w.fixes[s.id] as any).reason}`}</span>}
            </div>
          );
        })}
        {onSite && <>
          <Field label="Anything else for the office? (optional)"><textarea className="textarea" value={note} onChange={x => setNote(x.target.value)} placeholder="e.g. Also adjusted the bi-fold track" /></Field>
          <div className="card"><b style={{ fontSize: 14 }}>Customer signature (optional)</b><SignaturePad value={signed} onChange={setSigned} name={b.customer} /></div>
        </>}
        {j && <>
          <div className="sec"><h3>Customer</h3></div>
          <div className="card">
            <div className="hstack" style={{ gap: 12 }}><Avatar i={j.initials} size={44} /><div className="vstack grow" style={{ gap: 1 }}><b>{b.customer}</b><span className="small muted">{j.phone}</span></div></div>
            <div className="grid-2">
              <a className="btn btn-outline btn-sm" href={`tel:${j.phone.replace(/\s/g, '')}`} onClick={() => toast(`Calling ${b.customer}`)}><IconPhone size={16} />Call</a>
              <a className="btn btn-outline btn-sm" href={maps(b.address)} target="_blank" rel="noreferrer"><IconMapPin size={16} />Directions</a>
            </div>
          </div>
          <div className="grid-2"><Link className="btn btn-grey btn-sm" to={`/messages/${j.id}`}><IconMessage size={16} />Messages</Link><Link className="btn btn-grey btn-sm" to={`/history/${j.id}`}><IconHistory size={16} />History</Link></div>
        </>}
      </div>
      <JobSheets b={b} sheet={sheet} setSheet={setSheet} />
      {confirm && (
        <Sheet title="Submit this visit?" sub={`${b.customer} · ${fixedN} of ${plural(b.snags.length, 'snag')} fixed`} onClose={() => setConfirm(false)}
          footer={<><button className="btn btn-grey" onClick={() => setConfirm(false)}>Keep working</button><button className="btn btn-primary" onClick={submit}><IconSend size={18} />Submit</button></>}>
          {fixedN === b.snags.length ? <div className="alert ok"><IconCircleCheck size={17} />Every snag fixed. The office closes them and tells the customer.</div> : <div className="alert warn"><IconAlertTriangle size={17} />{b.snags.length - fixedN} not fixed · the office arranges what is needed.</div>}
          <div className="alert info"><IconInfoCircle size={17} />It goes to the office straight away.</div>
        </Sheet>
      )}
    </Screen>
  );
}
export { covers };
