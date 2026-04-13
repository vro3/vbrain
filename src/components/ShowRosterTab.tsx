/**
 * ShowRosterTab — Full performer roster matching old vCommand ShowSync layout.
 * Top: performer rows with all 3 stage badges + send buttons inline.
 * Bottom: email activity timeline per performer.
 * Created: 2026-04-01
 */

import { useState } from 'react';
import { Users, Plus, Mail, Send, MessageSquare, Trash2, Loader2, AlertCircle } from 'lucide-react';
import AddPerformerModal from './AddPerformerModal';
import { updateShowFields } from '../lib/firestoreService';
import type { ShowIntelligence, RosterPerformer, EmailStageType } from '../types/show';

interface Props {
  show: ShowIntelligence;
}

function safeShortDate(val: any): string {
  if (!val) return '';
  if (val.toDate) return val.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const d = new Date(val);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Compact badge for a single email stage
function StageBadge({ p, stage, label }: { p: RosterPerformer; stage: EmailStageType; label: string }) {
  const sentAt = p[`${stage}SentAt` as keyof RosterPerformer] as string | undefined;
  const openedAt = p[`${stage}OpenedAt` as keyof RosterPerformer] as string | undefined;
  const response = p[`${stage}Response` as keyof RosterPerformer] as string | undefined;

  if (!sentAt) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-600">{label}</span>;

  const isPositive = response === 'Available' || response === 'Accepted' || response === 'Confirmed';
  const isNegative = response === 'Unavailable' || response === 'Declined' || response === 'Not Confirmed';

  if (isPositive) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{label}: {response}</span>;
  if (isNegative) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">{label}: {response}</span>;
  if (openedAt) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{label}: Opened</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{label}: Sent</span>;
}

// Timeline row for the email activity section
function ActivityTimeline({ p, stage, label }: { p: RosterPerformer; stage: EmailStageType; label: string }) {
  const sentAt = p[`${stage}SentAt` as keyof RosterPerformer] as string | undefined;
  const openedAt = p[`${stage}OpenedAt` as keyof RosterPerformer] as string | undefined;
  const response = p[`${stage}Response` as keyof RosterPerformer] as string | undefined;
  const respondedAt = p[`${stage}RespondedAt` as keyof RosterPerformer] as string | undefined;

  if (!sentAt) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <span className="w-2 h-2 rounded-full bg-slate-700" />
        {label}: Not sent
      </div>
    );
  }

  const isPositive = response === 'Available' || response === 'Accepted' || response === 'Confirmed';
  const isNegative = response === 'Unavailable' || response === 'Declined' || response === 'Not Confirmed';

  return (
    <div className="flex items-center gap-1 text-xs flex-wrap">
      <span className={`w-2 h-2 rounded-full ${isNegative ? 'bg-red-500' : isPositive ? 'bg-emerald-500' : 'bg-blue-500'}`} />
      <span className="text-slate-400">{label}:</span>
      <span className="text-blue-400">Sent ({safeShortDate(sentAt)})</span>
      <span className="text-slate-600">&rarr;</span>
      {openedAt ? (
        <span className="text-cyan-400">Opened ({safeShortDate(openedAt)})</span>
      ) : (
        <span className="text-slate-600">Not opened</span>
      )}
      <span className="text-slate-600">&rarr;</span>
      {response ? (
        <span className={isPositive ? 'text-emerald-400 font-bold' : isNegative ? 'text-red-400 font-bold' : 'text-slate-400'}>
          {response} ({safeShortDate(respondedAt)})
        </span>
      ) : (
        <span className="text-amber-400">Awaiting response</span>
      )}
    </div>
  );
}

// Send button — calls /api/send-email directly (no brain_requests queue)
function SendButton({ performer, stage, show }: { performer: RosterPerformer; stage: EmailStageType; show: ShowIntelligence }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadySent = performer[`${stage}SentAt` as keyof RosterPerformer];
  const buttonLabel = alreadySent ? `Re-${stage}` : stage.charAt(0).toUpperCase() + stage.slice(1);

  const handleSend = async () => {
    if (!performer.email || sending) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId: show.linkedShowId || show.id,
          performerId: performer.performerId || performer.name,
          emailType: stage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed (${res.status})`);
        setSending(false);
        return;
      }

      setSent(true);
      setSending(false);
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Network error');
      setSending(false);
    }
  };

  if (sent) return <span className="text-[10px] text-emerald-400 px-2">Sent!</span>;
  if (error) return (
    <button onClick={handleSend} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20" title={error}>
      <AlertCircle size={10} /> Retry
    </button>
  );
  if (!performer.email) return <span className="text-[10px] text-slate-700 px-1">No email</span>;

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
        sending
          ? 'bg-white/5 text-slate-500'
          : alreadySent
          ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/6'
          : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
      }`}
    >
      {sending ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
      {sending ? '...' : buttonLabel}
    </button>
  );
}

