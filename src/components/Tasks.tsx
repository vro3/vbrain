/**
 * Tasks — Real tasks from Firestore tasks collection.
 * Created: 2026-04-01 | Wired to Firestore: 2026-04-01
 */

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase-client';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface TaskItem {
  id: string;
  title: string;
  type?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  notes?: string;
  source?: string;
}

const priorityStyle: Record<string, string> = {
  high: 'bg-red-500/20 text-red-500',
  medium: 'bg-amber-500/20 text-amber-500',
  low: 'bg-slate-500/20 text-slate-400',
};

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  'in-progress': 'bg-cyan-500/10 text-cyan-400',
  done: 'bg-emerald-500/10 text-emerald-500',
};

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'done'>('all');

  useEffect(() => {
    const q = query(
      collection(db, 'tasks'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskItem)));
    });
    return () => unsub();
  }, []);

  const toggleDone = async (task: TaskItem) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'pending', 'in-progress', 'done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === f ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {f === 'all' ? `All (${tasks.length})` : `${f} (${tasks.filter(t => t.status === f).length})`}
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-12">No tasks.</p>
      )}
      <div className="space-y-2">
        {filtered.map(task => (
          <div key={task.id} className="flex items-center gap-4 bg-slate-900 p-3 rounded-lg border border-white/6 hover:border-white/20 transition-colors">
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={() => toggleDone(task)}
              className="accent-emerald-500 w-4 h-4 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <span className={task.status === 'done' ? 'line-through text-slate-500' : ''}>{task.title}</span>
              {task.dueDate && <span className="text-xs text-slate-500 ml-2 font-mono">{task.dueDate}</span>}
              {task.notes && <p className="text-xs text-slate-500 mt-1 truncate">{task.notes}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              {task.priority && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${priorityStyle[task.priority] || priorityStyle.low}`}>
                  {task.priority}
                </span>
              )}
              {task.status && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusStyle[task.status] || statusStyle.pending}`}>
                  {task.status}
                </span>
              )}
              {task.type && (
                <span className="px-2 py-1 rounded-full text-xs bg-white/5 text-slate-400">{task.type}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
