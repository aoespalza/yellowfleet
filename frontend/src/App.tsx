import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import FleetPage from './pages/FleetPage';
import { DashboardPage } from './pages/DashboardPage';
import ContractsPage from './pages/ContractsPage';
import { WorkshopPage } from './pages/WorkshopPage';
import { MachineHistoryPage } from './pages/MachineHistoryPage';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/LoginPage';
import { FinancePage } from './pages/FinancePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { OperativityPage } from './pages/OperativityPage';
import OperatorsPage from './pages/OperatorsPage';
import EquipmentPage from './pages/EquipmentPage';
import JobsPage from './pages/JobsPage';
import { OperatorMobilePage } from './pages/OperatorMobilePage';
import './App.css';

function AppNavigator() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>(() => {
    return localStorage.getItem('YF_PAGE') || 'dashboard';
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', section: 'principal' },
    { id: 'fleet', label: 'Flota', icon: '🚜', section: 'principal' },
    { id: 'operators', label: 'Operadores', icon: '👷', section: 'principal' },
    { id: 'equipment', label: 'Dotación EPP', icon: '🛡️', section: 'principal' },
    { id: 'jobs', label: 'Cargos', icon: '👔', section: 'principal' },
    { id: 'contracts', label: 'Contratos', icon: '📄', section: 'operaciones' },
    { id: 'workshop', label: 'Taller', icon: '🔧', section: 'operaciones' },
    { id: 'finance', label: 'Finanzas', icon: '💰', section: 'operaciones' },
    { id: 'operativity', label: 'Operatividad', icon: '📈', section: 'operaciones' },
  ];

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const isSettingsActive = currentPage === 'users' || currentPage === 'notifications';

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <span className="sidebar__brand-icon">🚜</span>
            {!sidebarCollapsed && <span>YellowFleet</span>}
          </div>
          <button 
            className="sidebar__toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>

        <nav className="sidebar__nav">
          {/* Sección Principal */}
          <div className="sidebar__section">
            <div className="sidebar__section-title">Principal</div>
            {navItems.filter(item => item.section === 'principal').map(item => (
              <button
                key={item.id}
                className={`sidebar__link ${currentPage === item.id ? 'sidebar__link--active' : ''}`}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSettingsOpen(false);
                }}
              >
                <span className="sidebar__link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Sección Operaciones */}
          <div className="sidebar__section">
            <div className="sidebar__section-title">Operaciones</div>
            {navItems.filter(item => item.section === 'operaciones').map(item => (
              <button
                key={item.id}
                className={`sidebar__link ${currentPage === item.id ? 'sidebar__link--active' : ''}`}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSettingsOpen(false);
                }}
              >
                <span className="sidebar__link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Configuraciones (solo ADMIN) */}
          {user?.role === 'ADMIN' && (
            <div className="sidebar__section">
              <div className="sidebar__section-title">Sistema</div>
              <div className="sidebar__dropdown">
                <button
                  className={`sidebar__dropdown-trigger ${isSettingsActive ? 'sidebar__dropdown-trigger--active' : ''}`}
                  onClick={() => setSettingsOpen(!settingsOpen)}
                >
                  <span className="sidebar__link-icon">⚙️</span>
                  <span>Configuraciones</span>
                  <span style={{ marginLeft: 'auto', fontSize: '10px' }}>▼</span>
                </button>
                {settingsOpen && (
                  <div className="sidebar__dropdown-menu">
                    <button
                      className={`sidebar__dropdown-item ${currentPage === 'users' ? 'sidebar__dropdown-item--active' : ''}`}
                      onClick={() => {
                        setCurrentPage('users');
                        setSettingsOpen(false);
                      }}
                    >
                      <span>👤</span>
                      <span>Usuarios</span>
                    </button>
                    <button
                      className={`sidebar__dropdown-item ${currentPage === 'notifications' ? 'sidebar__dropdown-item--active' : ''}`}
                      onClick={() => {
                        setCurrentPage('notifications');
                        setSettingsOpen(false);
                      }}
                    >
                      <span>🔔</span>
                      <span>Notificaciones</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Footer del sidebar */}
        {!sidebarCollapsed && (
          <div className="sidebar__footer">
            <div className="sidebar__user">
              <div className="sidebar__user-avatar">
                {getInitials(user?.username || 'U')}
              </div>
              <div className="sidebar__user-info">
                <div className="sidebar__user-name">{user?.username}</div>
                <div className="sidebar__user-role">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={() => window.open('/operador', '_blank')}
              style={{ width: '100%', marginBottom: 8, background: '#451a03', border: '1px solid #f59e0b', color: '#f59e0b', padding: '6px 0', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
            >
              📱 Vista Operador
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        )}
      </aside>

      {/* Contenido principal */}
      <main className={`app-main ${sidebarCollapsed ? 'app-main--expanded' : ''}`}>
        {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {currentPage === 'fleet' && <FleetPage />}
        {currentPage === 'operators' && <OperatorsPage />}
        {currentPage === 'equipment' && <EquipmentPage />}
        {currentPage === 'jobs' && <JobsPage />}
        {currentPage === 'contracts' && <ContractsPage initialContractId={selectedContractId} />}
        {currentPage === 'workshop' && <WorkshopPage />}
        {currentPage === 'finance' && <FinancePage />}
        {currentPage === 'operativity' && <OperativityPage />}
        {currentPage === 'users' && <UsersPage />}
        {currentPage === 'notifications' && <NotificationsPage />}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    // Preservar la URL destino para redirigir después del login
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
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
            path="/operador"
            element={
              <ProtectedRoute>
                <OperatorMobilePage onNavigate={() => { window.location.href = '/'; }} />
              </ProtectedRoute>
            }
          />
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
