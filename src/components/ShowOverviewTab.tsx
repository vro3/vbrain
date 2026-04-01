/**
 * ShowOverviewTab — Editable show fields with inline editing.
 * Key info (name, type, client, date, status) at top, then details below.
 * Click value → input → blur/enter autosaves to Firestore.
 * Created: 2026-04-01
 */

import React, { useState, useRef, useEffect } from 'react';
import { Clock, MapPin, Phone, Building2, User, Wifi, Car, DollarSign, Users, Check, X } from 'lucide-react';
import type { ShowIntelligence, ShowStatus } from '../types/show';

interface Props {
  show: ShowIntelligence;
  updateField: (field: string, value: any) => Promise<void>;
}

const STATUS_OPTIONS: ShowStatus[] = ['inquiry', 'quoted', 'confirmed', 'completed', 'cancelled', 'hold'];

const SHOW_TYPES = [
  'AI Amplification Experience',
  'Aurora Corps',
  'Bucket Ruckus',
  'Center Stage Karaoke',
  'DJ Drums',
  'Dueling DJ\'s',
  'Hot Stickin\' Country Drumline',
  'LuminaDrums',
  'Nashville Sound DJ',
  'rePercussion',
  'Stix One Five',
  'Ultimate Live Music Experience',
  'Vince the DJ',
];

function EditableField({
  icon: Icon,
  label,
  value,
  field,
  onSave,
  type = 'text',
  options,
  className = '',
  large = false,
}: {
  icon?: any;
  label: string;
  value: string | undefined;
  field: string;
  onSave: (field: string, value: string) => Promise<void>;
  type?: 'text' | 'date' | 'time' | 'select' | 'textarea' | 'number';
  options?: string[];
  className?: string;
  large?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value || ''); }, [value]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const save = async () => {
    setEditing(false);
    if (draft !== (value || '')) {
      try {
        await onSave(field, draft);
        setSaved(true);
        setError(false);
        setTimeout(() => setSaved(false), 1500);
      } catch {
        setError(true);
        setTimeout(() => setError(false), 3000);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') save();
    if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); }
  };

  const IconEl = Icon || User;

  if (type === 'select' && options) {
    return (
      <div className="flex items-start gap-3 text-sm">
        <IconEl size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <span className="text-slate-500">{label}: </span>
          <select
            value={draft}
            onChange={async (e) => {
              setDraft(e.target.value);
              try {
                await onSave(field, e.target.value);
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
              } catch { setError(true); setTimeout(() => setError(false), 3000); }
            }}
            className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-sm focus:outline-none focus:border-amber-500/50"
          >
            <option value="">—</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {saved && <Check size={12} className="inline ml-2 text-emerald-400" />}
          {error && <X size={12} className="inline ml-2 text-red-400" />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 text-sm group">
      <IconEl size={16} className="text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-slate-500">{label}: </span>
        {editing ? (
          type === 'textarea' ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={handleKeyDown}
              rows={2}
              className="w-full bg-white/5 border border-amber-500/50 rounded px-2 py-1 text-sm focus:outline-none mt-1"
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={handleKeyDown}
              className={`bg-white/5 border border-amber-500/50 rounded px-2 py-0.5 text-sm focus:outline-none ${large ? 'text-lg font-bold w-full' : 'w-auto'}`}
            />
          )
        ) : (
          <span
            onClick={() => setEditing(true)}
            className={`cursor-pointer hover:bg-white/5 hover:border-b hover:border-dashed hover:border-slate-500 rounded px-1 -mx-1 transition-colors ${large ? 'text-lg font-bold' : ''} ${className}`}
          >
            {value || <span className="text-slate-600 italic">Click to add</span>}
          </span>
        )}
        {saved && !editing && <Check size={12} className="inline ml-2 text-emerald-400" />}
        {error && !editing && <X size={12} className="inline ml-2 text-red-400" title="Save failed" />}
      </div>
    </div>
  );
}

