import { Search, Plus } from 'lucide-react';

export default function Library() {
  const items = [
    { title: 'Standard Contract', tags: ['Legal', 'Template'], date: 'Apr 1' },
    { title: 'Opryland Venue Info', tags: ['Venues', 'Notes'], date: 'Mar 28' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input type="text" className="flex-1 bg-slate-900 border border-white/6 rounded-lg p-2" placeholder="Search your library..." />
        <button className="bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={16} /> Save</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.title} className="bg-slate-900 p-4 rounded-xl border border-white/6">
            <h3 className="font-bold mb-2">{item.title}</h3>
            <div className="flex gap-2 mb-4">
              {item.tags.map(tag => <span key={tag} className="bg-slate-800 px-2 py-0.5 rounded-full text-xs text-cyan-400">{tag}</span>)}
            </div>
            <div className="text-xs text-slate-400">{item.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
