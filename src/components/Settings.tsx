/**
 * Settings — Brain status (live from Firestore) and integration status.
 * Created: 2026-04-01
 */

import { useState, useEffect } from 'react';
import { Zap, Mail, FileText, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { db } from '../lib/firebase-client';
import { collection, query, where, orderBy, limit, onSnapshot, getCountFromServer } from 'firebase/firestore';

export default function Settings() {
  const [pendingCount, setPendingCount] = useState(0);
  const [lastProcessed, setLastProcessed] = useState<string | null>(null);
  const [brainOnline, setBrainOnline] = useState<boolean | null>(null);

  // Watch brain_requests for queue depth and last processed
  useEffect(() => {
    // Count pending requests
    const pendingQuery = query(
      collection(db, 'brain_requests'),
      where('status', '==', 'pending')
    );
    const unsubPending = onSnapshot(pendingQuery, (snap) => {
      setPendingCount(snap.size);
    });

    // Get most recently completed request
    const completedQuery = query(
      collection(db, 'brain_requests'),
      where('status', '==', 'complete'),
      orderBy('completedAt', 'desc'),
      limit(1)
    );
    const unsubCompleted = onSnapshot(completedQuery, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const completedAt = data.completedAt;
        if (completedAt) {
          const date = new Date(completedAt);
          const now = new Date();
          const diffMin = Math.round((now.getTime() - date.getTime()) / 60000);
          if (diffMin < 1) setLastProcessed('Just now');
          else if (diffMin < 60) setLastProcessed(`${diffMin}m ago`);
          else if (diffMin < 1440) setLastProcessed(`${Math.round(diffMin / 60)}h ago`);
          else setLastProcessed(date.toLocaleDateString());

          // Consider brain online if last processed within 10 minutes
          setBrainOnline(diffMin < 10);
        }
      } else {
        setLastProcessed('Never');
        setBrainOnline(false);
      }
    });

    return () => { unsubPending(); unsubCompleted(); };
  }, []);

  const integrations = [
    { name: 'Google Calendar', icon: CalendarIcon, status: 'Connected', color: 'text-emerald-500' },
    { name: 'Gmail', icon: Mail, status: 'Connected', color: 'text-emerald-500' },
    { name: 'Dropbox', icon: FileText, status: 'Disconnected', color: 'text-slate-400' },
  ];

  return (
    <div className="space-y-8">
      <div className="glass p-8 rounded-2xl border border-white/6">
        <h3 className="font-bold mb-6 flex items-center gap-2"><Zap className="text-amber-500" /> Brain Status</h3>
        <div className="bg-slate-950 p-4 rounded-xl border border-white/6 font-mono text-sm space-y-1">
          <p>Engine: Claude (Chromebox Brain)</p>
          <p className={brainOnline === null ? 'text-slate-400' : brainOnline ? 'text-emerald-500' : 'text-red-400'}>
            Status: {brainOnline === null ? 'Checking...' : brainOnline ? 'Online' : 'Offline'}
            {brainOnline !== null && (
              <span className={`inline-block w-2 h-2 rounded-full ml-2 ${brainOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
            )}
          </p>
          <p className="text-slate-400">Queue: {pendingCount} pending</p>
          <p className="text-slate-400">Last processed: {lastProcessed || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {integrations.map(int => (
          <div key={int.name} className="glass p-6 rounded-2xl border border-white/6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <int.icon className="text-slate-400" />
              <span className="font-bold">{int.name}</span>
            </div>
            <span className={`text-xs font-bold uppercase ${int.color}`}>{int.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
