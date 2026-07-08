import React from 'react';

const Layout = ({ children, current, setPage }) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-navy text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-black text-blue">DOCFLOW</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setPage('dashboard')} className={`w-full text-left px-4 py-3 rounded-lg ${current === 'dashboard' ? 'bg-blue' : ''}`}>Dashboard</button>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
