/**
 * ShowConversationsTab — Email threads from show_conversations.
 * Expandable threads with AI summaries.
 * Created: 2026-04-01
 */

import { useState } from 'react';
import { Mail, ChevronDown, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import type { ShowConversation, ShowIntelligence } from '../types/show';

interface Props {
  conversations: ShowConversation[];
  show: ShowIntelligence;
}

const sentimentColor: Record<string, string> = {
  positive: 'text-emerald-400',
  neutral: 'text-slate-400',
  negative: 'text-red-400',
};

const urgencyColor: Record<string, string> = {
  high: 'bg-red-500/10 text-red-400',
  medium: 'bg-amber-500/10 text-amber-400',
  low: 'bg-slate-500/10 text-slate-400',
};

export default function ShowConversationsTab({ conversations, show }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center py-16">
        <Mail size={32} className="mx-auto mb-4 text-slate-600" />
        <p className="text-sm text-slate-500">No conversations linked to this show.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {conversations.map((conv) => {
        const isOpen = expanded.has(conv.id);
        const lastMsg = conv.messages?.[conv.messages.length - 1];
        const msgCount = conv.messages?.length || 0;

        return (
          <div key={conv.id} className="border border-white/6 rounded-xl overflow-hidden">
            {/* Thread header */}
            <button
              onClick={() => toggle(conv.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left"
            >
              {isOpen ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{conv.subject || 'No subject'}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {lastMsg?.from?.name || lastMsg?.from?.email || 'Unknown'} · {msgCount} message{msgCount !== 1 ? 's' : ''}
                  {conv.lastMessageAt && <span> · {new Date(conv.lastMessageAt).toLocaleDateString()}</span>}
                </div>
              </div>
              {conv.summary?.urgency && (
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${urgencyColor[conv.summary.urgency] || urgencyColor.low}`}>
                  {conv.summary.urgency}
                </span>
              )}
              {conv.summary?.sentiment && (
                <span className={`text-xs ${sentimentColor[conv.summary.sentiment]}`}>
                  {conv.summary.sentiment}
                </span>
              )}
            </button>

            {/* Expanded: messages + summary */}
            {isOpen && (
              <div className="border-t border-white/6">
                {/* AI Summary */}
                {conv.summary && (
                  <div className="p-4 bg-cyan-500/5 border-b border-white/6">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-2">AI Summary</div>
                    <p className="text-sm text-slate-300">{conv.summary.summary}</p>
                    {conv.summary.keyPoints && conv.summary.keyPoints.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {conv.summary.keyPoints.map((kp, i) => (
                          <li key={i} className="text-xs text-slate-400">• {kp}</li>
                        ))}
                      </ul>
                    )}
                    {conv.summary.openQuestions && conv.summary.openQuestions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-amber-400 font-bold mb-1">Open Questions</div>
                        {conv.summary.openQuestions.map((q, i) => (
                          <div key={i} className="text-xs text-slate-400 flex items-start gap-1">
                            <AlertCircle size={10} className="mt-0.5 text-amber-500 shrink-0" /> {q}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Messages */}
                <div className="divide-y divide-white/6">
                  {(conv.messages || []).map((msg) => (
                    <div key={msg.id} className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-xs">
                          <span className="text-slate-300 font-medium">{msg.from?.name || msg.from?.email}</span>
                          {msg.to && msg.to.length > 0 && (
                            <span className="text-slate-500"> → {msg.to.map((t) => t.name || t.email).join(', ')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={10} />
                          {new Date(msg.date).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
