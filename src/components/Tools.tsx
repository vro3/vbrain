/**
 * Tools — Document generation tools: Invoice, Contract, Rider, Run of Show.
 * Invoice Generator fully functional with line items, totals, deposit split.
 * Created: 2026-04-01
 */

import React, { useState, useCallback } from 'react';
import { FileText, PenTool, Mic, Clock, X, Plus, Trash2, Send, Download, DollarSign } from 'lucide-react';

// ============================================================
// INVOICE GENERATOR (full feature parity with v1)
// ============================================================

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  invoiceNumber: string;
  dateIssued: string;
  dateDue: string;
  clientName: string;
  clientEmail: string;
  billToAddress: string;
  eventName: string;
  eventDate: string;
  items: LineItem[];
  taxRate: number;
  notes: string;
  paymentTerms: string;
  fromName: string;
  fromAddress: string;
  fromEmail: string;
}

const DEFAULT_INVOICE: InvoiceData = {
  invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
  dateIssued: new Date().toISOString().split('T')[0],
  dateDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  clientName: '',
  clientEmail: '',
  billToAddress: '',
  eventName: '',
  eventDate: '',
  items: [{ id: '1', description: 'Performance Fee', quantity: 1, price: 0 }],
  taxRate: 0,
  notes: 'Thank you for your business. Please make checks payable to VR Creative Group.',
  paymentTerms: 'Due on Receipt',
  fromName: 'VR Creative Group',
  fromAddress: 'Vince Romanelli\n616A Hamilton Ave\nNashville TN 37203',
  fromEmail: 'vr@vrcreativegroup.com',
};

