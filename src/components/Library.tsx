/**
 * Library — Real items from Firestore library collection.
 * Created: 2026-04-01 | Wired to Firestore: 2026-04-01
 */

import { useState, useEffect } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { db } from '../lib/firebase-client';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface LibraryItem {
  id: string;
  title: string;
  content?: string;
  type?: string;
  tags?: string[];
  url?: string;
  createdAt?: string;
}

export default function Library() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'library'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as LibraryItem)));
    });
    return () => unsub();
  }, []);

  const filtered = search
    ? items.filter(i =>
        i.title?.toLowerCase().includes(search.toLowerCase()) ||
        i.content?.toLowerCase().includes(search.toLowerCase()) ||
        i.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : items;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-white/6 rounded-lg p-2 pl-10"
            placeholder="Search your library..."
          />
        </div>
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-12">
          {search ? 'No items match your search.' : 'No library items yet.'}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-white/6 hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-sm">{item.title || 'Untitled'}</h3>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
            {item.content && (
              <p className="text-xs text-slate-400 mb-3 line-clamp-3">{item.content}</p>
            )}
            <div className="flex gap-2 flex-wrap mb-2">
              {item.tags?.map(tag => (
                <span key={tag} className="bg-slate-800 px-2 py-0.5 rounded-full text-xs text-cyan-400">{tag}</span>
              ))}
              {item.type && (
                <span className="bg-slate-800 px-2 py-0.5 rounded-full text-xs text-slate-400">{item.type}</span>
              )}
            </div>
            {item.createdAt && (
              <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
