import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <Layout current={currentPage} setPage={setCurrentPage}>
      {currentPage === 'dashboard' && <Dashboard />}
    </Layout>
  );
}

export default App;
