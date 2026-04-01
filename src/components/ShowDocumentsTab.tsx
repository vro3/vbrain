/**
 * ShowDocumentsTab — Linked files from show_intelligence.files[].
 * Read-only grid with type icons and external links.
 * Created: 2026-04-01
 */

import { FileText, ExternalLink, File, Shield, Receipt, Map, Clock } from 'lucide-react';
import type { ShowIntelligence, ShowFile } from '../types/show';

interface Props {
  show: ShowIntelligence;
}

const typeIcon: Record<string, any> = {
  contract: FileText,
  rider: File,
  invoice: Receipt,
  w9: Shield,
  coi: Shield,
  schedule: Clock,
  map: Map,
  other: File,
};

const typeBadgeColor: Record<string, string> = {
  contract: 'bg-amber-500/10 text-amber-400',
  rider: 'bg-cyan-500/10 text-cyan-400',
  invoice: 'bg-emerald-500/10 text-emerald-400',
  w9: 'bg-slate-500/10 text-slate-400',
  coi: 'bg-purple-500/10 text-purple-400',
  schedule: 'bg-blue-500/10 text-blue-400',
  map: 'bg-blue-500/10 text-blue-400',
  other: 'bg-slate-500/10 text-slate-400',
};

export default function ShowDocumentsTab({ show }: Props) {
  const files = show.files || [];

  if (files.length === 0) {
    return (
      <div className="p-6 text-center py-16">
        <FileText size={32} className="mx-auto mb-4 text-slate-600" />
        <p className="text-sm text-slate-500">No documents linked to this show yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {files.map((file, i) => {
          const Icon = typeIcon[file.type] || File;
          return (
            <a
              key={i}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass p-4 rounded-xl text-center hover:border-amber-500/50 border border-white/6 transition-colors group"
            >
              <Icon className="mx-auto mb-2 text-cyan-400 group-hover:text-amber-400 transition-colors" size={24} />
              <div className="text-xs font-bold truncate mb-2">{file.title}</div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${typeBadgeColor[file.type] || typeBadgeColor.other}`}>
                {file.type}
              </span>
              <ExternalLink size={10} className="mx-auto mt-2 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
