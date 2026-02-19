import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import FleetPage from './pages/FleetPage';
import { DashboardPage } from './pages/DashboardPage';
import ContractsPage from './pages/ContractsPage';
import { WorkshopPage } from './pages/WorkshopPage';
import { MachineHistoryPage } from './pages/MachineHistoryPage';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/LoginPage';
import './App.css';

function AppNavigator() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('fleet');

  const handleLogout = () => {
    logout();
  };

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
          {user?.role === 'ADMIN' && (
            <button
              className={`app-nav__link ${currentPage === 'users' ? 'app-nav__link--active' : ''}`}
              onClick={() => setCurrentPage('users')}
            >
              Usuarios
            </button>
          )}
        </div>
        <div className="app-nav__user">
          <span className="user-info">
            {user?.username} ({user?.role})
          </span>
          <button className="btn-logout" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </nav>
      <main className="app-main">
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'fleet' && <FleetPage />}
        {currentPage === 'contracts' && <ContractsPage />}
        {currentPage === 'workshop' && <WorkshopPage />}
        {currentPage === 'users' && <UsersPage />}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppNavigator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/:id/history"
            element={
              <ProtectedRoute>
                <MachineHistoryPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
