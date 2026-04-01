/**
 * ShowFinancialsTab — Fee, deposit, balance, travel + performer payables.
 * Editable financial fields + read-only payables table.
 * Created: 2026-04-01
 */

import { DollarSign } from 'lucide-react';
import type { ShowIntelligence, PerformerPayable } from '../types/show';

interface Props {
  show: ShowIntelligence;
  payables: PerformerPayable[];
  updateField: (field: string, value: any) => Promise<void>;
}

function EditableAmount({ label, value, field, onSave }: {
  label: string; value: string | undefined; field: string;
  onSave: (field: string, value: any) => Promise<void>;
}) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-slate-400 text-sm">{label}</span>
      <input
        type="text"
        defaultValue={value || ''}
        onBlur={(e) => {
          if (e.target.value !== (value || '')) onSave(field, e.target.value);
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        className="bg-white/5 border border-white/6 rounded px-3 py-1 text-sm text-right font-mono w-32 focus:outline-none focus:border-amber-500/50"
        placeholder="$0"
      />
    </div>
  );
}

const payableStatusStyle: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400',
  submitted: 'bg-cyan-500/10 text-cyan-400',
  approved: 'bg-emerald-500/10 text-emerald-400',
  paid: 'bg-emerald-500/10 text-emerald-500',
  disputed: 'bg-red-500/10 text-red-400',
};

export default function ShowFinancialsTab({ show, payables, updateField }: Props) {
  // Filter payables to only performers on this show's roster
  const rosterNames = new Set(
    (show.roster?.performers || []).map(p => p.name.toLowerCase().trim())
  );
  const showPayables = rosterNames.size > 0
    ? payables.filter(p => {
        const name = (p.performerName || p.vendorName || '').toLowerCase().trim();
        return rosterNames.has(name);
      })
    : [];

  // Also calculate pay from roster directly as fallback
  const rosterPay = (show.roster?.performers || [])
    .filter(p => p.status !== 'declined' && p.status !== 'unavailable')
    .reduce((sum, p) => sum + (parseFloat(p.pay?.replace(/[^0-9.]/g, '') || '0')), 0);

  const payablesTotal = showPayables.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPerformerCost = payablesTotal > 0 ? payablesTotal : rosterPay;
  const fee = parseFloat(show.fee?.replace(/[^0-9.]/g, '') || '0');
  const netProfit = fee - totalPerformerCost;

  return (
    <div className="p-6 space-y-8">
      {/* Show Financials */}
      <div>
        <h3 className="col-header mb-4">Show Financials</h3>
        <div className="max-w-md space-y-1">
          <EditableAmount label="Show Fee" value={show.fee} field="fee" onSave={updateField} />
          <EditableAmount label="Deposit Amount" value={show.depositAmount} field="depositAmount" onSave={updateField} />
          <EditableAmount label="Balance Due" value={show.balanceDue} field="balanceDue" onSave={updateField} />
          <EditableAmount label="Travel Budget" value={show.travelBudget} field="travelBudget" onSave={updateField} />
        </div>
      </div>

      {/* Profit Summary */}
      <div className="border-t border-white/6 pt-4">
        <h3 className="col-header mb-4">Profit Summary</h3>
        <div className="max-w-md space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Show Fee</span>
            <span className="font-mono text-emerald-400">${fee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Performer Pay ({show.roster?.performers?.filter(p => p.status !== 'declined' && p.status !== 'unavailable').length || 0})</span>
            <span className="font-mono text-red-400">-${totalPerformerCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-white/6 font-bold">
            <span>Net Profit</span>
            <span className={`font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${netProfit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Performer Payables */}
      {showPayables.length > 0 && (
        <div className="border-t border-white/6 pt-4">
          <h3 className="col-header mb-4">Performer Payables</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/6">
                <th className="col-header p-3">Performer</th>
                <th className="col-header p-3">Amount</th>
                <th className="col-header p-3">Status</th>
                <th className="col-header p-3">Invoice #</th>
              </tr>
            </thead>
            <tbody>
              {showPayables.map((p) => (
                <tr key={p.id} className="border-b border-white/6 hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 font-medium">{p.performerName || p.vendorName || 'Unknown'}</td>
                  <td className="p-3 font-mono text-cyan-400">${(p.amount || 0).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${payableStatusStyle[p.status || ''] || payableStatusStyle.pending}`}>
                      {p.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-xs">{p.invoiceNumber || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPayables.length === 0 && (
        <div className="border-t border-white/6 pt-4">
          <h3 className="col-header mb-2">Performer Payables</h3>
          <p className="text-sm text-slate-500 text-center py-8">
            <DollarSign size={24} className="mx-auto mb-2 text-slate-600" />
            No payables linked to this show.
          </p>
        </div>
      )}
    </div>
  );
}
