/**
 * SmartCreateModal — Paste text, Brain extracts show details.
 * Routes through brain_requests Firestore queue.
 * Created: 2026-04-01
 */

import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useBrainRequest } from '../hooks/useBrainRequest';

interface SmartCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'input' | 'extracting' | 'preview' | 'error';

const FIELD_LABELS: Record<string, string> = {
  showName: 'Show Name', clientName: 'Client', venueName: 'Venue',
  venueAddress: 'Address', city: 'City', state: 'State', showDate: 'Show Date',
  callTime: 'Call Time', performanceStart: 'Performance Start',
  performanceEnd: 'Performance End', onsiteContactName: 'Contact Name',
  onsiteContactPhone: 'Contact Phone', showFee: 'Show Fee',
};

export default function SmartCreateModal({ isOpen, onClose }: SmartCreateModalProps) {
  const [rawText, setRawText] = useState('');
  const [state, setState] = useState<ModalState>('input');
  const [showDetails, setShowDetails] = useState<Record<string, any> | null>(null);
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [overallConfidence, setOverallConfidence] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const brain = useBrainRequest();

  // Watch brain results
  useEffect(() => {
    if (brain.status === 'complete' && brain.result) {
      const data = brain.result.data || {};
      setShowDetails(data.showDetails || data);
      setConfidence(data.confidence || {});
      setOverallConfidence(data.overallConfidence || 0);
      setState('preview');
      brain.reset();
    } else if (brain.status === 'error') {
      setErrorMessage(brain.error || 'Brain extraction failed');
      setState('error');
      brain.reset();
    } else if (brain.isTimedOut) {
      setErrorMessage('Brain is offline — extraction timed out.');
      setState('error');
      brain.reset();
    }
  }, [brain.status, brain.result, brain.error, brain.isTimedOut]);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    setState('extracting');
    setErrorMessage('');

    try {
      await brain.sendRequest({
        type: 'smart_create',
        prompt: 'Extract show details from the pasted text',
        context: { pastedText: rawText },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send request');
      setState('error');
    }
  };

  const handleReset = () => {
    setRawText('');
    setShowDetails(null);
    setConfidence({});
    setOverallConfidence(0);
    setErrorMessage('');
    setState('input');
    brain.reset();
  };

  const handleFieldEdit = (field: string, value: string) => {
    setShowDetails(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const displayFields = showDetails
    ? Object.entries(showDetails).filter(([, v]) => v && typeof v === 'string')
    : [];

  const confidenceDot = (score: number) => {
    if (score >= 0.8) return 'bg-emerald-400';
    if (score >= 0.5) return 'bg-amber-400';
    return 'bg-red-400';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h2 className="font-bold">Smart Create</h2>
            {state === 'preview' && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                overallConfidence >= 0.8 ? 'bg-emerald-500/20 text-emerald-400' :
                overallConfidence >= 0.5 ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {Math.round(overallConfidence * 100)}% confident
              </span>
            )}
          </div>
          <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-white" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {state === 'input' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Paste contract text, email content, or proposal details. Brain will extract show details.
              </p>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                className="w-full h-48 bg-white/5 border border-white/6 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-y"
                placeholder="Paste email, contract, or describe the show..."
                autoFocus
              />
            </div>
          )}

          {state === 'extracting' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 size={32} className="text-amber-500 animate-spin" />
              <p className="text-sm text-slate-400">Brain is extracting show details...</p>
              <p className="text-xs text-slate-600">This may take 15-30 seconds</p>
            </div>
          )}

          {state === 'preview' && showDetails && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Click any field to edit before creating.</p>
              <div className="grid grid-cols-2 gap-2">
                {displayFields.map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-xl border ${
                      key.includes('Notes') ? 'col-span-2' : ''
                    } ${
                      confidence[key] !== undefined && confidence[key] < 0.5
                        ? 'border-red-500/30 bg-red-500/5'
                        : confidence[key] !== undefined && confidence[key] < 0.8
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-white/6 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {confidence[key] !== undefined && (
                        <span className={`w-2 h-2 rounded-full ${confidenceDot(confidence[key])}`} />
                      )}
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {FIELD_LABELS[key] || key}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={String(value)}
                      onChange={e => handleFieldEdit(key, e.target.value)}
                      className="w-full bg-transparent text-sm text-white border-none outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <AlertTriangle size={40} className="text-red-400" />
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/6">
          {state === 'input' && (
            <>
              <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">Cancel</button>
              <button
                onClick={handleExtract}
                disabled={!rawText.trim() || rawText.trim().length < 10}
                className="flex items-center gap-2 bg-amber-500 text-slate-950 px-5 py-2 rounded-lg text-xs font-bold disabled:opacity-40 transition-opacity"
              >
                <Sparkles size={14} /> Extract
              </button>
            </>
          )}
          {state === 'preview' && (
            <>
              <button onClick={handleReset} className="text-xs text-slate-400 hover:text-white">Back</button>
              <button className="flex items-center gap-2 bg-emerald-500 text-slate-950 px-5 py-2 rounded-lg text-xs font-bold">
                <CheckCircle2 size={14} /> Create Show
              </button>
            </>
          )}
          {state === 'error' && (
            <>
              <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">Cancel</button>
              <button onClick={handleReset} className="text-xs text-slate-400 hover:text-white bg-white/5 px-4 py-2 rounded-lg">Try Again</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
