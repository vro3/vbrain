import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Send W9 to Opryland', priority: 'High', status: 'Pending' },
    { id: 2, title: 'Review contract for ABC Corp', priority: 'Medium', status: 'In Progress' },
  ]);

  return (
    <div className="space-y-4">
      <button className="bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={16} /> New Task</button>
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-4 bg-slate-900 p-3 rounded-lg border border-white/6">
            <input type="checkbox" checked={task.status === 'Done'} />
            <span className="flex-1">{task.title}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${task.priority === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>{task.priority}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
