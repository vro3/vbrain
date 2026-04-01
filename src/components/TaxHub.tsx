import { useState } from 'react';
import { Upload, Filter } from 'lucide-react';

export default function TaxHub() {
  const [year, setYear] = useState('2026');
  const performers = [
    { name: 'Marcus', paid: 4500, w9: 'On File', status: 'Generated' },
    { name: 'Bryce', paid: 3200, w9: 'Missing', status: 'Pending' },
  ];

  const stats = [
    { label: 'Gross Revenue', value: '$124,500', color: 'text-emerald-500' },
    { label: 'Performer Pay', value: '$82,000', color: 'text-amber-500' },
    { label: 'Net Profit', value: '$42,500', color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tax Hub {year}</h2>
        <div className="flex gap-2">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="glass p-2 rounded-lg border border-white/6 text-sm">
            <option>2026</option>
            <option>2025</option>
          </select>
          <button className="glass px-4 py-2 rounded-lg flex items-center gap-2"><Filter size={16} /> Filter</button>
          <button className="bg-amber-500 text-slate-950 px-4 py-2 rounded-lg flex items-center gap-2 font-bold"><Upload size={16} /> Import Melio CSV</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(stat => (
          <div key={stat.label} className="glass p-6 rounded-2xl border border-white/6">
            <div className="text-slate-400 text-sm mb-2">{stat.label}</div>
            <div className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/6">
            <tr>
              <th className="p-4 col-header">Performer</th>
              <th className="p-4 col-header">Paid YTD</th>
              <th className="p-4 col-header">W9 Status</th>
              <th className="p-4 col-header">1099 Status</th>
            </tr>
          </thead>
          <tbody>
            {performers.map(p => (
              <tr key={p.name} className="border-t border-white/6 hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold tracking-tight">{p.name}</td>
                <td className="p-4 font-mono text-cyan-400">${p.paid}</td>
                <td className={`p-4 text-xs uppercase tracking-wider font-bold ${p.w9 === 'Missing' ? 'text-amber-500' : 'text-emerald-500'}`}>{p.w9}</td>
                <td className="p-4 text-xs text-slate-400">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
