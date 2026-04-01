/**
 * ShowRosterTab — Performer roster from show_intelligence.roster.
 * Phase 1: Read-only display. Phase 2 adds Brain actions.
 * Created: 2026-04-01
 */

import { Users } from 'lucide-react';
import type { ShowIntelligence } from '../types/show';

interface Props {
  show: ShowIntelligence;
}

const statusStyle: Record<string, string> = {
  confirmed: 'bg-emerald-500/10 text-emerald-500',
  offered: 'bg-cyan-500/10 text-cyan-400',
  inquired: 'bg-amber-500/10 text-amber-500',
  declined: 'bg-red-500/10 text-red-500',
  unavailable: 'bg-slate-500/10 text-slate-400',
};

export default function ShowRosterTab({ show }: Props) {
  const roster = show.roster;

  if (!roster || !roster.performers || roster.performers.length === 0) {
    return (
      <div className="p-6 text-center py-16">
        <Users size={32} className="mx-auto mb-4 text-slate-600" />
        <p className="text-sm text-slate-500">No roster data yet.</p>
        <p className="text-xs text-slate-600 mt-1">Roster syncs from ShowSync every 30 minutes.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <span className="text-emerald-400 font-bold">{roster.confirmed} confirmed</span>
        <span className="text-amber-400">{roster.pending} pending</span>
        <span className="text-red-400">{roster.declined} declined</span>
        <span className="text-slate-400">{roster.totalPerformers} total</span>
      </div>

      {/* Table */}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/6">
            <th className="col-header p-3">Performer</th>
            <th className="col-header p-3">Role</th>
            <th className="col-header p-3">Pay</th>
            <th className="col-header p-3">Status</th>
            <th className="col-header p-3">Contact</th>
          </tr>
        </thead>
        <tbody>
          {roster.performers.map((p, i) => (
            <tr key={`${p.name}-${i}`} className="border-b border-white/6 hover:bg-white/[0.02] transition-colors">
              <td className="p-3 font-medium">{p.name}</td>
              <td className="p-3 text-slate-400">{p.role || '—'}</td>
              <td className="p-3 font-mono">{p.pay ? `$${p.pay}` : '—'}</td>
              <td className="p-3">
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${statusStyle[p.status] || statusStyle.inquired}`}>
                  {p.status}
                </span>
              </td>
              <td className="p-3 text-xs text-slate-400">
                {p.email && <div>{p.email}</div>}
                {p.phone && <div>{p.phone}</div>}
                {!p.email && !p.phone && '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
