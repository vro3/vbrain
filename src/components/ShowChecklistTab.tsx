/**
 * ShowChecklistTab — Onboarding checklist from show_checklists Firestore.
 * Toggle items, add new items, grouped by category.
 * Created: 2026-04-01
 */

import { useState } from 'react';
import { Plus, Trash2, CheckSquare } from 'lucide-react';
import { updateChecklistItem, addChecklistItem, deleteChecklistItem } from '../lib/firestoreService';
import type { ShowChecklist, ChecklistItemPriority } from '../types/show';

interface Props {
  checklist: ShowChecklist | null;
  showId: string;
}

const priorityStyle: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-400',
  high: 'bg-amber-500/10 text-amber-400',
  medium: 'bg-slate-500/10 text-slate-400',
  low: 'bg-slate-500/10 text-slate-500',
};

export default function ShowChecklistTab({ checklist, showId }: Props) {
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState<ChecklistItemPriority>('medium');
  const [adding, setAdding] = useState(false);

  const items = checklist?.items || [];
  const completed = items.filter((i) => i.status === 'completed').length;
  const total = items.length;

  // Group by category
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category || 'General';
    (acc[cat] = acc[cat] || []).push(item);
    return acc;
  }, {});

  const toggleItem = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateChecklistItem(showId, itemId, {
      status: newStatus as any,
      ...(newStatus === 'completed' ? { completedAt: new Date().toISOString() } : { completedAt: undefined }),
    });
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    await addChecklistItem(showId, {
      label: newLabel.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'pending',
    });
    setNewLabel('');
    setAdding(false);
  };

  const handleDelete = async (itemId: string) => {
    await deleteChecklistItem(showId, itemId);
  };

  const seedDefaults = async () => {
    const defaults = [
      { label: 'Send W9 to client', category: 'documents', priority: 'high' as const, status: 'pending' as const },
      { label: 'Send deposit invoice', category: 'finance', priority: 'high' as const, status: 'pending' as const },
      { label: 'Deposit received', category: 'finance', priority: 'high' as const, status: 'pending' as const },
      { label: 'Contract signed', category: 'documents', priority: 'high' as const, status: 'pending' as const },
      { label: 'Send performer inquiries', category: 'performers', priority: 'medium' as const, status: 'pending' as const },
      { label: 'Confirm roster', category: 'performers', priority: 'medium' as const, status: 'pending' as const },
      { label: 'Send rider to venue', category: 'logistics', priority: 'medium' as const, status: 'pending' as const },
      { label: 'Confirm load-in time', category: 'logistics', priority: 'medium' as const, status: 'pending' as const },
      { label: 'Send balance invoice', category: 'finance', priority: 'medium' as const, status: 'pending' as const },
      { label: 'Balance received', category: 'finance', priority: 'medium' as const, status: 'pending' as const },
    ];
    for (const item of defaults) {
      await addChecklistItem(showId, item);
    }
  };

  if (total === 0) {
    return (
      <div className="p-6 text-center py-16">
        <CheckSquare size={32} className="mx-auto mb-4 text-slate-600" />
        <p className="text-sm text-slate-500">No checklist items yet.</p>
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={seedDefaults}
            className="text-xs bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-bold hover:bg-amber-400"
          >
            Load Default Checklist
          </button>
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-slate-400 hover:text-white bg-white/5 px-4 py-2 rounded-lg"
          >
            Start Empty
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Progress bar */}
      {total > 0 && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{completed} of {total} completed</span>
            <span>{Math.round((completed / total) * 100)}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Grouped items */}
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category}>
          <h4 className="col-header mb-2">{category}</h4>
          <div className="space-y-1">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors ${
                  item.status === 'completed' ? 'opacity-60' : ''
                }`}
              >
                <label className="flex items-center gap-3 cursor-pointer text-sm flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={item.status === 'completed'}
                    onChange={() => toggleItem(item.id, item.status)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  <span className={item.status === 'completed' ? 'line-through text-slate-500' : ''}>
                    {item.label}
                  </span>
                </label>
                <div className="flex items-center gap-2 shrink-0">
                  {item.priority && (
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${priorityStyle[item.priority] || priorityStyle.medium}`}>
                      {item.priority}
                    </span>
                  )}
                  {item.completedAt && (
                    <span className="text-xs text-slate-500">{new Date(item.completedAt).toLocaleDateString()}</span>
                  )}
                  <button onClick={() => handleDelete(item.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add item */}
      <div className="flex gap-2 pt-2 border-t border-white/6">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add checklist item..."
          className="flex-1 bg-white/5 border border-white/6 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500/50"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="bg-white/5 border border-white/6 rounded-lg px-2 text-xs focus:outline-none"
        >
          <option value="general">General</option>
          <option value="documents">Documents</option>
          <option value="performers">Performers</option>
          <option value="logistics">Logistics</option>
          <option value="finance">Finance</option>
          <option value="communication">Communication</option>
        </select>
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as ChecklistItemPriority)}
          className="bg-white/5 border border-white/6 rounded-lg px-2 text-xs focus:outline-none"
        >
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={!newLabel.trim() || adding}
          className="bg-amber-500 text-slate-950 px-3 py-2 rounded-lg font-bold text-sm disabled:opacity-40"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
