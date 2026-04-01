import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Phone, Users, FileText, CheckSquare, DollarSign, MessageSquare, Upload, Plus, GripVertical, Trash2, Send, Building2, User, Wifi, Car, AlertTriangle } from 'lucide-react';

const DetailRow = ({ icon: Icon, label, value, className = '' }: { icon: any; label: string; value: string; className?: string }) => (
  <div className="flex items-start gap-3 text-sm">
    <Icon size={16} className="text-amber-500 mt-0.5 shrink-0" />
    <div>
      <span className="text-slate-500">{label}: </span>
      <span className={className}>{value}</span>
    </div>
  </div>
);

const TabOverview = () => (
  <div className="p-6 space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Show Details */}
      <div className="space-y-4">
        <h3 className="col-header">Times & Venue</h3>
        <div className="space-y-3">
          <DetailRow icon={Clock} label="Showtime" value="8:00 PM – 9:30 PM" />
          <DetailRow icon={Clock} label="Call Time" value="5:30 PM" />
          <DetailRow icon={Clock} label="Load-in" value="3:00 PM" />
          <DetailRow icon={MapPin} label="Venue" value="Gaylord Opryland Resort" />
          <DetailRow icon={MapPin} label="Address" value="2800 Opryland Dr, Nashville, TN 37214" />
          <DetailRow icon={Building2} label="Ballroom" value="Grand Ballroom C" />
          <DetailRow icon={Car} label="Loading Dock" value="East side, Dock B — call security at gate" />
          <DetailRow icon={Car} label="Parking" value="Lot D, tell gate you're with VR Creative" />
          <DetailRow icon={Wifi} label="WiFi" value="Marriott_Events / events2026" />
          <DetailRow icon={Phone} label="On-site Contact" value="Sarah Johnson — (615) 555-0123" />
        </div>
      </div>

      {/* Business Details */}
      <div className="space-y-4">
        <h3 className="col-header">Business Details</h3>
        <div className="space-y-3">
          <DetailRow icon={Building2} label="Booked By (DMC)" value="PRA Group — Madison Clark" />
          <DetailRow icon={User} label="End Client" value="ABC Corp — Annual Sales Kickoff" />
          <DetailRow icon={DollarSign} label="Fee" value="$8,500" className="text-emerald-400 font-bold" />
          <DetailRow icon={DollarSign} label="Deposit" value="$4,250 — Paid" className="text-emerald-400" />
          <DetailRow icon={DollarSign} label="Balance" value="$4,250 — Due Apr 20" className="text-amber-400" />
          <DetailRow icon={Users} label="Set Length" value="45 minutes" />
          <DetailRow icon={Users} label="Performers" value="10-person drumline" />
          <DetailRow icon={Users} label="Dress Code" value="All black, no logos" />
        </div>
      </div>
    </div>

    {/* Change Log */}
    <div className="space-y-3">
      <h3 className="col-header">Recent Changes</h3>
      <div className="space-y-2">
        <div className="flex items-start gap-3 text-sm bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <span className="text-slate-500">Apr 3: </span>
            <span>Load-in moved from <span className="line-through text-slate-500">3:00 PM</span> → <span className="text-amber-400 font-bold">2:00 PM</span></span>
          </div>
        </div>
        <div className="flex items-start gap-3 text-sm bg-white/[0.02] border border-white/6 rounded-lg p-3">
          <AlertTriangle size={16} className="text-slate-500 mt-0.5 shrink-0" />
          <div>
            <span className="text-slate-500">Apr 1: </span>
            <span>On-site contact updated: <span className="line-through text-slate-500">Mike Thompson</span> → <span className="text-white">Sarah Johnson</span></span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TabRoster = () => {
  const performers = [
    { name: 'Marcus Williams', role: 'Drumline Lead', pay: 400, status: 'confirmed' },
    { name: 'Bryce Johnson', role: 'Drumline', pay: 400, status: 'confirmed' },
    { name: 'DeAndre Smith', role: 'Drumline', pay: 400, status: 'pending' },
    { name: 'Tyler Brooks', role: 'Drumline', pay: 400, status: 'confirmed' },
    { name: 'James Carter', role: 'Drumline', pay: 400, status: 'declined' },
  ];
  const totalPay = performers.filter(p => p.status !== 'declined').reduce((sum, p) => sum + p.pay, 0);
  const statusStyle: Record<string, string> = {
    confirmed: 'bg-emerald-500/10 text-emerald-500',
    pending: 'bg-amber-500/10 text-amber-500',
    declined: 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="col-header">Performers ({performers.length})</h3>
        <button className="flex items-center gap-2 text-sm bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors">
          <Plus size={16} /> Add Performer
        </button>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/6">
            <th className="col-header p-3">Performer</th>
            <th className="col-header p-3">Role</th>
            <th className="col-header p-3">Pay</th>
            <th className="col-header p-3">Status</th>
            <th className="col-header p-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {performers.map((p, i) => (
            <tr key={i} className="border-b border-white/6 hover:bg-white/[0.02] transition-colors">
              <td className="p-3 font-medium">{p.name}</td>
              <td className="p-3 text-slate-400">{p.role}</td>
              <td className="p-3 font-mono">${p.pay}</td>
              <td className="p-3">
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${statusStyle[p.status]}`}>{p.status}</span>
              </td>
              <td className="p-3">
                <button className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end pt-2 border-t border-white/6">
        <div className="text-sm">
          <span className="text-slate-500">Total Performer Pay: </span>
          <span className="font-bold font-mono text-amber-400">${totalPay.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const TabDocuments = () => (
  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
    {['Contract', 'Rider', 'W9', 'COI'].map(doc => (
      <div key={doc} className="glass p-4 rounded-xl text-center">
        <FileText className="mx-auto mb-2 text-cyan-400" />
        <div className="text-xs font-bold">{doc}.pdf</div>
      </div>
    ))}
  </div>
);

const TabChecklist = () => {
  const [items, setItems] = useState([
    { label: 'W9 sent to client', done: true, date: 'Mar 28' },
    { label: 'Deposit invoice sent', done: true, date: 'Mar 29' },
    { label: 'Deposit received', done: true, date: 'Apr 1' },
    { label: 'Contract signed', done: false, date: null },
    { label: 'Balance invoice sent', done: false, date: null },
    { label: 'Balance received', done: false, date: null },
    { label: 'Rider sent to venue', done: true, date: 'Mar 30' },
    { label: 'Load-in confirmed', done: false, date: null },
  ]);
  const completed = items.filter(i => i.done).length;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="col-header">Client Onboarding ({completed}/{items.length})</h3>
        <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <Plus size={14} /> Add Item
        </button>
      </div>
      {/* Progress bar */}
      <div className="w-full bg-white/5 rounded-full h-2">
        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${(completed / items.length) * 100}%` }} />
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors ${item.done ? 'opacity-60' : ''}`}
          >
            <label className="flex items-center gap-3 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => {
                  const updated = [...items];
                  updated[i] = { ...updated[i], done: !updated[i].done, date: !updated[i].done ? 'Today' : null };
                  setItems(updated);
                }}
                className="accent-emerald-500 w-4 h-4"
              />
              <span className={item.done ? 'line-through text-slate-500' : ''}>{item.label}</span>
            </label>
            {item.date && <span className="text-xs text-slate-500">{item.date}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

const TabRunOfShow = () => {
  const cues = [
    { time: '3:00 PM', duration: '60 min', description: 'Load-in & Setup', who: 'Full team', notes: 'Dock B, east side' },
    { time: '5:00 PM', duration: '30 min', description: 'Sound Check', who: 'Marcus + DJ', notes: 'Test all channels' },
    { time: '5:30 PM', duration: '30 min', description: 'Performers Arrive (Call Time)', who: 'Full team', notes: 'Green room: Suite 204' },
    { time: '7:00 PM', duration: '5 min', description: 'Doors Open', who: '—', notes: 'Hold in green room' },
    { time: '7:45 PM', duration: '5 min', description: 'Stage Position', who: 'Full team', notes: 'Pre-set behind curtain' },
    { time: '8:00 PM', duration: '15 min', description: 'Drumline Opener', who: 'Drumline (10)', notes: 'Entrance from rear of ballroom' },
    { time: '8:15 PM', duration: '60 min', description: 'DJ Set', who: 'DJ Vince', notes: 'Corporate-friendly mix' },
    { time: '9:15 PM', duration: '15 min', description: 'Drumline Closer', who: 'Drumline (10)', notes: 'LED drums for finale' },
    { time: '9:30 PM', duration: '30 min', description: 'Breakdown', who: 'Full team', notes: 'All gear out by 10 PM' },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="col-header">Timeline</h3>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"><Plus size={14} /> Add Cue</button>
          <button className="text-sm bg-white/5 px-4 py-2 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">Export PDF</button>
        </div>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/6">
            <th className="col-header p-3 w-8"></th>
            <th className="col-header p-3">Time</th>
            <th className="col-header p-3">Duration</th>
            <th className="col-header p-3">What Happens</th>
            <th className="col-header p-3">Who</th>
            <th className="col-header p-3">Notes</th>
          </tr>
        </thead>
        <tbody>
          {cues.map((cue, i) => (
            <tr key={i} className="border-b border-white/6 hover:bg-white/[0.02] transition-colors group">
              <td className="p-3 text-slate-600 group-hover:text-slate-400 cursor-grab"><GripVertical size={14} /></td>
              <td className="p-3 font-mono text-cyan-400">{cue.time}</td>
              <td className="p-3 text-slate-500 font-mono">{cue.duration}</td>
              <td className="p-3 font-medium">{cue.description}</td>
              <td className="p-3 text-slate-400">{cue.who}</td>
              <td className="p-3 text-slate-500">{cue.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TabExpenses = () => {
  const expenses = [
    { date: 'Mar 15', description: 'Equipment rental — LED drums', category: 'Equipment', amount: 850 },
    { date: 'Mar 20', description: 'Van rental', category: 'Travel', amount: 280 },
    { date: 'Apr 1', description: 'Gas (Nashville → Opryland)', category: 'Travel', amount: 45 },
    { date: 'Apr 3', description: 'Parking permit', category: 'Venue', amount: 25 },
  ];
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const fee = 8500;
  const performerPay = 1600;
  const profit = fee - totalExpenses - performerPay;

  const categoryColors: Record<string, string> = {
    Travel: 'text-cyan-400 bg-cyan-500/10',
    Equipment: 'text-amber-400 bg-amber-500/10',
    Venue: 'text-emerald-400 bg-emerald-500/10',
    Personnel: 'text-purple-400 bg-purple-500/10',
    Other: 'text-slate-400 bg-slate-500/10',
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="col-header">Show Expenses</h3>
        <button className="flex items-center gap-2 text-sm bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors">
          <Plus size={16} /> Add Expense
        </button>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/6">
            <th className="col-header p-3">Date</th>
            <th className="col-header p-3">Description</th>
            <th className="col-header p-3">Category</th>
            <th className="col-header p-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e, i) => (
            <tr key={i} className="border-b border-white/6 hover:bg-white/[0.02] transition-colors">
              <td className="p-3 text-slate-500 font-mono">{e.date}</td>
              <td className="p-3">{e.description}</td>
              <td className="p-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${categoryColors[e.category] || categoryColors.Other}`}>{e.category}</span>
              </td>
              <td className="p-3 text-right font-mono">${e.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="border-t border-white/6 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Show Fee</span>
          <span className="font-mono text-emerald-400">${fee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Performer Pay</span>
          <span className="font-mono text-red-400">-${performerPay.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Expenses</span>
          <span className="font-mono text-red-400">-${totalExpenses.toLocaleString()}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-white/6">
          <span className="font-bold">Net Profit</span>
          <span className={`font-bold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${profit.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const TabUpdates = () => {
  const updates = [
    { date: 'Apr 3, 2:15 PM', content: 'Load-in time has been moved up to 2:00 PM. Please plan accordingly.', sentTo: '4 performers' },
    { date: 'Apr 1, 10:00 AM', content: 'Dress code confirmed: all black, no logos. LED drums provided on-site.', sentTo: '5 performers' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Compose */}
      <div className="space-y-3">
        <h3 className="col-header">Post Update</h3>
        <textarea
          className="w-full bg-white/5 border border-white/6 rounded-xl p-4 text-sm resize-none h-24 focus:outline-none focus:border-amber-500/50 placeholder-slate-500 transition-colors"
          placeholder="Type an update to send to all performers on this show..."
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Will be emailed to all rostered performers</span>
          <button className="flex items-center gap-2 text-sm bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors">
            <Send size={14} /> Send Update
          </button>
        </div>
      </div>

      {/* History */}
      <div className="space-y-3">
        <h3 className="col-header">Update History</h3>
        {updates.map((u, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/6 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">{u.date}</span>
              <span className="text-xs text-slate-500">Sent to {u.sentTo}</span>
            </div>
            <p className="text-sm">{u.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ShowDetail() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = ['Overview', 'Roster', 'Documents', 'Checklist', 'Run of Show', 'Expenses', 'Updates'];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft size={16} /> Back</button>
      
      <div className="glass p-6 rounded-2xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">ABC Corp — Corporate Event</h1>
        <div className="flex gap-4 text-sm text-slate-400">
          <span>Apr 5, 2026</span>
          <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-xs font-bold">Confirmed</span>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/6 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-bold whitespace-nowrap ${activeTab === tab ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl min-h-[400px]">
        {activeTab === 'Overview' && <TabOverview />}
        {activeTab === 'Roster' && <TabRoster />}
        {activeTab === 'Documents' && <TabDocuments />}
        {activeTab === 'Checklist' && <TabChecklist />}
        {activeTab === 'Run of Show' && <TabRunOfShow />}
        {activeTab === 'Expenses' && <TabExpenses />}
        {activeTab === 'Updates' && <TabUpdates />}
      </div>
    </div>
  );
}
