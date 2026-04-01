/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar, BottomBar } from './components/Navigation';
import Home from './components/Home';
import Calendar from './components/Calendar';
import Tools from './components/Tools';
import TaxHub from './components/TaxHub';
import Library from './components/Library';
import Tasks from './components/Tasks';
import Settings from './components/Settings';
import ShowDetail from './components/ShowDetail';
import { useAuth } from './hooks/useAuth';
import { useUpdateCheck } from './hooks/useUpdateCheck';
import { Loader2, RefreshCw } from 'lucide-react';

function LoginScreen({ onLogin, error }: { onLogin: () => void; error: string | null }) {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white tracking-tight">vBrain</h1>
        <p className="text-slate-400">Sign in to access your dashboard</p>
        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>
        )}
        <button
          onClick={onLogin}
          className="bg-white text-slate-950 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const activePage = location.pathname.split('/')[1] || 'Home';
  const pageName = activePage.charAt(0).toUpperCase() + activePage.slice(1);
  const { user, loading, error, login, logout } = useAuth();
  const { updateAvailable, hardUpdate } = useUpdateCheck();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} error={error} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <Sidebar activePage={pageName} />
      <main className="flex-1 p-6 overflow-auto pb-20 md:pb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{pageName}</h1>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Sign out
          </button>
        </div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/admin/tax" element={<TaxHub />} />
          <Route path="/library" element={<Library />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/show/:showId" element={<ShowDetail />} />
        </Routes>
      </main>
      <BottomBar />
      {updateAvailable && (
        <button
          onClick={hardUpdate}
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-cyan-500 text-slate-950 px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-cyan-500/30 animate-pulse hover:animate-none hover:bg-cyan-400 transition-colors"
        >
          <RefreshCw size={14} /> Update Available
        </button>
      )}
    </div>
  );
}
