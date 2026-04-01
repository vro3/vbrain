/**
 * AddPerformerModal — Add a performer to a show's roster via Brain.
 * Created: 2026-04-01
 */

import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import BrainActionButton from './BrainActionButton';
import { updateShowFields } from '../lib/firestoreService';
import type { ShowIntelligence } from '../types/show';

interface Props {
  show: ShowIntelligence;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPerformerModal({ show, isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pay, setPay] = useState('');
  const [role, setRole] = useState('');

  if (!isOpen) return null;

  const displayName = show.eventName || show.clientName || 'this show';

  const handleComplete = async () => {
    // Optimistic update: write performer to show_intelligence.roster directly
    const currentRoster = show.roster || { totalPerformers: 0, confirmed: 0, declined: 0, pending: 0, performers: [] };
    const newPerformer = {
      name,
      email: email || undefined,
      phone: phone || undefined,
      pay: pay || '0',
      role: role || undefined,
      status: 'inquired' as const,
      performerId: Date.now().toString(36),
    };
    await updateShowFields(show.id, {
      roster: {
        ...currentRoster,
        totalPerformers: currentRoster.totalPerformers + 1,
        pending: currentRoster.pending + 1,
        performers: [...currentRoster.performers, newPerformer],
      },
    });
    setName(''); setEmail(''); setPhone(''); setPay(''); setRole('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass w-full max-w-md rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><UserPlus size={18} className="text-amber-500" /> Add Performer</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-white" /></button>
        </div>
        <p className="text-xs text-slate-500">Adding to: {displayName}</p>

        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name *" className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" />
          <div className="grid grid-cols-2 gap-3">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" />
            <input value={pay} onChange={e => setPay(e.target.value)} placeholder="Pay ($)" className="bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role (e.g. Drumline, DJ)" className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" />
        </div>

        <div className="flex justify-between items-center pt-2">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">Cancel</button>
          <BrainActionButton
            label="Add to Roster"
            variant="primary"
            size="md"
            disabled={!name.trim()}
            request={{
              type: 'action',
              prompt: `Add performer ${name} to show ${displayName}`,
              showId: show.id,
              context: {
                actionSteps: [{
                  tool: 'add_performer_to_show',
                  params: {
                    showId: show.linkedShowId || show.id,
                    performerName: name,
                    performerEmail: email,
                    pay,
                    role,
                  },
                }],
              },
            }}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  );
}
