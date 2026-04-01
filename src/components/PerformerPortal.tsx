/**
 * PerformerPortal — Public page for performers (no auth required).
 * Shows upcoming shows, allows YES/NO responses via brain_requests.
 * URL: /portal?performerId=P-0001
 * Created: 2026-04-01
 */

import { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../lib/firebase-client';
import { collection, query, getDocs, doc, setDoc } from 'firebase/firestore';

interface PortalShow {
  id: string;
  eventName: string;
  showDate: string;
  venueName: string;
  venueAddress: string;
  city: string;
  state: string;
  loadInTime: string;
  performanceStartTime: string;
  performanceEndTime: string;
  notesToTalent: string;
  pay: string;
  status: string;
  performerStatus: string;
}

export default function PerformerPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const performerId = searchParams.get('performerId') || '';
  const action = searchParams.get('action');
  const responseShowId = searchParams.get('showId');
  const responseType = searchParams.get('type');
  const responseValue = searchParams.get('response');

  const [shows, setShows] = useState<PortalShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [performerName, setPerformerName] = useState('');
  const [responseBanner, setResponseBanner] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);

  // Load shows for this performer
  useEffect(() => {
    if (!performerId) { setLoading(false); return; }

    const loadShows = async () => {
      const snap = await getDocs(query(collection(db, 'show_intelligence')));
      const results: PortalShow[] = [];

      snap.docs.forEach(d => {
        const s = d.data();
        const roster = s.roster?.performers || [];
        const me = roster.find((p: any) =>
          p.performerId === performerId || p.name?.toLowerCase().includes(performerId.toLowerCase())
        );
        if (!me) return;
        if (!performerName && me.name) setPerformerName(me.name);

        results.push({
          id: d.id,
          eventName: s.eventName || s.clientName || 'Show',
          showDate: s.showDate || '',
          venueName: s.venueName || '',
          venueAddress: s.venueAddress || '',
          city: s.venueCity || '',
          state: s.venueState || '',
          loadInTime: s.loadInTime || '',
          performanceStartTime: s.performanceStartTime || '',
          performanceEndTime: s.performanceEndTime || '',
          notesToTalent: s.notesToTalent || '',
          pay: me.pay || '',
          status: s.status || 'inquiry',
          performerStatus: me.status || 'inquired',
        });
      });

      results.sort((a, b) => (a.showDate || '').localeCompare(b.showDate || ''));
      setShows(results);
      setLoading(false);
    };

    loadShows();
  }, [performerId]);

  // Handle auto-response from email YES/NO click
  useEffect(() => {
    if (action !== 'respond' || !responseShowId || !responseType || !responseValue || responding) return;
    setResponding(true);

    const submitResponse = async () => {
      try {
        const brainRef = doc(collection(db, 'brain_requests'));
        await setDoc(brainRef, {
          id: brainRef.id,
          type: 'action',
          source: 'portal',
          prompt: `Record performer response: ${performerId} responded ${responseValue} to ${responseType} for show ${responseShowId}`,
          showId: responseShowId,
          context: {
            actionSteps: [{
              tool: 'update_roster',
              params: { showId: responseShowId, performerId, response: responseValue, emailType: responseType },
            }],
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
          ttl: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

        const responseText = responseValue === 'yes' ? 'accepted' : 'declined';
        setResponseBanner(`Your response has been recorded. You ${responseText} the ${responseType}.`);
        // Strip action params from URL
        setSearchParams({ performerId });
      } catch (err: any) {
        setResponseBanner(`Error: ${err.message}`);
      }
    };

    submitResponse();
  }, [action, responseShowId, responseType, responseValue, performerId]);

  if (!performerId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">VR Creative Group</h1>
          <p className="text-slate-400">Performer Portal</p>
          <p className="text-sm text-slate-600 mt-4">No performer ID provided. Check your email for the correct link.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = shows.filter(s => s.showDate >= today);
  const past = shows.filter(s => s.showDate < today);

  const statusBadge = (status: string) => {
    if (status === 'confirmed') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400">Confirmed</span>;
    if (status === 'offered') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400">Offer Pending</span>;
    if (status === 'declined' || status === 'unavailable') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400">Declined</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400">Inquiry</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">VR Creative Group</h1>
          <p className="text-slate-400 text-sm">Performer Portal</p>
          {performerName && <p className="text-lg mt-2">Welcome, {performerName}</p>}
        </div>

        {/* Response banner */}
        {responseBanner && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-6 ${responseBanner.startsWith('Error') ? 'border border-red-500/30 bg-red-500/10' : 'border border-emerald-500/30 bg-emerald-500/10'}`}>
            {responseBanner.startsWith('Error') ? <AlertTriangle size={16} className="text-red-400" /> : <Check size={16} className="text-emerald-400" />}
            <p className="text-sm">{responseBanner}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-cyan-400">{upcoming.length}</div>
            <div className="text-xs text-slate-500">Upcoming Shows</div>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-emerald-400">{upcoming.filter(s => s.performerStatus === 'confirmed').length}</div>
            <div className="text-xs text-slate-500">Confirmed</div>
          </div>
        </div>

        {/* Upcoming Shows */}
        {upcoming.length === 0 && (
          <p className="text-center text-slate-500 py-8">No upcoming shows.</p>
        )}
        <div className="space-y-4">
          {upcoming.map(show => (
            <div key={show.id} className="glass rounded-2xl p-6 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{show.eventName}</h3>
                  <p className="text-sm text-slate-400 font-mono">{show.showDate}</p>
                </div>
                {statusBadge(show.performerStatus)}
              </div>

              {show.venueName && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <span>{show.venueName}</span>
                    {show.venueAddress && <span className="text-slate-500"> · {show.venueAddress}</span>}
                    {(show.city || show.state) && (
                      <span className="text-slate-500"> · {[show.city, show.state].filter(Boolean).join(', ')}</span>
                    )}
                  </div>
                </div>
              )}

              {(show.loadInTime || show.performanceStartTime) && (
                <div className="flex items-center gap-4 text-sm">
                  <Clock size={14} className="text-amber-500 shrink-0" />
                  {show.loadInTime && <span>Call: {show.loadInTime}</span>}
                  {show.performanceStartTime && <span>Show: {show.performanceStartTime}</span>}
                  {show.performanceEndTime && <span>End: {show.performanceEndTime}</span>}
                </div>
              )}

              {show.pay && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={14} className="text-emerald-400 shrink-0" />
                  <span className="font-mono text-emerald-400 font-bold">${show.pay}</span>
                </div>
              )}

              {show.notesToTalent && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-sm text-slate-300">
                  {show.notesToTalent}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Past Shows */}
        {past.length > 0 && (
          <div className="mt-8">
            <h3 className="col-header mb-4">Past Shows</h3>
            <div className="space-y-2 opacity-60">
              {past.slice(0, 5).map(show => (
                <div key={show.id} className="glass rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm">{show.eventName}</span>
                    <span className="text-xs text-slate-500 ml-2 font-mono">{show.showDate}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">${show.pay}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12 text-xs text-slate-700">
          VR Creative Group · Nashville, TN · vr@vrcreativegroup.com
        </div>
      </div>
    </div>
  );
}
