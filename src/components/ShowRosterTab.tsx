/**
 * ShowRosterTab — Full performer roster with 3-stage email pipeline.
 * Send inquiry/offer/confirmation via Brain, track opens/responses.
 * Created: 2026-04-01 | Phase 2 rewrite: 2026-04-01
 */

import { useState } from 'react';
import { Users, Plus, Mail, Trash2, Send, ChevronDown, ChevronRight } from 'lucide-react';
import BrainActionButton from './BrainActionButton';
import AddPerformerModal from './AddPerformerModal';
import { updateShowFields } from '../lib/firestoreService';
import type { ShowIntelligence, RosterPerformer, EmailStageType } from '../types/show';

interface Props {
  show: ShowIntelligence;
}

function safeDate(val: any): string {
  if (!val) return '';
  if (val.toDate) return val.toDate().toLocaleDateString();
  if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString();
  const d = new Date(val);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

function safeDateTime(val: any): string {
  if (!val) return '';
  if (val.toDate) return val.toDate().toLocaleString();
  if (val.seconds) return new Date(val.seconds * 1000).toLocaleString();
  const d = new Date(val);
  return isNaN(d.getTime()) ? '' : d.toLocaleString();
}

const stageBadge = (label: string, color: string) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
);

function EmailStage({ performer, stage, show, onEmailUpdate }: { performer: RosterPerformer; stage: EmailStageType; show: ShowIntelligence; onEmailUpdate?: (email: string) => void }) {
  const sentAt = performer[`${stage}SentAt` as keyof RosterPerformer] as string | undefined;
  const openedAt = performer[`${stage}OpenedAt` as keyof RosterPerformer] as string | undefined;
  const response = performer[`${stage}Response` as keyof RosterPerformer] as string | undefined;
  const respondedAt = performer[`${stage}RespondedAt` as keyof RosterPerformer] as string | undefined;
  const [inlineEmail, setInlineEmail] = useState('');

  // Determine if previous stage is complete (for disabling)
  const canSend = (() => {
    if (stage === 'inquiry') return !sentAt;
    if (stage === 'offer') return !!performer.inquiryResponse && !sentAt;
    if (stage === 'confirmation') return !!performer.offerResponse && !sentAt;
    return false;
  })();

  const effectiveEmail = performer.email || inlineEmail;

  const isPositive = response === 'Available' || response === 'Accepted' || response === 'Confirmed';
  const isNegative = response === 'Unavailable' || response === 'Declined' || response === 'Not Confirmed';

  const showName = show.eventName || show.clientName || 'Show';
  const venue = show.venueName || '';
  const shortDate = show.showDate ? new Date(show.showDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) : '';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider w-20 shrink-0">{stage}</span>

      {!sentAt && canSend && (
        <div className="flex items-center gap-2">
          {!performer.email && (
            <input
              type="email"
              value={inlineEmail}
              onChange={(e) => setInlineEmail(e.target.value)}
              onBlur={() => { if (inlineEmail && onEmailUpdate) onEmailUpdate(inlineEmail); }}
              placeholder="Enter email..."
              className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[11px] w-40 focus:outline-none focus:border-amber-500/50"
            />
          )}
          <BrainActionButton
            label={`Send ${stage}`}
            icon={<Send size={10} />}
            size="sm"
            disabled={!effectiveEmail}
            request={{
              type: 'action',
              prompt: `Send ${stage} email to ${performer.name} (${effectiveEmail}) for ${showName} on ${show.showDate} at ${venue}`,
              showId: show.id,
              context: {
                actionSteps: [{
                  tool: 'send_email',
                  params: {
                    showId: show.linkedShowId || show.id,
                    performerId: performer.performerId || performer.name,
                    performerName: performer.name,
                    performerEmail: effectiveEmail,
                    emailType: stage,
                    showName,
                    showDate: show.showDate,
                    venue,
                    callTime: show.loadInTime,
                    performanceStart: show.performanceStartTime,
                    pay: performer.pay,
                    notesToTalent: '',
                    portalBaseUrl: 'https://vrbrain.vercel.app/portal',
                    trackingBaseUrl: 'https://vcommand.vercel.app/api/showsync/track',
                  },
                }],
              },
            }}
          />
        </div>
      )}

      {!sentAt && !canSend && (
        <span className="text-[10px] text-slate-600">—</span>
      )}

      {sentAt && (
        <>
          {stageBadge(`Sent ${safeDate(sentAt)}`, 'bg-blue-500/10 text-blue-400')}
          {openedAt ? stageBadge(`Opened ${safeDateTime(openedAt)}`, 'bg-cyan-500/10 text-cyan-400') : stageBadge('Not opened', 'bg-slate-500/10 text-slate-500')}
          {response ? (
            isPositive
              ? stageBadge(`${response}`, 'bg-emerald-500/10 text-emerald-400')
              : isNegative
              ? stageBadge(`${response}`, 'bg-red-500/10 text-red-400')
              : stageBadge(`${response}`, 'bg-slate-500/10 text-slate-400')
          ) : (
            stageBadge('Awaiting', 'bg-amber-500/10 text-amber-400')
          )}
        </>
      )}
    </div>
  );
}

