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

export default function App() {
  const location = useLocation();
  const activePage = location.pathname.split('/')[1] || 'Home';
  const pageName = activePage.charAt(0).toUpperCase() + activePage.slice(1);

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <Sidebar activePage={pageName} />
      <main className="flex-1 p-6 overflow-auto pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">{pageName}</h1>
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
    </div>
  );
}
