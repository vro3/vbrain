/**
 * ShowSettingsTab — Danger zone: delete show, system info.
 * Requires double confirmation to delete.
 * Created: 2026-04-01
 */

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase-client';
import { doc, deleteDoc } from 'firebase/firestore';
import type { ShowIntelligence } from '../types/show';

interface Props {
  show: ShowIntelligence;
}

export default function ShowSettingsTab({ show }: Props) {
  const navigate = useNavigate();
  const [confirmStep, setConfirmStep] = useState(0); // 0=idle, 1=first confirm, 2=deleting
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmStep < 1) {
      setConfirmStep(1);
      return;
    }
    setConfirmStep(2);
    setError(null);
    try {
      await deleteDoc(doc(db, 'show_intelligence', show.id));
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      setConfirmStep(0);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* System Info */}
      <div>
        <h3 className="col-header mb-4">System Info</h3>
        <div className="bg-slate-950 p-4 rounded-xl border border-white/6 font-mono text-xs space-y-1 text-slate-400">
          <p>ID: {show.id}</p>
          {show.linkedShowId && <p>ShowSync ID: {show.linkedShowId}</p>}
          {show.createdAt && <p>Created: {show.createdAt}</p>}
          {show.updatedAt && <p>Updated: {show.updatedAt}</p>}
          {show.completeness !== undefined && <p>Completeness: {show.completeness}%</p>}
          {show.sourceEmails && <p>Source emails: {show.sourceEmails.length}</p>}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/20 rounded-xl p-6 bg-red-500/5">
        <h3 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
          <AlertTriangle size={16} /> Danger Zone
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Deleting a show permanently removes it from Firestore. This does NOT remove it from ShowSync (Google Sheets) — the next sync may recreate it.
        </p>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg mb-3">{error}</p>
        )}

        {confirmStep === 0 && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-xs text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} /> Delete This Show
          </button>
        )}

        {confirmStep === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-red-300 font-bold">
              Are you sure? This will delete "{show.eventName || show.clientName || 'this show'}" permanently.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 text-xs bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-400 transition-colors"
              >
                <Trash2 size={14} /> Yes, Delete Permanently
              </button>
              <button
                onClick={() => setConfirmStep(0)}
                className="text-xs text-slate-400 hover:text-white px-4 py-2 rounded-lg bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {confirmStep === 2 && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <Loader2 size={16} className="animate-spin" /> Deleting...
          </div>
        )}
      </div>
    </div>
  );
}