function PerformerRow({ performer, show, onRemove }: { performer: RosterPerformer; show: ShowIntelligence; onRemove: () => void | Promise<void> }) {
  const [expanded, setExpanded] = useState(true); // Default expanded so pipeline is always visible
  const [confirmRemove, setConfirmRemove] = useState(false);

  const statusStyle: Record<string, string> = {
    confirmed: 'bg-emerald-500/10 text-emerald-500',
    offered: 'bg-cyan-500/10 text-cyan-400',
    inquired: 'bg-amber-500/10 text-amber-500',
    declined: 'bg-red-500/10 text-red-500',
    unavailable: 'bg-slate-500/10 text-slate-400',
  };

  return (
    <div className="border border-white/6 rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-4 hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm">{performer.name}</span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusStyle[performer.status] || statusStyle.inquired}`}>
              {performer.status}
            </span>
            {performer.role && <span className="text-xs text-slate-500">{performer.role}</span>}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {performer.email && <span>{performer.email}</span>}
            {performer.phone && <span className="ml-3">{performer.phone}</span>}
          </div>
        </div>
        <div className="text-sm font-mono text-cyan-400 shrink-0">{performer.pay ? `$${performer.pay}` : ''}</div>
      </div>

      {/* Expanded: email pipeline + actions */}
      {expanded && (
        <div className="border-t border-white/6 p-4 space-y-3 bg-white/[0.01]">
          <EmailStage performer={performer} stage="inquiry" show={show} />
          <EmailStage performer={performer} stage="offer" show={show} />
          <EmailStage performer={performer} stage="confirmation" show={show} />

          <div className="flex justify-end pt-2 border-t border-white/6">
            {!confirmRemove ? (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmRemove(true); }}
                className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={12} /> Remove
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-red-400">Remove {performer.name}?</span>
                <BrainActionButton
                  label="Yes, Remove"
                  variant="danger"
                  size="sm"
                  request={{
                    type: 'action',
                    prompt: `Remove performer ${performer.name} from show ${show.eventName || show.clientName}`,
                    showId: show.id,
                    context: {
                      actionSteps: [{
                        tool: 'remove_performer_from_show',
                        params: {
                          showId: show.linkedShowId || show.id,
                          performerName: performer.name,
                        },
                      }],
                    },
                  }}
                  onComplete={onRemove}
                />
                <button onClick={() => setConfirmRemove(false)} className="text-[10px] text-slate-500 hover:text-white">Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShowRosterTab({ show }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const roster = show.roster;

  const handleRemove = async (performerName: string) => {
    // Optimistic: remove from local roster
    if (!roster) return;
    const updated = roster.performers.filter(p => p.name !== performerName);
    const removed = roster.performers.find(p => p.name === performerName);
    const wasConfirmed = removed?.status === 'confirmed';
    const wasDeclined = removed?.status === 'declined';
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
  };

  if (!roster || !roster.performers || roster.performers.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div />
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-amber-500 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors"
          >
            <Plus size={14} /> Add Performer
          </button>
        </div>
        <div className="text-center py-12">
          <Users size={32} className="mx-auto mb-4 text-slate-600" />
          <p className="text-sm text-slate-500">No performers on this roster yet.</p>
          <p className="text-xs text-slate-600 mt-1">Add performers above, or they'll sync from ShowSync.</p>
        </div>
        <AddPerformerModal show={show} isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header bar */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm">
          <span className="text-emerald-400 font-bold">{roster.confirmed} confirmed</span>
          <span className="text-amber-400">{roster.pending} pending</span>
          <span className="text-red-400">{roster.declined} declined</span>
          <span className="text-slate-400">{roster.totalPerformers} total</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-amber-500 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors"
        >
          <Plus size={14} /> Add Performer
        </button>
      </div>

      {/* Performer cards */}
      <div className="space-y-2">
        {roster.performers.map((p, i) => (
          <div key={`${p.name}-${i}`}>
            <PerformerRow
              performer={p}
              show={show}
              onRemove={() => handleRemove(p.name)}
            />
          </div>
        ))}
      </div>

      <AddPerformerModal show={show} isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
