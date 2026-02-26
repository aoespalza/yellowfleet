import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  const [currentPage, setCurrentPage] = useState<string>(() => {
    return localStorage.getItem('YF_PAGE') || 'dashboard';
  });
  const [selectedContractId, setSelectedContractId] = useState<string | undefined>();

  // Limpiar el localStorage despues de leer
  useEffect(() => {
    const page = localStorage.getItem('YF_PAGE');
    if (page) {
      localStorage.removeItem('YF_PAGE');
    }
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleNavigate = (page: string, contractId?: string) => {
    setSelectedContractId(contractId);
    setCurrentPage(page);
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
        {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {currentPage === 'fleet' && <FleetPage />}
        {currentPage === 'contracts' && <ContractsPage initialContractId={selectedContractId} />}
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

function PublicRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/fleet/:id/history"
            element={
              <PublicRoute>
                <MachineHistoryPage />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppNavigator />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
