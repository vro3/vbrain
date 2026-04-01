/**
 * Home — Dashboard landing with Jarvince chat and upcoming shows.
 * Chat wired to brain_requests Firestore queue.
 * Supports file drag-and-drop with comments for Brain processing.
 * Created: 2026-04-01
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus, Loader2, AlertTriangle, Paperclip, X, FileText, Image, File as FileIcon, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SmartCreateModal from './SmartCreateModal';
import { useBrainRequest } from '../hooks/useBrainRequest';
import { db } from '../lib/firebase-client';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { uploadFiles, type UploadedFile } from '../lib/fileUploadService';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  attachments?: UploadedFile[];
}

interface StagedFile {
  file: File;
  preview?: string;
}

interface UpcomingShow {
  id: string;
  date: string;
  showType: string;
  client: string;
  venue: string;
  status: string;
}

function fileIcon(type: string) {
  if (type.startsWith('image/')) return <Image size={14} className="text-cyan-400" />;
  if (type === 'application/pdf') return <FileText size={14} className="text-red-400" />;
  return <FileIcon size={14} className="text-slate-400" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'ai', content: 'Hey Vince. What should we work on?' }
  ]);
  const [input, setInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shows, setShows] = useState<UpcomingShow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'inquiry'>('all');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
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
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const items: UpcomingShow[] = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          date: d.showDate || '',
          showType: d.eventType || d.eventName || '',
          client: d.clientName || d.matchKeys?.clientName || '',
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

  // --- File handling ---

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles = Array.from(files).map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setStagedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setStagedFiles(prev => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  // --- Send ---

  const handleSend = useCallback(async () => {
    const text = input.trim();
    const hasFiles = stagedFiles.length > 0;
    if (!text && !hasFiles) return;

    setInput('');
    const filesToUpload = [...stagedFiles];
    setStagedFiles([]);

    // Build user message
    const fileNames = filesToUpload.map(f => f.file.name);
    const displayContent = [
      text,
      fileNames.length > 0 ? `[Attached: ${fileNames.join(', ')}]` : '',
    ].filter(Boolean).join('\n');

    setMessages(prev => [...prev, {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: displayContent,
    }]);

    try {
      let uploaded: UploadedFile[] = [];

      // Upload files if any
      if (filesToUpload.length > 0) {
        setIsUploading(true);
        uploaded = await uploadFiles(filesToUpload.map(f => f.file));
        setIsUploading(false);
      }

      // Clean up previews
      filesToUpload.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });

      // Build brain request
      const hasAttachments = uploaded.length > 0;
      const prompt = hasAttachments
        ? `${text || 'Process these files'}\n\nAttached files:\n${uploaded.map(f => `- ${f.name} (${f.type}): ${f.url}`).join('\n')}`
        : text;

      await brain.sendRequest({
        type: hasAttachments ? 'action' : 'query',
        prompt,
        ...(hasAttachments && {
          context: {
            attachments: uploaded.map(f => ({ name: f.name, url: f.url, type: f.type, size: f.size })),
            attachmentComment: text || undefined,
          },
        }),
      });
    } catch (err: any) {
      setIsUploading(false);
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_err`,
        role: 'system',
        content: `Failed to send: ${err.message}`,
      }]);
    }
  }, [input, stagedFiles, brain]);

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

  const isBusy = brain.isWorking || isUploading;

  return (
    <div className="dashboard-grid gap-6 h-[calc(100vh-120px)]">
      {/* Jarvince Chat */}
      <div
        className={`col-span-12 lg:col-span-7 flex flex-col glass rounded-2xl p-6 relative transition-colors h-[calc(100vh-120px)] overflow-hidden ${isDragging ? 'ring-2 ring-amber-500/50 bg-amber-500/5' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-950/60 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-amber-400">
              <Upload size={40} className="animate-bounce" />
              <p className="text-sm font-bold">Drop files here</p>
              <p className="text-xs text-amber-400/60">PDF, images, text — Brain will process them</p>
            </div>
          </div>
        )}

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

        {/* Messages */}
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

          {(isBusy) && (
            <div className="p-4 rounded-xl bg-white/5 text-slate-400 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {isUploading ? 'Uploading files...' : brain.status === 'processing' ? 'Brain is processing...' : 'Brain is working...'}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Staged file chips */}
        {stagedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 px-1">
            {stagedFiles.map((sf, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs group">
                {sf.preview ? (
                  <img src={sf.preview} alt="" className="w-5 h-5 rounded object-cover" />
                ) : (
                  fileIcon(sf.file.type)
                )}
                <span className="text-slate-300 max-w-[120px] truncate">{sf.file.name}</span>
                <span className="text-slate-600">{formatSize(sf.file.size)}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-slate-600 hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-white/6">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.gif,.txt,.csv,.eml,.doc,.docx"
            className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="p-2 text-slate-500 hover:text-amber-400 transition-colors disabled:opacity-40"
            title="Attach files"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            className="flex-1 bg-transparent p-2 outline-none text-sm disabled:opacity-50"
            placeholder={stagedFiles.length > 0 ? 'Add a comment about these files...' : 'Ask Jarvince anything...'}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && stagedFiles.length === 0) || isBusy}
            className="bg-amber-500 text-slate-950 p-2 rounded-lg disabled:opacity-40 transition-opacity"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Upcoming Shows — independently scrollable */}
      <div className="col-span-12 lg:col-span-5 flex flex-col glass rounded-2xl p-6 h-[calc(100vh-120px)] overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="col-header">Upcoming Shows</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 text-slate-950 px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <Plus size={14} /> New Show
          </button>
        </div>
        <div className="flex gap-1 mb-4 shrink-0">
          {(['all', 'confirmed', 'inquiry'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-colors ${
                statusFilter === f ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {f} ({f === 'all' ? shows.length : shows.filter(s => s.status === f).length})
            </button>
          ))}
        </div>
        <div className="space-y-3 overflow-y-auto flex-1">
          {(() => {
            const filtered = statusFilter === 'all' ? shows : shows.filter(s => s.status === statusFilter);
            if (filtered.length === 0) return <p className="text-sm text-slate-500 text-center py-8">{statusFilter === 'all' ? 'No upcoming shows' : `No ${statusFilter} shows`}</p>;
            return filtered.map(show => (
            <div
              key={show.id}
              onClick={() => navigate(`/show/${show.id}`)}
              className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/6 hover:border-amber-500/50 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="font-mono text-xl text-cyan-400">{show.date}</div>
                <div>
                  <div className="font-bold tracking-tight">{show.showType || show.client || 'Untitled'}</div>
                  <div className="text-xs text-slate-400 font-mono">{show.venue}</div>
                  {show.client && show.showType && <div className="text-xs text-slate-500">{show.client}</div>}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${statusColor(show.status)}`}>
                {show.status}
              </span>
            </div>
          ));
          })()}
        </div>
      </div>

      <SmartCreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