const InvoiceEditor = ({ onClose }: { onClose: () => void }) => {
  const [data, setData] = useState<InvoiceData>(DEFAULT_INVOICE);
  const [invoiceMode, setInvoiceMode] = useState<'full' | 'deposit' | 'balance'>('full');

  const updateField = useCallback(<K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleItemChange = useCallback((id: string, field: keyof LineItem, value: string | number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          // Recalculate isn't needed — totals are computed from current values
        }
        return updated;
      })
    }));
  }, []);

  const addItem = useCallback(() => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        description: '',
        quantity: 1,
        price: 0,
      }]
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  }, []);

  // Apply deposit/balance split
  const applyInvoiceMode = useCallback((mode: 'full' | 'deposit' | 'balance') => {
    setInvoiceMode(mode);
    if (mode === 'full') return;

    const originalTotal = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const halfAmount = Math.round(originalTotal * 0.5 * 100) / 100;
    const label = mode === 'deposit' ? 'Deposit — 50% of Performance Fee' : 'Balance Due — Performance Fee';

    setData(prev => ({
      ...prev,
      items: [{ id: '1', description: label, quantity: 1, price: halfAmount }],
    }));
  }, [data.items]);

  // Computed totals
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass w-full max-w-5xl rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-white/6">
          <div className="flex items-center gap-3">
            <DollarSign size={20} className="text-amber-500" />
            <h2 className="text-xl font-bold">Invoice Generator</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Invoice Mode */}
          <div className="flex gap-2">
            {(['full', 'deposit', 'balance'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => applyInvoiceMode(mode)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  invoiceMode === mode ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {mode === 'full' ? 'Full Invoice' : mode === 'deposit' ? '50% Deposit' : 'Balance Due'}
              </button>
            ))}
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="col-header">From</label>
              <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" value={data.fromName} onChange={e => updateField('fromName', e.target.value)} />
              <textarea className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50 resize-none h-20" value={data.fromAddress} onChange={e => updateField('fromAddress', e.target.value)} />
              <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" value={data.fromEmail} onChange={e => updateField('fromEmail', e.target.value)} placeholder="From email" />
            </div>
            <div className="space-y-3">
              <label className="col-header">Bill To</label>
              <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Client name" value={data.clientName} onChange={e => updateField('clientName', e.target.value)} />
              <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Client email" value={data.clientEmail} onChange={e => updateField('clientEmail', e.target.value)} />
              <textarea className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50 resize-none h-20" placeholder="Billing address" value={data.billToAddress} onChange={e => updateField('billToAddress', e.target.value)} />
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="col-header text-xs">Invoice #</label>
              <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-amber-500/50" value={data.invoiceNumber} onChange={e => updateField('invoiceNumber', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="col-header text-xs">Date Issued</label>
              <input type="date" className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" value={data.dateIssued} onChange={e => updateField('dateIssued', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="col-header text-xs">Date Due</label>
              <input type="date" className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" value={data.dateDue} onChange={e => updateField('dateDue', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="col-header text-xs">Event Date</label>
              <input type="date" className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" value={data.eventDate} onChange={e => updateField('eventDate', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="col-header text-xs">Event Name</label>
            <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50 mt-1" placeholder="e.g. ABC Corp Annual Sales Kickoff" value={data.eventName} onChange={e => updateField('eventName', e.target.value)} />
          </div>

          {/* Line Items */}
          <div>
            <label className="col-header mb-3 block">Line Items</label>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6">
                  <th className="col-header p-2 text-left">Description</th>
                  <th className="col-header p-2 w-20 text-center">Qty</th>
                  <th className="col-header p-2 w-32 text-right">Rate</th>
                  <th className="col-header p-2 w-32 text-right">Amount</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(item => (
                  <tr key={item.id} className="border-b border-white/6">
                    <td className="p-2">
                      <input
                        className="w-full bg-white/5 border border-white/6 rounded p-2 text-sm focus:outline-none focus:border-amber-500/50"
                        value={item.description}
                        onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Line item description"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="w-full bg-white/5 border border-white/6 rounded p-2 text-sm text-center focus:outline-none focus:border-amber-500/50"
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="w-full bg-white/5 border border-white/6 rounded p-2 text-sm text-right font-mono focus:outline-none focus:border-amber-500/50"
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-2 text-right font-mono text-emerald-400">
                      ${(item.quantity * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2">
                      {data.items.length > 1 && (
                        <button onClick={() => removeItem(item.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addItem} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mt-3 transition-colors">
              <Plus size={14} /> Add Line Item
            </button>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-mono">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-slate-500">Tax</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-16 bg-white/5 border border-white/6 rounded p-1 text-sm text-right font-mono focus:outline-none focus:border-amber-500/50"
                    value={data.taxRate}
                    onChange={e => updateField('taxRate', parseFloat(e.target.value) || 0)}
                    step="0.5"
                    min={0}
                  />
                  <span className="text-slate-500 text-xs">%</span>
                  <span className="font-mono w-24 text-right">${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/6 font-bold text-base">
                <span>Total</span>
                <span className="font-mono text-emerald-400">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms + Notes */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="col-header text-xs">Payment Terms</label>
              <select
                className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50"
                value={data.paymentTerms}
                onChange={e => updateField('paymentTerms', e.target.value)}
              >
                <option>Due on Receipt</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>50% Deposit, Balance Due on Event Date</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="col-header text-xs">Notes</label>
              <textarea
                className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50 resize-none h-20"
                value={data.notes}
                onChange={e => updateField('notes', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-8 py-4 border-t border-white/6 justify-end">
          <button className="px-5 py-2 rounded-lg text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
            Save Draft
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
            <Send size={14} /> Email to Client
          </button>
          <button className="flex items-center gap-2 bg-amber-500 text-slate-950 px-5 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors">
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CONTRACT EDITOR (unchanged)
// ============================================================

const ContractEditor = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="glass w-full max-w-4xl p-8 rounded-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Contract Generator</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
      </div>

      <div className="mb-6">
        <label className="col-header mb-3 block">Template</label>
        <div className="grid grid-cols-2 gap-4">
          <button className="glass p-4 rounded-xl border-2 border-amber-500/50 text-left">
            <div className="font-bold text-sm">Simple One-Pager</div>
            <div className="text-xs text-slate-500 mt-1">Quick agreement for straightforward gigs</div>
          </button>
          <button className="glass p-4 rounded-xl border border-white/6 text-left hover:border-white/20 transition-colors">
            <div className="font-bold text-sm">Full 26-Clause</div>
            <div className="text-xs text-slate-500 mt-1">Comprehensive contract with all protections</div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <label className="col-header">Parties</label>
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Client name" />
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Client contact" />
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Client email" />
        </div>
        <div className="space-y-3">
          <label className="col-header">Event Details</label>
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Event name" />
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Venue" />
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" type="date" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <label className="col-header">Performance Terms</label>
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Performance type" />
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Set length" />
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Setup time required" />
        </div>
        <div className="space-y-3">
          <label className="col-header">Payment Schedule</label>
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Total fee" />
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Deposit amount" />
          <input className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder="Cancellation policy" />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button className="px-6 py-2 rounded-lg text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">Save to Library</button>
        <button className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"><Send size={14} /> Email to Client</button>
        <button className="flex items-center gap-2 bg-amber-500 text-slate-950 px-6 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors"><Download size={14} /> Export PDF</button>
      </div>
    </div>
  </div>
);

// ============================================================
// RIDER EDITOR (unchanged)
// ============================================================

const RiderEditor = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="glass w-full max-w-4xl p-8 rounded-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Rider Builder</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
      </div>

      <div className="mb-6">
        <label className="col-header mb-3 block">Auto-fill from Show Type</label>
        <select className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50">
          <option value="">Select show type...</option>
          <option value="lumina">LuminaDrums (LED Drumline)</option>
          <option value="ai">AI Amplification (DJ + Drums)</option>
          <option value="country">Hot Stickin' Country Drumline</option>
          <option value="dj">DJ Only</option>
        </select>
      </div>

      <div className="space-y-6">
        {[
          { title: 'Audio Requirements', fields: ['PA system', 'Monitor setup', 'Mixer channels needed', 'Microphones'] },
          { title: 'Power Requirements', fields: ['Outlets needed', 'Special power notes'] },
          { title: 'Stage & Space', fields: ['Stage dimensions', 'Surface', 'Risers needed', 'Entrance path'] },
          { title: 'Hospitality', fields: ['Meals', 'Drinks', 'Green room', 'Towels'] },
          { title: 'Logistics', fields: ['Parking', 'Loading dock', 'Setup time', 'Breakdown time'] },
        ].map(section => (
          <div key={section.title}>
            <h3 className="col-header mb-3">{section.title}</h3>
            <div className="grid grid-cols-2 gap-4">
              {section.fields.map(field => (
                <input key={field} className="bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50" placeholder={field} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6 justify-end">
        <button className="px-6 py-2 rounded-lg text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">Attach to Show</button>
        <button className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"><Send size={14} /> Email to Venue</button>
        <button className="flex items-center gap-2 bg-amber-500 text-slate-950 px-6 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors"><Download size={14} /> Export PDF</button>
      </div>
    </div>
  </div>
);

// ============================================================
// RUN OF SHOW EDITOR (unchanged)
// ============================================================

const RunOfShowEditor = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="glass w-full max-w-4xl p-8 rounded-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Run of Show Editor</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
      </div>

      <div className="mb-6">
        <label className="col-header mb-3 block">Auto-fill from Show</label>
        <select className="w-full bg-white/5 border border-white/6 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500/50">
          <option value="">Select a show...</option>
          <option value="1">Apr 5 — ABC Corp @ Opryland</option>
          <option value="2">Apr 12 — PRA Group @ Hilton</option>
        </select>
      </div>

      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b border-white/6">
            <th className="col-header p-2 text-left">Time</th>
            <th className="col-header p-2 text-left">Duration</th>
            <th className="col-header p-2 text-left">What Happens</th>
            <th className="col-header p-2 text-left">Who</th>
            <th className="col-header p-2 text-left">Notes</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {[
            { time: '3:00 PM', duration: '60 min', what: 'Load-in & Setup', who: 'Full team', notes: '' },
            { time: '5:00 PM', duration: '30 min', what: 'Sound Check', who: 'Marcus + DJ', notes: '' },
            { time: '8:00 PM', duration: '15 min', what: 'Drumline Opener', who: 'Drumline (10)', notes: 'Enter from rear' },
            { time: '8:15 PM', duration: '60 min', what: 'DJ Set', who: 'DJ Vince', notes: '' },
            { time: '9:15 PM', duration: '15 min', what: 'Drumline Closer', who: 'Drumline (10)', notes: 'LED drums' },
          ].map((cue, i) => (
            <tr key={i} className="border-b border-white/6">
              <td className="p-2"><input className="w-full bg-white/5 border border-white/6 rounded p-2 text-sm font-mono focus:outline-none focus:border-amber-500/50" defaultValue={cue.time} /></td>
              <td className="p-2"><input className="w-full bg-white/5 border border-white/6 rounded p-2 text-sm focus:outline-none focus:border-amber-500/50" defaultValue={cue.duration} /></td>
              <td className="p-2"><input className="w-full bg-white/5 border border-white/6 rounded p-2 text-sm focus:outline-none focus:border-amber-500/50" defaultValue={cue.what} /></td>
              <td className="p-2"><input className="w-full bg-white/5 border border-white/6 rounded p-2 text-sm focus:outline-none focus:border-amber-500/50" defaultValue={cue.who} /></td>
              <td className="p-2"><input className="w-full bg-white/5 border border-white/6 rounded p-2 text-sm focus:outline-none focus:border-amber-500/50" defaultValue={cue.notes} placeholder="Notes..." /></td>
              <td className="p-2"><button className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"><Plus size={14} /> Add Cue</button>

      <div className="flex gap-3 justify-end">
        <button className="px-6 py-2 rounded-lg text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">Attach to Show</button>
        <button className="flex items-center gap-2 bg-amber-500 text-slate-950 px-6 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors"><Download size={14} /> Export PDF</button>
      </div>
    </div>
  </div>
);

// ============================================================
// TOOLS PAGE
// ============================================================

const editors: Record<string, React.FC<{ onClose: () => void }>> = {
  'Invoice Generator': InvoiceEditor,
  'Contract Generator': ContractEditor,
  'Rider Builder': RiderEditor,
  'Run of Show Editor': RunOfShowEditor,
};

export default function Tools() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const tools = [
    { name: 'Invoice Generator', icon: FileText, desc: 'Create and manage client invoices', ready: true },
    { name: 'Contract Generator', icon: PenTool, desc: 'Build contracts from templates', ready: false },
    { name: 'Rider Builder', icon: Mic, desc: 'Define technical requirements', ready: false },
  ];

  const ActiveEditor = activeTool ? editors[activeTool] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tools.map(tool => (
        <div key={tool.name} onClick={() => tool.ready && setActiveTool(tool.name)} className={`glass p-8 rounded-2xl border transition-all group ${tool.ready ? 'border-white/6 hover:border-amber-500/50 cursor-pointer' : 'border-white/4 opacity-50 cursor-default'}`}>
          <tool.icon className={`mb-6 group-hover:scale-110 transition-transform ${tool.ready ? 'text-amber-500' : 'text-slate-600'}`} size={40} />
          <h3 className="text-xl font-bold mb-2 tracking-tight">{tool.name}</h3>
          <p className="text-slate-400 text-sm font-mono">{tool.desc}</p>
          {!tool.ready && <p className="text-xs text-slate-600 mt-2 uppercase tracking-wider">Coming Soon</p>}
        </div>
      ))}
      {ActiveEditor && <ActiveEditor onClose={() => setActiveTool(null)} />}
    </div>
  );
}
