/**
 * ShowDetail — Tab shell for full show management.
 * Wired to real Firestore data via useShowDetail hook.
 * Created: 2026-04-01 | Rewritten: 2026-04-01
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, FileText, PenTool } from 'lucide-react';
import { useShowDetail } from '../hooks/useShowDetail';
import ShowOverviewTab from './ShowOverviewTab';
import ShowRosterTab from './ShowRosterTab';
import ShowConversationsTab from './ShowConversationsTab';
import ShowChecklistTab from './ShowChecklistTab';
import ShowFinancialsTab from './ShowFinancialsTab';
import ShowDocumentsTab from './ShowDocumentsTab';
import ShowSettingsTab from './ShowSettingsTab';

const statusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'confirmed') return 'bg-emerald-500/10 text-emerald-500';
  if (s === 'completed') return 'bg-slate-500/10 text-slate-400';
  if (s === 'cancelled') return 'bg-red-500/10 text-red-500';
  if (s === 'hold') return 'bg-purple-500/10 text-purple-400';
  return 'bg-amber-500/10 text-amber-500';
};

type TabName = 'Overview' | 'Roster' | 'Conversations' | 'Checklist' | 'Financials' | 'Documents' | 'Settings';

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

  const tabs: TabName[] = ['Overview', 'Roster', 'Conversations', 'Checklist', 'Financials', 'Documents', 'Settings'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          <button onClick={() => navigate('/tools', { state: { tool: 'invoice', showId: show.id } })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            <FileText size={12} /> Invoice
          </button>
          <button onClick={() => navigate('/tools', { state: { tool: 'contract', showId: show.id } })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
            <PenTool size={12} /> Contract
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="glass p-6 rounded-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-1">{displayName}</h1>
          {show.eventType && (
            <div className="text-sm text-cyan-400 font-mono mb-2">{show.eventType}</div>
          )}
          <div className="flex gap-4 text-sm text-slate-400 flex-wrap justify-center">
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
            {saving && <span className="text-xs text-amber-400 animate-pulse">Saving...</span>}
            {saveError && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} /> Save failed
              </span>
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
        {activeTab === 'Settings' && <ShowSettingsTab show={show} />}
      </div>
    </div>
  );
}