function EmailBlitzButton({ performers, show }: { performers: RosterPerformer[]; show: ShowIntelligence }) {
  const [blitzType, setBlitzType] = useState<EmailStageType | null>(null);
  const [sent, setSent] = useState(0);
  const [failed, setFailed] = useState(0);
  const [total, setTotal] = useState(0);

  const startBlitz = async (stage: EmailStageType) => {
    const eligible = performers.filter(p => p.email);
    if (eligible.length === 0) return;
    setBlitzType(stage);
    setTotal(eligible.length);
    setSent(0);
    setFailed(0);

    for (const p of eligible) {
      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            showId: show.linkedShowId || show.id,
            performerId: p.performerId || p.name,
            emailType: stage,
          }),
        });
        if (res.ok) {
          setSent(prev => prev + 1);
        } else {
          setFailed(prev => prev + 1);
        }
      } catch {
        setFailed(prev => prev + 1);
      }
    }
    setTimeout(() => setBlitzType(null), 4000);
  };

  if (blitzType) {
    const done = sent + failed;
    return (
      <span className="text-xs text-amber-400">
        <Loader2 size={12} className="inline animate-spin mr-1" />
        {blitzType}: {done}/{total} {done === total ? (failed > 0 ? `(${failed} failed)` : 'done!') : 'sending...'}
      </span>
    );
  }

  return (
    <div className="flex gap-1">
      <button onClick={() => startBlitz('inquiry')} className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
        <Mail size={10} className="inline mr-1" />Blitz Inquiry
      </button>
      <button onClick={() => startBlitz('offer')} className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
        Blitz Offer
      </button>
      <button onClick={() => startBlitz('confirmation')} className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
        Blitz Confirm
      </button>
    </div>
  );
}

export default function ShowRosterTab({ show }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const roster = show.roster;

  const handleRemove = async (p: RosterPerformer) => {
    if (!roster) return;
    setRemovingId(p.performerId || p.name);
    const updated = roster.performers.filter(perf => perf.name !== p.name);
    const wasConfirmed = p.status === 'confirmed';
    const wasDeclined = p.status === 'declined';
    await updateShowFields(show.id, {
      roster: {
        ...roster,
        totalPerformers: Math.max(0, roster.totalPerformers - 1),
        confirmed: wasConfirmed ? Math.max(0, roster.confirmed - 1) : roster.confirmed,
        declined: wasDeclined ? Math.max(0, roster.declined - 1) : roster.declined,
        pending: (!wasConfirmed && !wasDeclined) ? Math.max(0, roster.pending - 1) : roster.pending,
        performers: updated,
      },
    });
    setRemovingId(null);
  };

  if (!roster || !roster.performers || roster.performers.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-end mb-6">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-amber-500 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-amber-400">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="text-center py-12">
          <Users size={32} className="mx-auto mb-4 text-slate-600" />
          <p className="text-sm text-slate-500">No performers on this roster yet.</p>
        </div>
        <AddPerformerModal show={show} isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="col-header flex items-center gap-2"><Users size={14} /> Performers ({roster.totalPerformers})</h3>
        <div className="flex gap-2">
          <EmailBlitzButton performers={roster.performers} show={show} />
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Performer rows */}
      <div className="space-y-2">
        {roster.performers.map((p, i) => (
          <div key={`${p.name}-${i}`} className="bg-white/[0.03] border border-white/6 rounded-xl p-3 hover:border-white/10 transition-colors">
            {/* Top line: name, pay, stage badges */}
            <div className="flex items-center gap-3 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                p.status === 'confirmed' ? 'bg-emerald-500' :
                p.status === 'declined' || p.status === 'unavailable' ? 'bg-red-500' :
                p.status === 'offered' ? 'bg-cyan-500' : 'bg-amber-500'
              }`} />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-sm">{p.name}</span>
                {p.email && <span className="text-[11px] text-slate-500 ml-2">{p.email}</span>}
              </div>
              <span className="text-sm font-mono text-slate-300 shrink-0">{p.pay ? `$${p.pay}` : ''}</span>
            </div>

            {/* Stage badges + send buttons row */}
            <div className="flex items-center gap-2 flex-wrap ml-5">
              <StageBadge p={p} stage="inquiry" label="Inq" />
              <SendButton performer={p} stage="inquiry" show={show} />
              <span className="text-slate-700">|</span>
              <StageBadge p={p} stage="offer" label="Offer" />
              <SendButton performer={p} stage="offer" show={show} />
              <span className="text-slate-700">|</span>
              <StageBadge p={p} stage="confirmation" label="Conf" />
              <SendButton performer={p} stage="confirmation" show={show} />
              <span className="text-slate-700">|</span>
              <button className="text-slate-600 hover:text-slate-300 transition-colors"><MessageSquare size={12} /></button>
              <button
                onClick={() => handleRemove(p)}
                disabled={removingId === (p.performerId || p.name)}
                className="text-slate-700 hover:text-red-400 transition-colors"
              >
                {removingId === (p.performerId || p.name) ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Email Activity — detailed timeline per performer */}
      <div>
        <h3 className="col-header flex items-center gap-2 mb-4"><Mail size={14} /> Email Activity</h3>
        <div className="space-y-3">
          {roster.performers.map((p, i) => (
            <div key={`activity-${p.name}-${i}`} className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-sm">{p.name}</div>
                  {p.email && <div className="text-[11px] text-slate-500">{p.email}</div>}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">Pay</div>
                  <div className="text-sm font-mono text-cyan-400 font-bold">{p.pay ? `$${p.pay}` : '—'}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <ActivityTimeline p={p} stage="inquiry" label="Inquiry" />
                <ActivityTimeline p={p} stage="offer" label="Offer" />
                <ActivityTimeline p={p} stage="confirmation" label="Confirmation" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddPerformerModal show={show} isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
