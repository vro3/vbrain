/**
 * ShowDetail — Real show data from show_intelligence Firestore collection.
 * Created: 2026-04-01 | Wired to Firestore: 2026-04-01
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Phone, Users, FileText, DollarSign, Building2, User, Wifi, Car, Loader2, ExternalLink } from 'lucide-react';
import { db } from '../lib/firebase-client';
import { doc, onSnapshot } from 'firebase/firestore';

interface ShowData {
  id: string;
  eventName?: string;
  eventType?: string;
  clientName?: string;
  clientCompany?: string;
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueState?: string;
  ballroom?: string;
  showDate?: string;
  loadInTime?: string;
  soundCheckTime?: string;
  doorsTime?: string;
  performanceStartTime?: string;
  performanceEndTime?: string;
  breakdownTime?: string;
  parkingInstructions?: string;
  loadingDockInfo?: string;
  onsiteContact?: { name?: string; phone?: string; email?: string; role?: string };
  wifi?: { network?: string; password?: string };
  greenRoom?: string;
  setLength?: string;
  numberOfSets?: number;
  performerCount?: number;
  costumeNotes?: string;
  fee?: string;
  depositAmount?: string;
  depositDue?: string;
  balanceDue?: string;
  travelBudget?: string;
  status?: string;
  completeness?: number;
  files?: Array<{ title: string; url: string; type: string }>;
  matchKeys?: { clientName?: string; venueName?: string; date?: string };
  clientContacts?: Array<{ name?: string; phone?: string; email?: string; role?: string }>;
}

const DetailRow = ({ icon: Icon, label, value, className = '' }: { icon: any; label: string; value: string | undefined; className?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon size={16} className="text-amber-500 mt-0.5 shrink-0" />
      <div>
        <span className="text-slate-500">{label}: </span>
        <span className={className}>{value}</span>
      </div>
    </div>
  );
};

const statusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'confirmed') return 'bg-emerald-500/10 text-emerald-500';
  if (s === 'completed') return 'bg-slate-500/10 text-slate-400';
  if (s === 'cancelled') return 'bg-red-500/10 text-red-500';
  return 'bg-amber-500/10 text-amber-500';
};

export default function ShowDetail() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState<ShowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (!showId) return;
    const unsub = onSnapshot(doc(db, 'show_intelligence', showId), (snap) => {
      if (snap.exists()) {
        setShow({ id: snap.id, ...snap.data() } as ShowData);
      } else {
        setShow(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [showId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft size={16} /> Back</button>
        <div className="text-center py-24 text-slate-500">Show not found.</div>
      </div>
    );
  }

  const displayName = show.eventName || show.clientName || show.matchKeys?.clientName || 'Untitled Show';
  const venue = show.venueName || show.matchKeys?.venueName || '';
  const venueLocation = [show.venueCity, show.venueState].filter(Boolean).join(', ');
  const fullVenue = [venue, venueLocation].filter(Boolean).join(' — ');
  const contactName = show.onsiteContact?.name || '';
  const contactPhone = show.onsiteContact?.phone || '';
  const wifiStr = show.wifi ? [show.wifi.network, show.wifi.password].filter(Boolean).join(' / ') : undefined;

  const tabs = ['Overview', 'Documents', 'Contacts'];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft size={16} /> Back</button>

      <div className="glass p-6 rounded-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{displayName}</h1>
            <div className="flex gap-4 text-sm text-slate-400">
              {show.showDate && <span className="font-mono">{show.showDate}</span>}
              {fullVenue && <span>{fullVenue}</span>}
              {show.status && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${statusColor(show.status)}`}>
                  {show.status}
                </span>
              )}
            </div>
          </div>
          {show.completeness !== undefined && (
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">Completeness</div>
              <div className="text-2xl font-bold font-mono text-cyan-400">{show.completeness}%</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/6 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-bold whitespace-nowrap ${activeTab === tab ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl min-h-[300px]">
        {activeTab === 'Overview' && (
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="col-header">Times & Venue</h3>
                <div className="space-y-3">
                  <DetailRow icon={Clock} label="Performance" value={[show.performanceStartTime, show.performanceEndTime].filter(Boolean).join(' – ') || undefined} />
                  <DetailRow icon={Clock} label="Load-in" value={show.loadInTime} />
                  <DetailRow icon={Clock} label="Sound Check" value={show.soundCheckTime} />
                  <DetailRow icon={Clock} label="Doors" value={show.doorsTime} />
                  <DetailRow icon={MapPin} label="Venue" value={fullVenue || undefined} />
                  <DetailRow icon={MapPin} label="Address" value={show.venueAddress} />
                  <DetailRow icon={Building2} label="Ballroom" value={show.ballroom} />
                  <DetailRow icon={Car} label="Loading Dock" value={show.loadingDockInfo} />
                  <DetailRow icon={Car} label="Parking" value={show.parkingInstructions} />
                  <DetailRow icon={Wifi} label="WiFi" value={wifiStr} />
                  <DetailRow icon={Phone} label="On-site Contact" value={[contactName, contactPhone].filter(Boolean).join(' — ') || undefined} />
                  <DetailRow icon={Building2} label="Green Room" value={show.greenRoom} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="col-header">Business Details</h3>
                <div className="space-y-3">
                  <DetailRow icon={User} label="Client" value={show.clientName || show.matchKeys?.clientName} />
                  <DetailRow icon={Building2} label="Company" value={show.clientCompany} />
                  <DetailRow icon={User} label="Event Type" value={show.eventType} />
                  <DetailRow icon={DollarSign} label="Fee" value={show.fee} className="text-emerald-400 font-bold" />
                  <DetailRow icon={DollarSign} label="Deposit" value={show.depositAmount} />
                  <DetailRow icon={DollarSign} label="Deposit Due" value={show.depositDue} />
                  <DetailRow icon={DollarSign} label="Balance Due" value={show.balanceDue} />
                  <DetailRow icon={DollarSign} label="Travel Budget" value={show.travelBudget} />
                  <DetailRow icon={Users} label="Set Length" value={show.setLength} />
                  <DetailRow icon={Users} label="Performers" value={show.performerCount ? `${show.performerCount}` : undefined} />
                  <DetailRow icon={Users} label="Costume Notes" value={show.costumeNotes} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Documents' && (
          <div className="p-6">
            {(!show.files || show.files.length === 0) ? (
              <p className="text-sm text-slate-500 text-center py-12">No documents linked to this show yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {show.files.map((file, i) => (
                  <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="glass p-4 rounded-xl text-center hover:border-amber-500/50 border border-white/6 transition-colors">
                    <FileText className="mx-auto mb-2 text-cyan-400" />
                    <div className="text-xs font-bold truncate">{file.title}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1">{file.type}</div>
                    <ExternalLink size={12} className="mx-auto mt-2 text-slate-500" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Contacts' && (
          <div className="p-6">
            {(!show.clientContacts || show.clientContacts.length === 0) ? (
              <p className="text-sm text-slate-500 text-center py-12">No contacts extracted yet.</p>
            ) : (
              <div className="space-y-3">
                {show.clientContacts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/6">
                    <div>
                      <div className="font-bold">{c.name || 'Unknown'}</div>
                      {c.role && <div className="text-xs text-slate-400">{c.role}</div>}
                    </div>
                    <div className="text-right text-sm">
                      {c.email && <div className="text-cyan-400">{c.email}</div>}
                      {c.phone && <div className="text-slate-400">{c.phone}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
