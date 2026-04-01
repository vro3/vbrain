/**
 * ShowFinancialsTab — Fee, deposit, balance, travel + performer payables.
 * Editable financial fields + read-only payables table.
 * Created: 2026-04-01
 */

import { useState } from 'react';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase-client';
import { updateShowFields } from '../lib/firestoreService';
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

      {/* Expenses */}
      <ExpenseSection show={show} updateField={updateField} />
    </div>
  );
}

function ExpenseSection({ show, updateField }: { show: ShowIntelligence; updateField: (f: string, v: any) => Promise<void> }) {
  const [showAdd, setShowAdd] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('travel');

  const expenses: Array<{ description: string; amount: number; category: string; date?: string }> = (show as any).expenses || [];
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const handleAdd = async () => {
    if (!desc || !amount) return;
    const updated = [...expenses, { description: desc, amount: parseFloat(amount) || 0, category, date: new Date().toISOString().split('T')[0] }];
    await updateField('expenses', updated);
    setDesc(''); setAmount(''); setShowAdd(false);
  };

  const handleRemove = async (i: number) => {
    const updated = expenses.filter((_, idx) => idx !== i);
    await updateField('expenses', updated);
  };

  return (
    <div className="border-t border-white/6 pt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="col-header">Expenses</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400">
          <Plus size={12} /> Add Expense
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4 items-end">
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" className="flex-1 bg-white/5 border border-white/6 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500/50" />
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="$" type="number" className="w-24 bg-white/5 border border-white/6 rounded-lg p-2 text-sm text-right focus:outline-none focus:border-amber-500/50" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="bg-white/5 border border-white/6 rounded-lg p-2 text-xs focus:outline-none">
            <option value="travel">Travel</option>
            <option value="equipment">Equipment</option>
            <option value="food">Food</option>
            <option value="venue">Venue</option>
            <option value="other">Other</option>
          </select>
          <button onClick={handleAdd} className="bg-amber-500 text-slate-950 px-3 py-2 rounded-lg text-xs font-bold">Add</button>
        </div>
      )}

      {expenses.length > 0 ? (
        <div className="space-y-1">
          {expenses.map((e, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] text-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{e.category}</span>
                <span>{e.description}</span>
                {e.date && <span className="text-xs text-slate-600 font-mono">{e.date}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-red-400">${(e.amount || 0).toLocaleString()}</span>
                <button onClick={() => handleRemove(i)} className="text-slate-700 hover:text-red-400"><Trash2 size={10} /></button>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-2 border-t border-white/6 text-sm">
            <span className="text-slate-400 mr-4">Total Expenses:</span>
            <span className="font-mono text-red-400 font-bold">${totalExpenses.toLocaleString()}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600 text-center py-4">No expenses recorded.</p>
      )}
    </div>
  );
}
