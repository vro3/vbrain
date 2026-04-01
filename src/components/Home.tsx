/**
 * Home — Dashboard landing with Jarvince chat and upcoming shows.
 * Chat wired to brain_requests Firestore queue.
 * Created: 2026-04-01
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SmartCreateModal from './SmartCreateModal';
import { useBrainRequest } from '../hooks/useBrainRequest';
import { db } from '../lib/firebase-client';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
}

interface UpcomingShow {
  id: string;
  date: string;
  client: string;
  venue: string;
  status: string;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'ai', content: 'Hey Vince. What should we work on?' }
  ]);
  const [input, setInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shows, setShows] = useState<UpcomingShow[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const brain = useBrainRequest();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, brain.isWorking]);

  // Watch brain results
  useEffect(() => {
    if (brain.status === 'complete' && brain.result) {
      const data = brain.result.data;

      if (data?.showDetails) {
        // Smart create result
        setMessages(prev => [...prev, {
          id: `msg_${Date.now()}_brain`,
          role: 'ai',
          content: `Extracted show details:\n${Object.entries(data.showDetails)
            .filter(([, v]) => v)
            .map(([k, v]) => `  ${k}: ${v}`)
            .join('\n')}`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `msg_${Date.now()}_brain`,
          role: 'ai',
          content: brain.result!.answer || JSON.stringify(data || {}),
        }]);
      }
      brain.reset();
    } else if (brain.status === 'error') {
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_err`,
        role: 'system',
        content: `Brain error: ${brain.error}`,
      }]);
      brain.reset();
    }
  }, [brain.status, brain.result, brain.error]);

  // Load upcoming shows from show_intelligence
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'show_intelligence'),
      where('showDate', '>=', today),
      orderBy('showDate', 'asc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snap) => {
      const items: UpcomingShow[] = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          date: d.showDate || '',
          client: d.clientName || d.matchKeys?.clientName || 'Unknown',
          venue: d.venueName || d.matchKeys?.venueName || 'TBD',
          status: d.status || 'inquiry',
        };
      });
      setShows(items);
    }, (err) => {
      console.error('[Home] Failed to load shows:', err);
    });

    return () => unsub();
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    setInput('');
    setMessages(prev => [...prev, {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: text,
    }]);

    try {
      await brain.sendRequest({
        type: 'query',
        prompt: text,
      });
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_err`,
        role: 'system',
        content: `Failed to send: ${err.message}`,
      }]);
    }
  }, [input, brain]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'confirmed') return 'bg-emerald-500/10 text-emerald-500';
    if (s === 'cancelled') return 'bg-red-500/10 text-red-500';
    return 'bg-amber-500/10 text-amber-500';
  };

  return (
    <div className="dashboard-grid gap-6 h-[calc(100vh-120px)]">
      {/* Jarvince Chat */}
      <div className="col-span-12 lg:col-span-7 flex flex-col glass rounded-2xl p-6">
        {/* Brain offline banner */}
        {brain.isTimedOut && (
          <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 mb-4">
            <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-300 font-medium">Brain may be offline</p>
              <p className="text-xs text-yellow-400/70">No response in 3 minutes. Try again or check Gmail/Sheets directly.</p>
            </div>
            <button
              onClick={() => brain.reset()}
              className="px-3 py-1 text-xs text-yellow-300 border border-yellow-500/30 rounded hover:bg-yellow-500/20 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto space-y-4 mb-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-xl max-w-[80%] whitespace-pre-wrap ${
                m.role === 'ai' ? 'bg-white/5' :
                m.role === 'system' ? 'bg-red-500/10 text-red-400' :
                'bg-amber-500/10 text-amber-500 ml-auto'
              }`}
            >
              {m.content}
            </div>
          ))}

          {brain.isWorking && (
            <div className="p-4 rounded-xl bg-white/5 text-slate-400 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {brain.status === 'processing' ? 'Brain is processing...' : 'Brain is working...'}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 p-2 bg-slate-950 rounded-xl border border-white/6">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={brain.isWorking}
            className="flex-1 bg-transparent p-2 outline-none text-sm disabled:opacity-50"
            placeholder="Ask Jarvince anything..."
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || brain.isWorking}
            className="bg-amber-500 text-slate-950 p-2 rounded-lg disabled:opacity-40 transition-opacity"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Upcoming Shows */}
      <div className="col-span-12 lg:col-span-5 flex flex-col glass rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="col-header">Upcoming Shows</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 text-slate-950 px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <Plus size={14} /> New Show
          </button>
        </div>
        <div className="space-y-3 overflow-auto">
          {shows.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">No upcoming shows</p>
          )}
          {shows.map(show => (
            <div
              key={show.id}
              onClick={() => navigate(`/show/${show.id}`)}
              className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/6 hover:border-amber-500/50 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="font-mono text-xl text-cyan-400">{show.date}</div>
                <div>
                  <div className="font-bold tracking-tight">{show.client}</div>
                  <div className="text-xs text-slate-400 font-mono">{show.venue}</div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${statusColor(show.status)}`}>
                {show.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <SmartCreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
