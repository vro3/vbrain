/**
 * ShowRosterTab — Full performer roster matching old vCommand ShowSync layout.
 * Top: performer table with inline status + action buttons.
 * Bottom: email activity timeline per performer.
 * Created: 2026-04-01 | Rewritten to match old layout: 2026-04-01
 */

import { useState } from 'react';
import { Users, Plus, Mail, Send, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import AddPerformerModal from './AddPerformerModal';
import { updateShowFields } from '../lib/firestoreService';
import { useBrainRequest } from '../hooks/useBrainRequest';
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

// Status badge for the performer row (top section)
function InquiryBadge({ p }: { p: RosterPerformer }) {
  if (!p.inquirySentAt) return <span className="text-[10px] text-slate-600">Not sent</span>;
  if (p.inquiryResponse === 'Available') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Inq: Available</span>;
  if (p.inquiryResponse === 'Unavailable') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Inq: Unavailable</span>;
  if (p.inquiryOpenedAt) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">Inq: Opened</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Inq: Sent</span>;
}

function ActionButton({ label, icon, disabled, loading, onClick }: { label: string; icon: React.ReactNode; disabled?: boolean; loading?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-30"
    >
      {loading ? <Loader2 size={10} className="animate-spin" /> : icon} {label}
    </button>
  );
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

function SendEmailButton({ performer, stage, show }: { performer: RosterPerformer; stage: EmailStageType; show: ShowIntelligence }) {
  const brain = useBrainRequest();
  const [sent, setSent] = useState(false);

  const showName = show.eventName || show.clientName || 'Show';
  const venue = show.venueName || '';

  const handleSend = async () => {
    if (!performer.email) return;
    await brain.sendRequest({
      type: 'action',
      prompt: `Send ${stage} email to ${performer.name} (${performer.email}) for ${showName} on ${show.showDate} at ${venue}`,
      showId: show.id,
      context: {
        actionSteps: [{
          tool: 'send_email',
          params: {
            showId: show.linkedShowId || show.id,
            performerId: performer.performerId || performer.name,
            performerName: performer.name,
            performerEmail: performer.email,
            emailType: stage,
            showName,
            showDate: show.showDate,
            venue,
            callTime: show.loadInTime,
            performanceStart: show.performanceStartTime,
            pay: performer.pay,
            portalBaseUrl: 'https://vrbrain.vercel.app/portal',
            trackingBaseUrl: 'https://vcommand.vercel.app/api/showsync/track',
          },
        }],
      },
    });
    setSent(true);
  };

  if (sent) return <span className="text-[10px] text-emerald-400">Sent!</span>;

  const alreadySent = performer[`${stage}SentAt` as keyof RosterPerformer];
  if (alreadySent) return null;

  // Check prerequisites
  if (stage === 'offer' && !performer.inquiryResponse) return null;
  if (stage === 'confirmation' && !performer.offerResponse) return null;

  return (
    <ActionButton
      label={stage === 'inquiry' ? 'Inquiry' : stage === 'offer' ? 'Offer' : 'Confirm'}
      icon={<Send size={10} />}
      disabled={!performer.email || brain.isWorking}
      loading={brain.isWorking}
      onClick={handleSend}
    />
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
      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <h3 className="col-header flex items-center gap-2"><Users size={14} /> Performers ({roster.totalPerformers})</h3>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
            <Mail size={12} /> Email Blitz
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Performer table — compact rows with inline status + actions */}
      <div className="space-y-2">
        {roster.performers.map((p, i) => (
          <div key={`${p.name}-${i}`} className="flex items-center gap-3 bg-white/[0.03] border border-white/6 rounded-xl p-3 hover:border-white/10 transition-colors">
            {/* Status dot */}
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              p.status === 'confirmed' ? 'bg-emerald-500' :
              p.status === 'declined' || p.status === 'unavailable' ? 'bg-red-500' :
              p.status === 'offered' ? 'bg-cyan-500' :
              'bg-amber-500'
            }`} />

            {/* Name + email */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{p.name}</span>
              </div>
              {p.email && <div className="text-[11px] text-slate-500">{p.email}</div>}
            </div>

            {/* Pay */}
            <div className="text-sm font-mono text-slate-300 shrink-0 w-16 text-right">
              {p.pay ? `$ ${p.pay}` : ''}
            </div>

            {/* Inquiry status badge */}
            <InquiryBadge p={p} />

            {/* Action buttons */}
            <div className="flex gap-1 shrink-0">
              <SendEmailButton performer={p} stage="inquiry" show={show} />
              <SendEmailButton performer={p} stage="offer" show={show} />
              <SendEmailButton performer={p} stage="confirmation" show={show} />
            </div>

            {/* Conversation icon */}
            <button className="text-slate-600 hover:text-slate-300 transition-colors shrink-0">
              <MessageSquare size={14} />
            </button>

            {/* Remove */}
            <button
              onClick={() => handleRemove(p)}
              disabled={removingId === (p.performerId || p.name)}
              className="text-slate-700 hover:text-red-400 transition-colors shrink-0"
            >
              {removingId === (p.performerId || p.name) ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
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