export default function ShowOverviewTab({ show, updateField }: Props) {
  const wifiStr = show.wifi ? [show.wifi.network, show.wifi.password].filter(Boolean).join(' / ') : '';
  const contactStr = [show.onsiteContact?.name, show.onsiteContact?.phone].filter(Boolean).join(' — ');

  return (
    <div className="p-6 space-y-8">
      {/* Key Info — Top Section */}
      <div className="space-y-3 pb-6 border-b border-white/6">
        <h3 className="col-header">Show Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <EditableField icon={User} label="Event Name" value={show.eventName} field="eventName" onSave={updateField} large />
          <EditableField icon={User} label="Status" value={show.status} field="status" onSave={updateField} type="select" options={STATUS_OPTIONS} />
          <EditableField icon={User} label="Show Type" value={show.eventType} field="eventType" onSave={updateField} type="select" options={SHOW_TYPES} />
          <EditableField icon={Clock} label="Show Date" value={show.showDate} field="showDate" onSave={updateField} type="date" />
          <EditableField icon={User} label="Client" value={show.clientName} field="clientName" onSave={updateField} />
          <EditableField icon={Building2} label="Company" value={show.clientCompany} field="clientCompany" onSave={updateField} />
        </div>
      </div>

      {/* Two-column detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="col-header">Times & Venue</h3>
          <div className="space-y-3">
            <EditableField icon={Clock} label="Performance Start" value={show.performanceStartTime} field="performanceStartTime" onSave={updateField} type="time" />
            <EditableField icon={Clock} label="Performance End" value={show.performanceEndTime} field="performanceEndTime" onSave={updateField} type="time" />
            <EditableField icon={Clock} label="Load-in" value={show.loadInTime} field="loadInTime" onSave={updateField} type="time" />
            <EditableField icon={Clock} label="Sound Check" value={show.soundCheckTime} field="soundCheckTime" onSave={updateField} type="time" />
            <EditableField icon={Clock} label="Doors" value={show.doorsTime} field="doorsTime" onSave={updateField} type="time" />
            <EditableField icon={MapPin} label="Venue" value={show.venueName} field="venueName" onSave={updateField} />
            <EditableField icon={MapPin} label="Address" value={show.venueAddress} field="venueAddress" onSave={updateField} />
            <EditableField icon={MapPin} label="City" value={show.venueCity} field="venueCity" onSave={updateField} />
            <EditableField icon={MapPin} label="State" value={show.venueState} field="venueState" onSave={updateField} />
            <EditableField icon={Building2} label="Ballroom" value={show.ballroom} field="ballroom" onSave={updateField} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="col-header">Business & Logistics</h3>
          <div className="space-y-3">
            <EditableField icon={DollarSign} label="Fee" value={show.fee} field="fee" onSave={updateField} className="text-emerald-400 font-bold" />
            <EditableField icon={DollarSign} label="Deposit" value={show.depositAmount} field="depositAmount" onSave={updateField} />
            <EditableField icon={DollarSign} label="Deposit Due" value={show.depositDue} field="depositDue" onSave={updateField} type="date" />
            <EditableField icon={DollarSign} label="Balance Due" value={show.balanceDue} field="balanceDue" onSave={updateField} type="date" />
            <EditableField icon={DollarSign} label="Travel Budget" value={show.travelBudget} field="travelBudget" onSave={updateField} />
            <EditableField icon={Users} label="Set Length" value={show.setLength} field="setLength" onSave={updateField} />
            <EditableField icon={Users} label="Performers" value={show.performerCount?.toString()} field="performerCount" onSave={async (_, v) => updateField('performerCount', parseInt(v) || 0)} />
            <EditableField icon={Users} label="Costume Notes" value={show.costumeNotes} field="costumeNotes" onSave={updateField} type="textarea" />
            <EditableField icon={Car} label="Loading Dock" value={show.loadingDockInfo} field="loadingDockInfo" onSave={updateField} type="textarea" />
            <EditableField icon={Car} label="Parking" value={show.parkingInstructions} field="parkingInstructions" onSave={updateField} type="textarea" />
            <EditableField icon={Wifi} label="WiFi" value={wifiStr} field="wifi" onSave={async (_, v) => {
              const parts = v.split('/').map(s => s.trim());
              await updateField('wifi', { network: parts[0] || '', password: parts[1] || '' });
            }} />
            <EditableField icon={Phone} label="On-site Contact" value={contactStr} field="onsiteContact" onSave={async (_, v) => {
              const parts = v.split('—').map(s => s.trim());
              await updateField('onsiteContact', { name: parts[0] || '', phone: parts[1] || '' });
            }} />
            <EditableField icon={Building2} label="Green Room" value={show.greenRoom} field="greenRoom" onSave={updateField} />
          </div>
        </div>
      </div>
    </div>
  );
}
