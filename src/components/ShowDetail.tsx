/**
 * ShowDetail — Tab shell for full show management.
 * Wired to real Firestore data via useShowDetail hook.
 * Created: 2026-04-01 | Rewritten: 2026-04-01
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useShowDetail } from '../hooks/useShowDetail';
import ShowOverviewTab from './ShowOverviewTab';
import ShowRosterTab from './ShowRosterTab';
import ShowConversationsTab from './ShowConversationsTab';
import ShowChecklistTab from './ShowChecklistTab';
import ShowFinancialsTab from './ShowFinancialsTab';
import ShowDocumentsTab from './ShowDocumentsTab';

const statusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'confirmed') return 'bg-emerald-500/10 text-emerald-500';
  if (s === 'completed') return 'bg-slate-500/10 text-slate-400';
  if (s === 'cancelled') return 'bg-red-500/10 text-red-500';
  if (s === 'hold') return 'bg-purple-500/10 text-purple-400';
  return 'bg-amber-500/10 text-amber-500';
};

type TabName = 'Overview' | 'Roster' | 'Conversations' | 'Checklist' | 'Financials' | 'Documents';

export default function ShowDetail() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabName>('Overview');
  const { show, checklist, conversations, payables, loading, saving, saveError, updateField, updateFields } = useShowDetail(showId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-center py-24 text-slate-500">Show not found.</div>
      </div>
    );
  }

  const displayName = show.eventName || show.clientName || show.matchKeys?.clientName || 'Untitled Show';
  const venue = show.venueName || show.matchKeys?.venueName || '';
  const venueLocation = [show.venueCity, show.venueState].filter(Boolean).join(', ');
  const fullVenue = [venue, venueLocation].filter(Boolean).join(' — ');

  const tabs: TabName[] = ['Overview', 'Roster', 'Conversations', 'Checklist', 'Financials', 'Documents'];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="glass p-6 rounded-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{displayName}</h1>
            <div className="flex gap-4 text-sm text-slate-400 flex-wrap">
              {show.showDate && <span className="font-mono">{show.showDate}</span>}
              {fullVenue && <span>{fullVenue}</span>}
              {show.status && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${statusColor(show.status)}`}>
                  {show.status}
                </span>
              )}
              {show.roster && (
                <span className="text-xs">
                  {show.roster.confirmed} confirmed / {show.roster.pending} pending / {show.roster.totalPerformers} total
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex items-center gap-3">
            {saving && <span className="text-xs text-amber-400 animate-pulse">Saving...</span>}
            {saveError && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} /> Save failed
              </span>
            )}
            {show.completeness !== undefined && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Complete</div>
                <div className="text-2xl font-bold font-mono text-cyan-400">{show.completeness}%</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
            {tab === 'Roster' && show.roster && (
              <span className="ml-1 text-xs opacity-60">({show.roster.totalPerformers})</span>
            )}
            {tab === 'Conversations' && conversations.length > 0 && (
              <span className="ml-1 text-xs opacity-60">({conversations.length})</span>
            )}
            {tab === 'Checklist' && checklist && (
              <span className="ml-1 text-xs opacity-60">
                ({checklist.items.filter((i) => i.status === 'completed').length}/{checklist.items.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass rounded-2xl min-h-[300px]">
        {activeTab === 'Overview' && <ShowOverviewTab show={show} updateField={updateField} />}
        {activeTab === 'Roster' && <ShowRosterTab show={show} />}
        {activeTab === 'Conversations' && <ShowConversationsTab conversations={conversations} show={show} />}
        {activeTab === 'Checklist' && <ShowChecklistTab checklist={checklist} showId={show.id} />}
        {activeTab === 'Financials' && <ShowFinancialsTab show={show} payables={payables} updateField={updateField} />}
        {activeTab === 'Documents' && <ShowDocumentsTab show={show} />}
      </div>
    </div>
  );
}
