/**
 * RosterImport — Paste roster CSV from ShowSync, writes directly to Firestore.
 * Bypasses the broken sync. Matches by linkedShowId.
 * Created: 2026-04-01
 */

import { useState } from 'react';
import { Upload, Loader2, Check, AlertTriangle } from 'lucide-react';
import { db } from '../lib/firebase-client';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split('\t').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split('\t');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
    return row;
  }).filter(r => r.ShowID && r.PerformerName);
}

function deriveStatus(row: Record<string, string>): string {
  if (row.ConfirmationResponse === 'Confirmed') return 'confirmed';
  if (row.OfferResponse === 'Declined') return 'declined';
  if (row.InquiryResponse === 'Unavailable') return 'unavailable';
  if (row.OfferResponse === 'Accepted') return 'offered';
  if (row.OfferSentAt) return 'offered';
  return 'inquired';
}

export default function RosterImport() {
  const [csv, setCsv] = useState('');
  const [status, setStatus] = useState<'idle' | 'importing' | 'done' | 'error'>('idle');
  const [log, setLog] = useState<string[]>([]);

  const handleImport = async () => {
    setStatus('importing');
    setLog([]);
    const rows = parseCSV(csv);
    if (rows.length === 0) {
      setLog(['No valid rows found. Make sure you paste tab-separated data with headers.']);
      setStatus('error');
      return;
    }

    setLog(prev => [...prev, `Parsed ${rows.length} roster rows`]);

    // Group by ShowID
    const byShow = new Map<string, Record<string, string>[]>();
    rows.forEach(r => {
      const list = byShow.get(r.ShowID) || [];
      list.push(r);
      byShow.set(r.ShowID, list);
    });

    setLog(prev => [...prev, `Found ${byShow.size} unique shows`]);

    // Load all show_intelligence docs to map linkedShowId -> docId
    const snap = await getDocs(collection(db, 'show_intelligence'));
    const showMap = new Map<string, string>();
    snap.docs.forEach(d => {
      const lid = d.data().linkedShowId;
      if (lid) showMap.set(lid, d.id);
    });

    setLog(prev => [...prev, `Loaded ${showMap.size} Firestore shows with linkedShowId`]);

    let updated = 0;
    let skipped = 0;

    for (const [showId, performers] of byShow) {
      const docId = showMap.get(showId);
      if (!docId) {
        setLog(prev => [...prev, `SKIP: ${showId} — no matching Firestore doc`]);
        skipped++;
        continue;
      }

      const rosterPerformers = performers.map(r => {
        const obj: Record<string, any> = {
          name: r.PerformerName,
          status: deriveStatus(r),
          pay: r.Pay || '',
          email: r.PerformerEmail || undefined,
          performerId: r.PerformerID || undefined,
        };
        // Only include non-empty tracking fields
        const trackingFields = [
          ['inquirySentAt', 'InquirySentAt'],
          ['inquiryOpenedAt', 'InquiryOpenedAt'],
          ['inquiryResponse', 'InquiryResponse'],
          ['inquiryRespondedAt', 'InquiryRespondedAt'],
          ['offerSentAt', 'OfferSentAt'],
          ['offerOpenedAt', 'OfferOpenedAt'],
          ['offerResponse', 'OfferResponse'],
          ['offerRespondedAt', 'OfferRespondedAt'],
          ['confirmationSentAt', 'ConfirmationSentAt'],
          ['confirmationOpenedAt', 'ConfirmationOpenedAt'],
          ['confirmationResponse', 'ConfirmationResponse'],
          ['confirmationRespondedAt', 'ConfirmationRespondedAt'],
        ] as const;

        for (const [key, csvKey] of trackingFields) {
          if (r[csvKey]) obj[key] = r[csvKey];
        }

        // Strip undefined values (Firestore rejects them)
        return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));
      });

      const confirmed = rosterPerformers.filter(p => p.status === 'confirmed').length;
      const declined = rosterPerformers.filter(p => p.status === 'declined' || p.status === 'unavailable').length;

      const roster = {
        totalPerformers: rosterPerformers.length,
        confirmed,
        declined,
        pending: rosterPerformers.length - confirmed - declined,
        performers: rosterPerformers,
      };

      try {
        await updateDoc(doc(db, 'show_intelligence', docId), {
          roster,
          updatedAt: new Date().toISOString(),
        });
        setLog(prev => [...prev, `OK: ${showId} → ${rosterPerformers.length} performers (${confirmed} confirmed)`]);
        updated++;
      } catch (err: any) {
        setLog(prev => [...prev, `ERROR: ${showId} — ${err.message}`]);
      }
    }

    setLog(prev => [...prev, `Done! Updated ${updated}, skipped ${skipped}`]);
    setStatus('done');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="col-header mb-2">Import Roster from ShowSync</h3>
        <p className="text-xs text-slate-500 mb-3">
          Paste the full Roster tab from ShowSync (tab-separated with headers). This writes directly to Firestore — no sync needed.
        </p>
        <textarea
          value={csv}
          onChange={e => setCsv(e.target.value)}
          rows={8}
          placeholder="ShowID&#9;ShowName&#9;ShowDate&#9;ClientName&#9;PerformerID&#9;PerformerName&#9;PerformerEmail&#9;Pay&#9;InquirySentAt&#9;..."
          className="w-full bg-white/5 border border-white/6 rounded-xl p-4 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleImport}
          disabled={!csv.trim() || status === 'importing'}
          className="flex items-center gap-2 bg-amber-500 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-amber-400 transition-colors"
        >
          {status === 'importing' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {status === 'importing' ? 'Importing...' : 'Import Roster'}
        </button>
        {status === 'done' && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check size={14} /> Complete</span>}
        {status === 'error' && <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={14} /> Error</span>}
      </div>

      {log.length > 0 && (
        <div className="bg-slate-950 border border-white/6 rounded-xl p-4 max-h-60 overflow-y-auto">
          {log.map((line, i) => (
            <div key={i} className={`text-xs font-mono ${line.startsWith('ERROR') ? 'text-red-400' : line.startsWith('SKIP') ? 'text-amber-400' : line.startsWith('OK') ? 'text-emerald-400' : 'text-slate-400'}`}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
