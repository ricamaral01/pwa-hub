import React from 'react';

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-navy text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-gray text-sm">Docs Ativos</p>
          <p className="text-navy text-2xl font-bold">1,284</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
