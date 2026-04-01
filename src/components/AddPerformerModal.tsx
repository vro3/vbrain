/**
 * AddPerformerModal — Pick from existing performer roster or add new.
 * Searchable list of all performers from master list.
 * Created: 2026-04-01
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Search, Plus } from 'lucide-react';
import { updateShowFields } from '../lib/firestoreService';
import type { ShowIntelligence } from '../types/show';

interface Props {
  show: ShowIntelligence;
  isOpen: boolean;
  onClose: () => void;
}

// Master performer list from ShowSync Performers sheet
const PERFORMERS = [
  { id: 'P-0001', name: 'Vincent Romanelli', email: 'vince@vinceromanelli.com', phone: '6152946961', defaultPay: '500', skill: 'Drums' },
  { id: 'P-0002', name: 'Daniel Twiford', email: 'danieltwiford@gmail.com', phone: '6154577999', defaultPay: '500', skill: 'Drums' },
  { id: 'P-0003', name: 'Glenn Ziser', email: 'glenn@ziserrealty.com', phone: '6153908700', defaultPay: '500', skill: 'Drums' },
  { id: 'P-0004', name: 'Benjamin Lupton', email: 'luptonben@gmail.com', phone: '8287340017', defaultPay: '500', skill: '' },
  { id: 'P-0005', name: 'Andrew Scheuer', email: 'drewscheuer@yahoo.com', phone: '6154242980', defaultPay: '500', skill: '' },
  { id: 'P-0006', name: 'Dennis Henley', email: 'dshenley@gmail.com', phone: '7708830956', defaultPay: '500', skill: '' },
  { id: 'P-0007', name: 'Nicholas Harrison', email: 'nick.harrison1934@gmail.com', phone: '6152005286', defaultPay: '500', skill: '' },
  { id: 'P-0008', name: 'Edwin Merkley', email: 'Mellowgoldfish@gmail.com', phone: '6154194035', defaultPay: '500', skill: '' },
  { id: 'P-0009', name: 'Ben Heidrich', email: 'ben.heidrich@gmail.com', phone: '7044307560', defaultPay: '500', skill: '' },
  { id: 'P-0010', name: 'C.T. Blackmore', email: 'cT@CollectiveSoundEntertainment.com', phone: '3145800462', defaultPay: '500', skill: '' },
  { id: 'P-0011', name: 'Emma Supica', email: 'emmasupica@gmail.com', phone: '7853937977', defaultPay: '500', skill: '' },
  { id: 'P-0012', name: 'Mina Schwartz', email: 'wilhelminaraven118@gmail.com', phone: '6154488784', defaultPay: '500', skill: '' },
  { id: 'P-0013', name: 'Jess Knoble', email: '13knoble@gmail.com', phone: '6159480870', defaultPay: '500', skill: '' },
  { id: 'P-0014', name: 'David Dykstra', email: 'Dykstra1@gmail.com', phone: '6155211565', defaultPay: '500', skill: '' },
  { id: 'P-0016', name: 'Maite Cintron', email: 'maitecintronaguilo@gmail.com', phone: '4079645365', defaultPay: '600', skill: '' },
  { id: 'P-0017', name: 'Samantha Johnson', email: 'spicylife1580@gmail.com', phone: '9043271194', defaultPay: '600', skill: '' },
  { id: 'mlu36576', name: 'Mike Miller', email: 'pianoman132@gmail.com', phone: '6304045542', defaultPay: '300', skill: '' },
  { id: 'mlu37gh1', name: 'Jason Saitta', email: 'Jasonmsaitta@gmail.com', phone: '7039647190', defaultPay: '500', skill: '' },
  { id: 'P-0020', name: 'Josh Lyon', email: 'josh@figaroaudio.com', phone: '6158189519', defaultPay: '500', skill: '' },
];

export default function AddPerformerModal({ show, isOpen, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [pay, setPay] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  if (!isOpen) return null;

  // Filter out performers already on this show's roster
  const existingNames = new Set((show.roster?.performers || []).map(p => p.name.toLowerCase()));
  const available = PERFORMERS.filter(p => !existingNames.has(p.name.toLowerCase()));
  const filtered = search
    ? available.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))
    : available;

  const addPerformer = async (performer: { id: string; name: string; email: string; phone?: string; defaultPay?: string }) => {
    const currentRoster = show.roster || { totalPerformers: 0, confirmed: 0, declined: 0, pending: 0, performers: [] };
    const newPerformer: Record<string, any> = {
      name: performer.name,
      email: performer.email,
      phone: performer.phone,
      performerId: performer.id,
      pay: pay || performer.defaultPay || '0',
      status: 'inquired',
    };
    // Strip undefined
    Object.keys(newPerformer).forEach(k => { if (!newPerformer[k]) delete newPerformer[k]; });

    await updateShowFields(show.id, {
      roster: {
        ...currentRoster,
        totalPerformers: currentRoster.totalPerformers + 1,
        pending: currentRoster.pending + 1,
        performers: [...currentRoster.performers, newPerformer],
      },
    });
    setPay('');
    setSearch('');
    onClose();
  };

  const addNew = async () => {
    if (!newName.trim()) return;
    await addPerformer({ id: Date.now().toString(36), name: newName, email: newEmail, phone: newPhone });
    setNewName(''); setNewEmail(''); setNewPhone('');
    setShowNewForm(false);
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="glass w-full max-w-lg rounded-2xl overflow-hidden mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/6">
          <h3 className="font-bold flex items-center gap-2"><UserPlus size={18} className="text-amber-500" /> Add Performer</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-white" /></button>
        </div>

        {/* Pay override */}
        <div className="px-4 pt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500">Pay override:</span>
          <input
            value={pay}
            onChange={e => setPay(e.target.value)}
            placeholder="Default"
            className="bg-white/5 border border-white/6 rounded px-2 py-1 text-sm w-24 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search performers..."
              className="w-full bg-white/5 border border-white/6 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
              autoFocus
            />
          </div>
        </div>

        {/* Performer list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => addPerformer(p)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
            >
              <div>
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-[11px] text-slate-500">{p.email}</div>
              </div>
              <div className="text-xs text-slate-400 font-mono">${pay || p.defaultPay}</div>
            </button>
          ))}
          {filtered.length === 0 && !showNewForm && (
            <p className="text-sm text-slate-500 text-center py-4">No matching performers.</p>
          )}
        </div>

        {/* Add new performer */}
        <div className="border-t border-white/6 p-4">
          {!showNewForm ? (
            <button onClick={() => setShowNewForm(true)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
              <Plus size={14} /> Add new performer not in list
            </button>
          ) : (
            <div className="space-y-2">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name *" className="w-full bg-white/5 border border-white/6 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500/50" />
              <div className="grid grid-cols-2 gap-2">
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email" className="bg-white/5 border border-white/6 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500/50" />
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone" className="bg-white/5 border border-white/6 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500/50" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowNewForm(false)} className="text-xs text-slate-400">Cancel</button>
                <button onClick={addNew} disabled={!newName.trim()} className="bg-amber-500 text-slate-950 px-3 py-1 rounded-lg text-xs font-bold disabled:opacity-40">Add</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
