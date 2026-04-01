import { Home, Calendar, Briefcase, Settings, Tag, CheckSquare, Library, MoreHorizontal, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar = ({ activePage }: { activePage: string }) => {
  const location = useLocation();
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Tools', path: '/tools', icon: Briefcase },
    { name: 'Tax Hub', path: '/admin/tax', icon: Tag },
    { name: 'Library', path: '/library', icon: Library },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-white/6 p-4 glass">
      <div className="text-xl font-bold mb-8 px-2 text-white tracking-tighter">vCommand</div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 w-full p-2 rounded-lg text-sm transition-colors ${
              location.pathname === item.path ? 'bg-white/5 text-amber-500 border-l-2 border-amber-500' : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <item.icon size={18} />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export const BottomBar = () => {
  const location = useLocation();
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/6 p-2 flex justify-around items-center">
      <Link to="/" className={location.pathname === '/' ? 'text-amber-500' : 'text-slate-400'}><Home size={20} /></Link>
      <Link to="/calendar" className={location.pathname === '/calendar' ? 'text-amber-500' : 'text-slate-400'}><Calendar size={20} /></Link>
      <button className="bg-amber-500 text-slate-950 p-3 rounded-full -mt-8 shadow-lg shadow-amber-500/20"><MessageSquare size={20} /></button>
      <Link to="/tools" className={location.pathname === '/tools' ? 'text-amber-500' : 'text-slate-400'}><Briefcase size={20} /></Link>
      <button className="text-slate-400"><MoreHorizontal size={20} /></button>
    </div>
  );
};
