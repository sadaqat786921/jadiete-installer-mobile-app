// Messages: one conversation per job with the office (and what the customer says through the office).
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconSearch, IconSend, IconInbox, IconPhoneCall, IconDots, IconExternalLink, IconPhone, IconSettings, IconCamera } from '@tabler/icons-react';
import { Screen, Header, Avatar, Tag, Seg, Empty, Sheet, useToast } from '../ui/kit';
import { CallSheet } from '../ui/sheets';
import { useConversations, needsReply, useActions, range } from '../lib/jobs';

export default function Messages() {
  const convos = useConversations();
  const [f, setF] = useState<'reply' | 'all'>(convos.some(r => needsReply(r.ms)) ? 'reply' : 'all');
  const [q, setQ] = useState('');
  const list = convos.filter(r => (f === 'all' || needsReply(r.ms)) && (r.job.customer + r.job.id + r.job.address).toLowerCase().includes(q.toLowerCase()));
  return (
    <Screen tabs header={<>
      <div className="hdr-lg"><h1>Messages</h1></div>
      <div style={{ padding: '0 16px 10px', display: 'grid', gap: 10 }}>
        <div className="input-icon"><IconSearch size={18} /><input className="input" placeholder="Search customer or job" value={q} onChange={e => setQ(e.target.value)} /></div>
        <Seg value={f} onChange={setF} items={[{ id: 'reply', label: `New · ${convos.filter(r => needsReply(r.ms)).length}` }, { id: 'all', label: `All · ${convos.length}` }]} />
      </div>
    </>}>
      <div className="pad" style={{ paddingTop: 4 }}>
        <div className="card flush"><div className="list">
          {list.map(({ job, ms, b }) => {
            const last = ms[ms.length - 1];
            return (
              <Link key={job.id} to={`/messages/${job.id}`} className="li" style={{ alignItems: 'flex-start' }}>
                <Avatar i={job.initials} size={44} />
                <span className="vstack grow" style={{ gap: 3 }}>
                  <span className="between"><b style={{ fontSize: 15 }}>{job.customer}</b><span className="tiny muted">{last ? last.when.split(',')[0] : ''}</span></span>
                  <span className="small t2 ell">{last ? `${last.from === 'me' ? 'You: ' : `${last.from === 'customer' ? last.who : last.who.split(' ')[0]}: `}${last.text}` : 'No messages yet'}</span>
                  <span className="hstack" style={{ gap: 6 }}><span className="tiny muted">{b.kind} · {range(b)}</span>{needsReply(ms) && <Tag tone="jade">New</Tag>}</span>
                </span>
              </Link>
            );
          })}
        </div></div>
        {list.length === 0 && <Empty icon={<IconInbox size={24} />} title={f === 'reply' ? 'Nothing new' : 'No messages'} sub="You are up to date." />}
      </div>
    </Screen>
  );
}

export function Thread() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { say } = useActions();
  const convos = useConversations();
  const row = convos.find(r => r.job.id === id);
  const [txt, setTxt] = useState('');
  const [sheet, setSheet] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [row?.ms.length]);
  if (!row) return <Screen header={<Header back="/messages" title="Messages" />}><Empty icon={<IconInbox size={24} />} title="Conversation not found" /></Screen>;
  const { job, ms, b } = row;
  const send = (t = txt) => { if (!t.trim()) return; say(job.id, t, 'me'); toast('Sent to the office'); setTxt(''); };
  return (
    <Screen scrollRef={box} header={<Header back="/messages" white title={<span className="hstack" style={{ gap: 10 }}><Avatar i={job.initials} size={36} /><span className="vstack" style={{ gap: 0, minWidth: 0 }}><b className="ell" style={{ fontSize: 15 }}>{job.customer}</b><span className="tiny muted">{job.id} · {b.kind} · {b.status}</span></span></span>} right={<button className="icon-btn" aria-label="More" onClick={() => setSheet('menu')}><IconDots size={19} /></button>} />}
      foot={<>
        <div className="chips">{['On my way', 'Running 20 minutes late', 'All done for today', 'Need a hand tomorrow'].map(s => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}</div>
        <div className="composer">
          <button className="icon-btn" aria-label="Add a photo" onClick={() => { say(job.id, 'Photo sent', 'me'); toast('Photo sent to the office'); }}><IconCamera size={19} /></button>
          <textarea value={txt} onChange={x => setTxt(x.target.value)} placeholder="Message the office…" aria-label="Message" />
          <button className="send" disabled={!txt.trim()} onClick={() => send()} aria-label="Send"><IconSend size={20} /></button>
        </div>
        <span className="tiny muted" style={{ textAlign: 'center' }}>Goes to Sarah in the office. She passes on anything for the customer.</span>
      </>}>
      <div className="pad" style={{ gap: 10 }}>
        {ms.length === 0 && <Empty icon={<IconInbox size={24} />} title="No messages yet" sub="Send the office a quick note." />}
        {ms.map(m => {
          if (m.from === 'system') return <span key={m.id} className="sys"><IconSettings size={12} />{m.text} · {m.when}</span>;
          const cls = m.from === 'me' ? 'out' : m.from === 'customer' ? 'note' : 'in';
          return (
            <div key={m.id} className={`bubble ${cls}`}>
              <div className="who" style={{ color: cls === 'out' ? 'var(--primary-dark)' : cls === 'note' ? '#8a6400' : 'var(--muted)' }}>{m.from === 'me' ? 'You' : m.who}{m.from === 'customer' ? ' · customer' : m.from === 'office' ? ' · office' : ''}</div>
              <div>{m.text}</div>
              <div className="tiny muted" style={{ marginTop: 4, textAlign: 'right' }}>{m.when}</div>
            </div>
          );
        })}
      </div>
      {sheet === 'menu' && (
        <Sheet title={job.customer} sub={`${job.id} · ${job.phone}`} onClose={() => setSheet(null)}>
          <div className="vstack" style={{ gap: 0 }}>
            <button className="menu-item" onClick={() => nav(b.kind === 'Installation' && b.status === 'Completed' ? `/job/${b.id}/summary` : b.to)}><span className="ic"><IconExternalLink size={20} /></span><span className="grow">Open the job<small>{b.kind} · {range(b)}</small></span></button>
            <a className="menu-item" href={`tel:${job.phone.replace(/\s/g, '')}`} onClick={() => { toast(`Calling ${job.customer}`); setSheet(null); }}><span className="ic"><IconPhone size={20} /></span><span className="grow">Call the customer<small>{job.phone}</small></span></a>
            <a className="menu-item" href="tel:01134960000" onClick={() => { toast('Calling the office'); setSheet(null); }}><span className="ic"><IconPhone size={20} /></span><span className="grow">Call the office<small>0113 496 0000</small></span></a>
            <button className="menu-item" onClick={() => setSheet('call')}><span className="ic"><IconPhoneCall size={20} /></span><span className="grow">Log a phone call<small>Saved on the job</small></span></button>
          </div>
        </Sheet>
      )}
      {sheet === 'call' && <CallSheet b={b} onClose={() => setSheet(null)} />}
    </Screen>
  );
}
