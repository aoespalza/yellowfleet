import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import type { MachineDetails } from '../api/machineApi';
import { machineApi } from '../api/machineApi';
import { workOrderApi } from '../api/workOrderApi';
import type { WorkOrder } from '../types/workOrder';
import { LegalDocumentsCard } from '../components/LegalDocumentsCard';
import { MachinePDFReport } from '../components/MachinePDFReport';
import './MachineHistoryPage.css';

export function MachineHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<MachineDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'contracts' | 'workshop' | 'hourmeter'>('summary');
  const [showHourMeterModal, setShowHourMeterModal] = useState(false);
  const [newHourMeter, setNewHourMeter] = useState('');
  const [updatingHourMeter, setUpdatingHourMeter] = useState(false);
  const [hourMeterHistory, setHourMeterHistory] = useState<Array<{
    id: string;
    previousValue: number;
    newValue: number;
    createdAt: string;
    user: { username: string };
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
  const [workshopSubTab, setWorkshopSubTab] = useState<'preventive' | 'corrective'>('preventive');
  
  // Estado para reset de vida útil
  const [showResetUsefulLifeModal, setShowResetUsefulLifeModal] = useState(false);
  const [newUsefulLifeHours, setNewUsefulLifeHours] = useState('');
  const [resettingUsefulLife, setResettingUsefulLife] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    // Si se accede desde un QR (sin referrer interno), redirigir a vista operador
    const isInternalNav = document.referrer && document.referrer.startsWith(window.location.origin);
    if (!isInternalNav) {
      navigate(`/operador?maquina=${id}`, { replace: true });
      return;
    }
    fetchDetails(id);
  }, [id]);

  // Cargar historial de horómetro cuando se selecciona el tab
  useEffect(() => {
    if (activeTab === 'hourmeter' && id) {
      loadHourMeterHistory(id);
    }
  }, [activeTab, id]);

  // Cargar órdenes de trabajo cuando se selecciona el tab workshop
  useEffect(() => {
    if (activeTab === 'workshop' && id) {
      loadWorkOrders(id);
    }
  }, [activeTab, id]);

  const loadWorkOrders = async (machineId: string) => {
    setLoadingWorkOrders(true);
    try {
      const orders = await workOrderApi.getAll();
      setWorkOrders(orders.filter(wo => wo.machineId === machineId));
    } catch (error) {
      console.error('Error loading work orders:', error);
    } finally {
      setLoadingWorkOrders(false);
    }
  };

  const loadHourMeterHistory = async (machineId: string) => {
    setLoadingHistory(true);
    try {
      const history = await machineApi.getHourMeterHistory(machineId);
      setHourMeterHistory(history);
    } catch (error) {
      console.error('Error loading hour meter history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchDetails = async (machineId: string) => {
    try {
      const data = await machineApi.getDetails(machineId);
      setDetails(data);
    } catch (error) {
      console.error('Error fetching machine details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHourMeter = async () => {
    if (!details) return;
    
    const hourMeter = parseFloat(newHourMeter.replace(/,/g, ''));
    if (isNaN(hourMeter) || hourMeter < 0) return;
    
    if (hourMeter < (details.hourMeter || 0)) {
      alert(`El horómetro no puede ser menor al valor actual (${details.hourMeter?.toLocaleString() || 0} hrs)`);
      return;
    }
    
    setUpdatingHourMeter(true);
    try {
      await machineApi.updateHourMeter(details!.id, hourMeter);
      setDetails(prev => prev ? ({ ...prev, hourMeter }) : null);
      setShowHourMeterModal(false);
      setNewHourMeter('');
    } catch (error) {
      console.error('Error updating hourMeter:', error);
      alert('Error al actualizar el horómetro');
    } finally {
      setUpdatingHourMeter(false);
    }
  };

  const handleResetUsefulLifeHours = async () => {
    if (!details) return;
    
    const usefulLifeHours = parseFloat(newUsefulLifeHours.replace(/,/g, ''));
    if (isNaN(usefulLifeHours) || usefulLifeHours <= 0) return;
    
    setResettingUsefulLife(true);
    try {
      const result = await machineApi.resetUsefulLifeHours(details!.id, usefulLifeHours);
      setDetails(prev => prev ? ({ ...prev, usefulLifeHours: result.newUsefulLifeHours }) : null);
      setShowResetUsefulLifeModal(false);
      setNewUsefulLifeHours('');
      alert(`Horas de vida útil reseteadas de ${result.previousUsefulLifeHours.toLocaleString()} a ${result.newUsefulLifeHours.toLocaleString()} hrs`);
    } catch (error) {
      console.error('Error resetting useful life hours:', error);
      alert('Error al resetear las horas de vida útil');
    } finally {
      setResettingUsefulLife(false);
    }
  };

  const exportToExcel = () => {
    if (hourMeterHistory.length === 0) return;

    const data = hourMeterHistory.map(log => ({
      'Fecha': formatDate(log.createdAt),
      'Usuario': log.user.username,
      'Valor Anterior (hrs)': log.previousValue,
      'Nuevo Valor (hrs)': log.newValue,
      'Diferencia (hrs)': log.newValue - log.previousValue,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial Horómetro');
    XLSX.writeFile(wb, `historial_horometro_${details?.code || 'machine'}.xlsx`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'status-available';
      case 'IN_CONTRACT': return 'status-contract';
      case 'IN_WORKSHOP': return 'status-workshop';
      case 'INACTIVE': return 'status-inactive';
      default: return '';
    }
  };

  if (loading) {
    return <div className="history-page loading">Cargando...</div>;
  }

  if (!details) {
    return <div className="history-page error">Error al cargar detalles</div>;
  }

  return (
    <>
    <div className="history-layout">
      {/* Header con menú */}
      <header className="history-header">
        <div className="header-brand" onClick={() => navigate('/')}>
          <span className="brand-icon">🏗️</span>
          <span className="brand-text">YellowFleet</span>
        </div>
        <nav className="header-nav">
          <button className="nav-link" onClick={() => {
            localStorage.setItem('YF_PAGE', 'dashboard');
            navigate('/');
          }}>
            Dashboard
          </button>
          <button className="nav-link" onClick={() => {
            localStorage.setItem('YF_PAGE', 'fleet');
            navigate('/');
          }}>
            Flota
          </button>
          <button className="nav-link" onClick={() => {
            localStorage.setItem('YF_PAGE', 'contracts');
            navigate('/');
          }}>
            Contratos
          </button>
          <button className="nav-link" onClick={() => {
            localStorage.setItem('YF_PAGE', 'workshop');
            navigate('/');
          }}>
            Taller
          </button>
        </nav>
        <div className="header-machine">
          <button
            onClick={() => window.print()}
            style={{ marginRight: 12, background: '#f59e0b', border: 'none', color: '#111827', padding: '6px 14px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            title="Genera un PDF con la hoja de vida completa de la máquina"
          >
            🖨️ Exportar PDF
          </button>
          <span className="machine-code">{details.code}</span>
          <span className={`machine-status ${getStatusBadgeClass(details.status)}`}>
            {details.status === 'AVAILABLE' && '✅ Disponible'}
            {details.status === 'IN_CONTRACT' && '📄 En Contrato'}
            {details.status === 'IN_WORKSHOP' && '🔧 En Taller'}
            {details.status === 'INACTIVE' && '⛔ Inactivo'}
          </span>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="history-main">
        <div className="content-layout">
          {/* Contenido central */}
          <div className="main-content">
            {/* Card de info máquina */}
            <section className="hero-section">
              <div className="hero-content">
                <h1>{details.type}</h1>
                <p className="hero-subtitle">{details.brand} {details.model} - Año {details.year}</p>
                <div className="hero-badges">
                  <span className="badge">Serie: {details.serialNumber}</span>
                  <span className="badge">{details.hourMeter?.toLocaleString() || 0} hrs</span>
                  <span className="badge">{details.currentLocation || 'Sin ubicación'}</span>
                </div>
              </div>
            </section>

            {/* Tabs */}
            <nav className="history-tabs">
              <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                📊 Resumen
              </button>
              <button className={`tab ${activeTab === 'contracts' ? 'active' : ''}`} onClick={() => setActiveTab('contracts')}>
                📄 Contratos ({details.contracts.length})
              </button>
              <button className={`tab ${activeTab === 'workshop' ? 'active' : ''}`} onClick={() => setActiveTab('workshop')}>
                🔧 Taller ({details.workOrders.length})
              </button>
              <button className={`tab ${activeTab === 'hourmeter' ? 'active' : ''}`} onClick={() => setActiveTab('hourmeter')}>
                ⏱️ Horómetro ({hourMeterHistory.length})
              </button>
            </nav>

            {/* Contenido tabs */}
            <div className="tab-content">
              {activeTab === 'summary' && (
                <div className="summary-tab">
                  {/* First row: Days and Income */}
                  <div className="kpi-row">
                    <div className="kpi-card">
                      <span className="kpi-icon">📅</span>
                      <span className="kpi-value">{details.profitability.totalContractDays?.toLocaleString() || 0}</span>
                      <span className="kpi-label">Días Contrato</span>
                    </div>
                    <div className="kpi-card">
                      <span className="kpi-icon">✅</span>
                      <span className="kpi-value">{details.profitability.productiveDays?.toLocaleString() || 0}</span>
                      <span className="kpi-label">Días Productivos</span>
                    </div>
                    <div className="kpi-card kpi-income">
                      <span className="kpi-icon">💰</span>
                      <span className="kpi-value">{formatCurrency(details.profitability.dailyIncome || 0)}</span>
                      <span className="kpi-label">Ingreso/Día</span>
                    </div>
                    <div className="kpi-card">
                      <span className="kpi-icon">📊</span>
                      <span className="kpi-value">{details.profitability.productivityPercentage?.toFixed(1) || 0}%</span>
                      <span className="kpi-label">Productividad</span>
                    </div>
                  </div>

                  {/* Second row: Costs and Margin */}
                  <div className="kpi-row">
                    <div className="kpi-card kpi-expense">
                      <span className="kpi-icon">🔧</span>
                      <span className="kpi-value">{formatCurrency(details.profitability.totalMaintenanceCost)}</span>
                      <span className="kpi-label">Costos Mantenimiento</span>
                    </div>
                    <div className="kpi-card kpi-expense">
                      <span className="kpi-icon">💸</span>
                      <span className="kpi-value">{formatCurrency(details.profitability.dailyCost || 0)}</span>
                      <span className="kpi-label">Costo/Día</span>
                    </div>
                    <div className={`kpi-card ${details.profitability.totalMargin >= 0 ? 'kpi-profit' : 'kpi-loss'}`}>
                      <span className="kpi-icon">📈</span>
                      <span className="kpi-value">{formatCurrency(details.profitability.totalMargin)}</span>
                      <span className="kpi-label">Margen Total</span>
                    </div>
                  </div>

                  <div className="stats-section">
                    <h3>🔧 Estadísticas de Taller</h3>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-value">{details.workshopSummary.totalVisits}</span>
                        <span className="stat-label">Visitas</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{formatCurrency(details.workshopSummary.totalSparePartsCost)}</span>
                        <span className="stat-label">Repuestos</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{formatCurrency(details.workshopSummary.totalLaborCost)}</span>
                        <span className="stat-label">Mano de Obra</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{details.workshopSummary.totalDowntimeHours.toLocaleString()}</span>
                        <span className="stat-label">Horas Detención</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contracts' && (
                <div className="contracts-tab">
                  {details.contracts.length === 0 ? (
                    <div className="empty-state"><span>📄</span><p>No hay contratos registrados</p></div>
                  ) : (
                    <div className="contracts-list">
                      {details.contracts.map((contract) => (
                        <div key={contract.contractId} className="contract-card">
                          <div className="contract-header">
                            <span className="contract-code">{contract.contractCode}</span>
                            <span className={`contract-status ${contract.status.toLowerCase()}`}>{contract.status}</span>
                          </div>
                          <div className="contract-customer">{contract.customer}</div>
                          <div className="contract-period">📅 {formatDate(contract.startDate)} - {formatDate(contract.endDate)}</div>
                          <div className="contract-stats">
                            <div className="contract-stat"><span className="label">Horas</span><span className="value">{contract.workedHours.toLocaleString()}</span></div>
                            <div className="contract-stat"><span className="label">Ingresos</span><span className="value income">{formatCurrency(contract.generatedIncome)}</span></div>
                            <div className="contract-stat"><span className="label">Costos</span><span className="value expense">{formatCurrency(contract.maintenanceCost)}</span></div>
                            <div className="contract-stat"><span className="label">Margen</span><span className={`value ${contract.margin >= 0 ? 'profit' : 'loss'}`}>{formatCurrency(contract.margin)}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'workshop' && (() => {
                const preventive = workOrders.filter(wo => wo.type === 'PREVENTIVE');
                const corrective = workOrders.filter(wo => wo.type !== 'PREVENTIVE');
                const activeList = workshopSubTab === 'preventive' ? preventive : corrective;

                const exportWorkshopExcel = () => {
                  const rows = activeList.map(wo => ({
                    'Tipo': wo.type === 'PREVENTIVE' ? 'Preventivo' : wo.type === 'CORRECTIVE' ? 'Correctivo' : 'Predictivo',
                    'Estado': wo.status,
                    'Fecha Ingreso': formatDate(wo.entryDate),
                    'Fecha Salida': wo.exitDate ? formatDate(wo.exitDate) : '-',
                    'Costo Repuestos': wo.sparePartsCost,
                    'Costo Mano de Obra': wo.laborCost,
                    'Costo Total': wo.totalCost,
                    'Horas Parada': wo.downtimeHours,
                  }));
                  import('xlsx').then(XLSX => {
                    const ws = XLSX.utils.json_to_sheet(rows);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, workshopSubTab === 'preventive' ? 'Preventivo' : 'Correctivo');
                    XLSX.writeFile(wb, `taller_${workshopSubTab}_${details?.code}.xlsx`);
                  });
                };

                const statusLabel: Record<string, string> = {
                  OPEN: 'Abierta', IN_PROGRESS: 'En progreso',
                  WAITING_PARTS: 'Esperando repuestos', COMPLETED: 'Completada', CANCELLED: 'Cancelada'
                };
                const statusColor: Record<string, string> = {
                  OPEN: '#3b82f6', IN_PROGRESS: '#f59e0b',
                  WAITING_PARTS: '#8b5cf6', COMPLETED: '#10b981', CANCELLED: '#6b7280'
                };

                return (
                  <div className="workorders-tab">
                    {loadingWorkOrders ? (
                      <div className="loading-state">Cargando historial de taller...</div>
                    ) : (
                      <>
                        {/* Sub-tabs */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
                          <button
                            onClick={() => setWorkshopSubTab('preventive')}
                            style={{ padding: '8px 20px', border: 'none', borderBottom: workshopSubTab === 'preventive' ? '2px solid #f59e0b' : '2px solid transparent', background: 'none', fontWeight: workshopSubTab === 'preventive' ? 700 : 400, color: workshopSubTab === 'preventive' ? '#f59e0b' : '#6b7280', cursor: 'pointer', fontSize: 14 }}>
                            🔩 Preventivo ({preventive.length})
                          </button>
                          <button
                            onClick={() => setWorkshopSubTab('corrective')}
                            style={{ padding: '8px 20px', border: 'none', borderBottom: workshopSubTab === 'corrective' ? '2px solid #f59e0b' : '2px solid transparent', background: 'none', fontWeight: workshopSubTab === 'corrective' ? 700 : 400, color: workshopSubTab === 'corrective' ? '#f59e0b' : '#6b7280', cursor: 'pointer', fontSize: 14 }}>
                            🚨 Correctivo / Predictivo ({corrective.length})
                          </button>
                        </div>

                        {activeList.length === 0 ? (
                          <div className="empty-state">
                            <span>🔧</span>
                            <p>No hay órdenes {workshopSubTab === 'preventive' ? 'preventivas' : 'correctivas'} registradas</p>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                              <button className="btn-export-excel" onClick={exportWorkshopExcel}>
                                📥 Exportar Excel
                              </button>
                            </div>
                            <div className="hourmeter-table-wrapper">
                              <table className="hourmeter-table">
                                <thead>
                                  <tr>
                                    <th>Tipo</th>
                                    <th>Estado</th>
                                    <th>Ingreso</th>
                                    <th>Salida</th>
                                    <th style={{ textAlign: 'right' }}>Repuestos</th>
                                    <th style={{ textAlign: 'right' }}>M. de Obra</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                    <th style={{ textAlign: 'right' }}>Hrs Parada</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {activeList.map(wo => (
                                    <tr key={wo.id}>
                                      <td>{wo.type === 'PREVENTIVE' ? 'Preventivo' : wo.type === 'CORRECTIVE' ? 'Correctivo' : 'Predictivo'}</td>
                                      <td><span style={{ color: statusColor[wo.status] || '#6b7280', fontWeight: 600 }}>{statusLabel[wo.status] || wo.status}</span></td>
                                      <td>{formatDate(wo.entryDate)}</td>
                                      <td>{wo.exitDate ? formatDate(wo.exitDate) : '—'}</td>
                                      <td style={{ textAlign: 'right' }}>${wo.sparePartsCost.toLocaleString('es-CL')}</td>
                                      <td style={{ textAlign: 'right' }}>${wo.laborCost.toLocaleString('es-CL')}</td>
                                      <td style={{ textAlign: 'right', fontWeight: 600 }}>${wo.totalCost.toLocaleString('es-CL')}</td>
                                      <td style={{ textAlign: 'right' }}>{wo.downtimeHours} h</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr style={{ fontWeight: 700, borderTop: '2px solid #e5e7eb' }}>
                                    <td colSpan={4}>Total ({activeList.length} OT)</td>
                                    <td style={{ textAlign: 'right' }}>${activeList.reduce((s, w) => s + w.sparePartsCost, 0).toLocaleString('es-CL')}</td>
                                    <td style={{ textAlign: 'right' }}>${activeList.reduce((s, w) => s + w.laborCost, 0).toLocaleString('es-CL')}</td>
                                    <td style={{ textAlign: 'right' }}>${activeList.reduce((s, w) => s + w.totalCost, 0).toLocaleString('es-CL')}</td>
                                    <td style={{ textAlign: 'right' }}>{activeList.reduce((s, w) => s + w.downtimeHours, 0)} h</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Tab Historial de Horómetro */}
              {activeTab === 'hourmeter' && (
                <div className="hourmeter-history-tab">
                  {loadingHistory ? (
                    <div className="loading-state">Cargando historial...</div>
                  ) : hourMeterHistory.length === 0 ? (
                    <div className="empty-state">
                      <span>⏱️</span>
                      <p>No hay registro de actualizaciones de horómetro</p>
                    </div>
                  ) : (
                    <div>
                      <div className="hourmeter-table-header">
                        <button className="btn-export-excel" onClick={exportToExcel}>
                          📥 Exportar Excel
                        </button>
                      </div>
                      <div className="hourmeter-table-wrapper">
                      <table className="hourmeter-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Usuario</th>
                            <th>Valor Anterior</th>
                            <th>Nuevo Valor</th>
                            <th>Diferencia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hourMeterHistory.map((log) => (
                            <tr key={log.id}>
                              <td>{formatDate(log.createdAt)}</td>
                              <td>{log.user.username}</td>
                              <td>{log.previousValue.toLocaleString()} hrs</td>
                              <td className="new-value">{log.newValue.toLocaleString()} hrs</td>
                              <td className="diff-value">+{(log.newValue - log.previousValue).toLocaleString()} hrs</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar derecho */}
          <aside className="right-sidebar">
            <div className="sidebar-section hero-media">
              <div className="hero-image">
                {details.imageUrl ? <img src={details.imageUrl} alt={details.code} /> : <div className="hero-image-placeholder"><span>🚜</span></div>}
              </div>
              <div className="hero-qr">
                <QRCodeSVG value={`${window.location.origin}/operador?maquina=${details.id}`} size={140} level="M" includeMargin={false} />
                <span className="qr-label">Escanea para operar</span>
              </div>
            </div>
            <div className="sidebar-section">
              <h3>📊 Estadísticas Rápidas</h3>
              <div className="sidebar-stats">
                <div className="sidebar-stat"><span className="stat-num">{details.contracts.length}</span><span className="stat-lbl">Contratos</span></div>
                <div className="sidebar-stat"><span className="stat-num">{details.workOrders.length}</span><span className="stat-lbl">Visitas Taller</span></div>
                <div className="sidebar-stat"><span className="stat-num">{details.profitability.totalWorkedHours.toLocaleString()}</span><span className="stat-lbl">Horas Totales</span></div>
              </div>
            </div>
            <div className="sidebar-section">
              <h3>💰 Rentabilidad</h3>
              <div className="sidebar-card profitability">
                {/* Days and Income per day */}
                <div className="profit-row"><span>Días Contrato</span><span>{details.profitability.totalContractDays?.toLocaleString() || 0}</span></div>
                <div className="profit-row"><span>Días Productivos</span><span>{details.profitability.productiveDays?.toLocaleString() || 0}</span></div>
                <div className="profit-row"><span>Ingreso/Día</span><span className="income">{formatCurrency(details.profitability.dailyIncome || 0)}</span></div>
                <div className="profit-row"><span>Productividad</span><span className={(details.profitability.productivityPercentage || 0) >= 70 ? 'income' : (details.profitability.productivityPercentage || 0) >= 40 ? 'warning' : 'expense'}>{(details.profitability.productivityPercentage || 0).toFixed(1)}%</span></div>
                
                <div className="profit-divider"></div>
                
                {/* Costs and margin */}
                <div className="profit-row"><span>Costos Mantenimiento</span><span className="expense">{formatCurrency(details.profitability.totalMaintenanceCost)}</span></div>
                <div className="profit-row"><span>Costo/Día</span><span className="expense">{formatCurrency(details.profitability.dailyCost || 0)}</span></div>
                <div className="profit-row total"><span>Margen Total</span><span className={details.profitability.totalMargin >= 0 ? 'income' : 'expense'}>{formatCurrency(details.profitability.totalMargin)}</span></div>
              </div>
            </div>
          </aside>
        </div>

        {/* Control de Horómetro - Debajo del contenido */}
        <div className="hourmeter-control">
          <div className="hourmeter-info">
            <h3>⏱️ Horómetro</h3>
            <div className="hourmeter-value">
              <span className="current">{details.hourMeter?.toLocaleString() || 0}</span>
              <span className="unit">hrs</span>
            </div>
            <button className="btn-update-hourmeter" onClick={() => { setNewHourMeter((details.hourMeter || 0).toString()); setShowHourMeterModal(true); }}>
              ✏️ Actualizar
            </button>
          </div>
          <div className="hourmeter-stats">
            <div className="hourmeter-stat"><span className="label">Vida Útil</span><span className="value">{(details.usefulLifeHours || 10000).toLocaleString()} hrs</span></div>
            <div className="hourmeter-stat">
              <span className="label">Horas restantes</span>
              <span className="value" style={{ color: ((details.usefulLifeHours || 10000) - (details.hourMeter || 0)) < 1000 ? '#dc2626' : '#059669' }}>
                {Math.max(0, ((details.usefulLifeHours || 10000) - (details.hourMeter || 0))).toLocaleString()} hrs
              </span>
            </div>
          </div>
          <div className="maintenance-info">
            <h3>🔧 Próximo Mantenimiento</h3>
            <div className="maintenance-details">
              <div className="maintenance-item">
                <span className="label">Último servicio</span>
                <span className="value">{formatDate(details.lastMaintenance?.date || null)}</span>
              </div>
              <div className="maintenance-item">
                <span className="label">Próximo (250 hrs)</span>
                <span className="value">{(details.hourMeter + 250).toLocaleString()} hrs</span>
              </div>
            </div>
            <button 
              className="btn-reset-useful-life"
              onClick={() => {
                setNewUsefulLifeHours((details.usefulLifeHours || 10000).toString());
                setShowResetUsefulLifeModal(true);
              }}
              title="Resetear horas de vida útil (mantenimiento mayor)"
            >
              🔄 Reset Vida Útil
            </button>
          </div>
        </div>

        {/* Documentos Legales */}
        <div className="legal-documents-section">
          <LegalDocumentsCard machineId={details.id} />
        </div>
      </main>

      {/* Footer */}
      <footer className="history-footer">
        <p>YellowFleet © {new Date().getFullYear()} - Sistema de Gestión de Flota</p>
      </footer>

      {/* Modal */}
      {showHourMeterModal && (
        <div className="modal-overlay" onClick={() => setShowHourMeterModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Actualizar Horómetro</h3>
            <p className="modal-subtitle">{details.code} - {details.brand} {details.model}</p>
            <div className="form-group">
              <label>Nuevo horómetro (horas)</label>
              <input 
                type="number" 
                value={newHourMeter} 
                onChange={(e) => setNewHourMeter(e.target.value)} 
                placeholder={(details.hourMeter || 0).toString()} 
                autoFocus 
                style={{ borderColor: parseFloat(newHourMeter) < (details.hourMeter || 0) ? '#dc2626' : undefined }}
              />
              {parseFloat(newHourMeter) < (details.hourMeter || 0) && (
                <span style={{ color: '#dc2626', fontSize: '12px' }}>El valor no puede ser menor a {details.hourMeter?.toLocaleString() || 0} hrs</span>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowHourMeterModal(false)} disabled={updatingHourMeter}>Cancelar</button>
              <button 
                className="btn-save" 
                onClick={handleUpdateHourMeter} 
                disabled={updatingHourMeter || !newHourMeter || parseFloat(newHourMeter) < (details.hourMeter || 0)}
              >
                {updatingHourMeter ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para resetear horas de vida útil */}
      {showResetUsefulLifeModal && (
        <div className="modal-overlay" onClick={() => setShowResetUsefulLifeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>🔄 Resetear Horas de Vida Útil</h3>
            <p className="modal-subtitle">{details.code} - {details.brand} {details.model}</p>
            <div className="modal-warning">
              <span>⚠️</span>
              <p>Esta acción se usa cuando se realiza un mantenimiento mayor (cambio de motor, transmisión, etc.) y la maquinaria adquiere una nueva vida útil.</p>
            </div>
            <div className="form-group">
              <label>Horas de vida útil actuales:</label>
              <div className="current-value">{(details.usefulLifeHours || 10000).toLocaleString()} hrs</div>
            </div>
            <div className="form-group">
              <label>Nuevas horas de vida útil:</label>
              <input 
                type="number" 
                value={newUsefulLifeHours} 
                onChange={(e) => setNewUsefulLifeHours(e.target.value)} 
                placeholder="10000" 
                autoFocus 
              />
              <div className="hours-remaining-preview">
                Horas restantes después del reset: {Math.max(0, (parseFloat(newUsefulLifeHours) || 0) - (details.hourMeter || 0)).toLocaleString()} hrs
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowResetUsefulLifeModal(false)} disabled={resettingUsefulLife}>
                Cancelar
              </button>
              <button 
                className="btn-save" 
                onClick={handleResetUsefulLifeHours} 
                disabled={resettingUsefulLife || !newUsefulLifeHours || parseFloat(newUsefulLifeHours) <= 0}
              >
                {resettingUsefulLife ? 'Guardando...' : 'Confirmar Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

    {/* Portal directo a body para que el CSS de impresión funcione correctamente */}
    {createPortal(
      <MachinePDFReport details={details} workOrders={workOrders} />,
      document.body
    )}
    </>
  );
}
