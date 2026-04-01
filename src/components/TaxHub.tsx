/**
 * TaxHub — Real data from Firestore performer_payables collection.
 * Created: 2026-04-01 | Wired to Firestore: 2026-04-01
 */

import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { db } from '../lib/firebase-client';
import { collection, query, onSnapshot } from 'firebase/firestore';

interface Payable {
  id: string;
  vendorName?: string;
  performerName?: string;
  amount?: number;
  status?: string;
  showDate?: string;
  showName?: string;
  invoiceNumber?: string;
  w9Status?: string;
}

export default function TaxHub() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [payables, setPayables] = useState<Payable[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'performer_payables'));
    const unsub = onSnapshot(q, (snap) => {
      setPayables(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payable)));
    });
    return () => unsub();
  }, []);

  // Filter by year based on showDate
  const yearFiltered = payables.filter(p => {
    if (!p.showDate) return true;
    return p.showDate.startsWith(year);
  });

  // Aggregate by performer
  const performerMap = new Map<string, { paid: number; w9: string; count: number }>();
  yearFiltered.forEach(p => {
    const name = p.performerName || p.vendorName || 'Unknown';
    const existing = performerMap.get(name) || { paid: 0, w9: 'Unknown', count: 0 };
    existing.paid += p.amount || 0;
    existing.count += 1;
    if (p.w9Status) existing.w9 = p.w9Status;
    performerMap.set(name, existing);
  });

  const performers = Array.from(performerMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.paid - a.paid);

  const totalPaid = performers.reduce((sum, p) => sum + p.paid, 0);
  const needs1099 = performers.filter(p => p.paid >= 600).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tax Hub {year}</h2>
        <div className="flex gap-2">
          <select value={year} onChange={e => setYear(e.target.value)} className="glass p-2 rounded-lg border border-white/6 text-sm">
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
          </select>
          <button className="glass px-4 py-2 rounded-lg flex items-center gap-2"><Filter size={16} /> Filter</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/6">
          <div className="text-slate-400 text-sm mb-2">Total Performer Pay</div>
          <div className="text-3xl font-bold font-mono text-amber-500">${totalPaid.toLocaleString()}</div>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/6">
          <div className="text-slate-400 text-sm mb-2">Performers Paid</div>
          <div className="text-3xl font-bold font-mono text-cyan-400">{performers.length}</div>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/6">
          <div className="text-slate-400 text-sm mb-2">Need 1099 ($600+)</div>
          <div className="text-3xl font-bold font-mono text-emerald-500">{needs1099}</div>
        </div>
      </div>

      {performers.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-12">No payables for {year}.</p>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/6">
              <tr>
                <th className="p-4 col-header">Performer</th>
                <th className="p-4 col-header">Paid YTD</th>
                <th className="p-4 col-header">Payments</th>
                <th className="p-4 col-header">W9 Status</th>
                <th className="p-4 col-header">1099 Required</th>
              </tr>
            </thead>
            <tbody>
              {performers.map(p => (
                <tr key={p.name} className="border-t border-white/6 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold tracking-tight">{p.name}</td>
                  <td className="p-4 font-mono text-cyan-400">${p.paid.toLocaleString()}</td>
                  <td className="p-4 text-slate-400">{p.count}</td>
                  <td className={`p-4 text-xs uppercase tracking-wider font-bold ${
                    p.w9 === 'on_file' || p.w9 === 'On File' ? 'text-emerald-500' : 'text-amber-500'
                  }`}>{p.w9}</td>
                  <td className="p-4">
                    {p.paid >= 600 ? (
                      <span className="text-xs font-bold text-red-400">YES</span>
                    ) : (
                      <span className="text-xs text-slate-500">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
