import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import FleetPage from './pages/FleetPage';
import { DashboardPage } from './pages/DashboardPage';
import ContractsPage from './pages/ContractsPage';
import { WorkshopPage } from './pages/WorkshopPage';
import { MachineHistoryPage } from './pages/MachineHistoryPage';
import './App.css';

type Page = 'dashboard' | 'fleet' | 'contracts' | 'workshop';

function AppNavigator() {
  const [currentPage, setCurrentPage] = useState<Page>('fleet');

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="app-nav__brand">YellowFleet</div>
        <div className="app-nav__links">
          <button
            className={`app-nav__link ${currentPage === 'dashboard' ? 'app-nav__link--active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`app-nav__link ${currentPage === 'fleet' ? 'app-nav__link--active' : ''}`}
            onClick={() => setCurrentPage('fleet')}
          >
            Flota
          </button>
          <button
            className={`app-nav__link ${currentPage === 'contracts' ? 'app-nav__link--active' : ''}`}
            onClick={() => setCurrentPage('contracts')}
          >
            Contratos
          </button>
          <button
            className={`app-nav__link ${currentPage === 'workshop' ? 'app-nav__link--active' : ''}`}
            onClick={() => setCurrentPage('workshop')}
          >
            Taller
          </button>
        </div>
      </nav>
      <main className="app-main">
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'fleet' && <FleetPage />}
        {currentPage === 'contracts' && <ContractsPage />}
        {currentPage === 'workshop' && <WorkshopPage />}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppNavigator />} />
        <Route path="/fleet/:id/history" element={<MachineHistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
