/**
 * Calendar — Real shows from show_intelligence Firestore collection.
 * Month/Week/Day views with live data.
 * Created: 2026-04-01 | Wired to Firestore: 2026-04-01
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase-client';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

interface ShowItem {
  id: string;
  date: string;
  client: string;
  venue: string;
  status: string;
}

const statusColors: Record<string, string> = {
  inquiry: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  quoted: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  completed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
};

type View = 'month' | 'week' | 'day';

export default function Calendar() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shows, setShows] = useState<ShowItem[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Load shows for the visible date range
  useEffect(() => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 2, 0); // buffer into next month
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const q = query(
      collection(db, 'show_intelligence'),
      where('showDate', '>=', startStr),
      where('showDate', '<=', endStr),
      orderBy('showDate', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setShows(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          date: data.showDate || '',
          client: data.clientName || data.matchKeys?.clientName || 'Unknown',
          venue: data.venueName || data.matchKeys?.venueName || '',
          status: data.status || 'inquiry',
        };
      }));
    });
    return () => unsub();
  }, [year, month]);

  const prev = () => {
    if (view === 'month') setCurrentDate(new Date(year, month - 1, 1));
    else if (view === 'week') setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000));
    else setCurrentDate(new Date(currentDate.getTime() - 86400000));
  };

  const next = () => {
    if (view === 'month') setCurrentDate(new Date(year, month + 1, 1));
    else if (view === 'week') setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000));
    else setCurrentDate(new Date(currentDate.getTime() + 86400000));
  };

  const getShowsForDate = (dateStr: string) => shows.filter(s => s.date === dateStr);

  const formatDateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-white/5"><ChevronLeft size={20} /></button>
          <h2 className="text-2xl font-bold tracking-tight">{monthName}</h2>
          <button onClick={next} className="p-2 rounded-lg hover:bg-white/5"><ChevronRight size={20} /></button>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(['month', 'week', 'day'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-colors ${view === v ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="col-header p-3 border-b border-white/6">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="p-2 min-h-[100px] border-b border-r border-white/6 bg-white/[0.01]" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = formatDateStr(day);
              const dayShows = getShowsForDate(dateStr);
              return (
                <div key={day} className={`p-2 min-h-[100px] border-b border-r border-white/6 hover:bg-white/[0.03] transition-colors ${isToday(day) ? 'bg-cyan-500/5' : ''}`}>
                  <span className={`text-xs font-bold ${isToday(day) ? 'text-cyan-400' : 'text-slate-500'}`}>{day}</span>
                  <div className="mt-1 space-y-1">
                    {dayShows.map(show => (
                      <button key={show.id} onClick={() => navigate(`/show/${show.id}`)} className={`w-full text-left text-xs px-2 py-1 rounded border truncate ${statusColors[show.status] || statusColors.inquiry}`}>
                        {show.client}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7">
            {getWeekDays().map(day => {
              const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
              const dayShows = getShowsForDate(dateStr);
              const isCurrentDay = day.toDateString() === today.toDateString();
              return (
                <div key={dateStr} className={`p-4 min-h-[300px] border-r border-white/6 ${isCurrentDay ? 'bg-cyan-500/5' : ''}`}>
                  <div className="text-center mb-4">
                    <div className="col-header">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className={`text-2xl font-bold ${isCurrentDay ? 'text-cyan-400' : 'text-slate-300'}`}>{day.getDate()}</div>
                  </div>
                  <div className="space-y-2">
                    {dayShows.map(show => (
                      <button key={show.id} onClick={() => navigate(`/show/${show.id}`)} className={`w-full text-left text-xs p-3 rounded-lg border ${statusColors[show.status] || statusColors.inquiry}`}>
                        <div className="font-bold truncate">{show.client}</div>
                        <div className="opacity-70 truncate">{show.venue}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="glass rounded-2xl p-6">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
          {(() => {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            const dayShows = getShowsForDate(dateStr);
            if (dayShows.length === 0) return <div className="text-center text-slate-500 py-12">No shows scheduled for this day.</div>;
            return (
              <div className="space-y-4">
                {dayShows.map(show => (
                  <button key={show.id} onClick={() => navigate(`/show/${show.id}`)} className={`w-full text-left p-6 rounded-xl border ${statusColors[show.status] || statusColors.inquiry} hover:bg-white/5 transition-colors`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xl font-bold">{show.client}</div>
                        <div className="text-sm opacity-70 mt-1">{show.venue}</div>
                      </div>
                      <span className="text-xs font-bold uppercase">{show.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
