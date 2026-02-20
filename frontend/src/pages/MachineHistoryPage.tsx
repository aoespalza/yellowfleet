import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import type { MachineDetails } from '../api/machineApi';
import { machineApi } from '../api/machineApi';
import { workOrderApi, type WorkOrderLog } from '../api/workOrderApi';
import type { WorkOrder } from '../types/workOrder';
import { LegalDocumentsCard } from '../components/LegalDocumentsCard';
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
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [workOrderLogs, setWorkOrderLogs] = useState<WorkOrderLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLogDescription, setNewLogDescription] = useState('');
  const [logFile, setLogFile] = useState<File | null>(null);
  const [uploadingLog, setUploadingLog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchDetails(id);
    }
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

  // Cargar logs cuando se selecciona una orden de trabajo
  useEffect(() => {
    if (selectedWorkOrder) {
      loadWorkOrderLogs(selectedWorkOrder.id);
    }
  }, [selectedWorkOrder]);

  const loadWorkOrders = async (machineId: string) => {
    setLoadingWorkOrders(true);
    try {
      const orders = await workOrderApi.getAll();
      const machineOrders = orders.filter(wo => wo.machineId === machineId);
      setWorkOrders(machineOrders);
      if (machineOrders.length > 0) {
        setSelectedWorkOrder(machineOrders[0]);
      }
    } catch (error) {
      console.error('Error loading work orders:', error);
    } finally {
      setLoadingWorkOrders(false);
    }
  };

  const loadWorkOrderLogs = async (workOrderId: string) => {
    setLoadingLogs(true);
    try {
      const logs = await workOrderApi.getLogs(workOrderId);
      setWorkOrderLogs(logs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleAddLog = async () => {
    if (!selectedWorkOrder || (!newLogDescription && !logFile)) return;
    
    setUploadingLog(true);
    try {
      if (logFile) {
        await workOrderApi.uploadLogWithFile(selectedWorkOrder.id, newLogDescription, logFile);
      } else {
        await workOrderApi.addLog(selectedWorkOrder.id, newLogDescription);
      }
      setNewLogDescription('');
      setLogFile(null);
      setShowLogModal(false);
      loadWorkOrderLogs(selectedWorkOrder.id);
    } catch (error) {
      console.error('Error adding log:', error);
    } finally {
      setUploadingLog(false);
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
                  <div className="kpi-row">
                    <div className="kpi-card">
                      <span className="kpi-icon">⏱️</span>
                      <span className="kpi-value">{details.profitability.totalWorkedHours.toLocaleString()}</span>
                      <span className="kpi-label">Horas Trabajadas</span>
                    </div>
                    <div className="kpi-card kpi-income">
                      <span className="kpi-icon">💵</span>
                      <span className="kpi-value">{formatCurrency(details.profitability.totalIncome)}</span>
                      <span className="kpi-label">Ingresos Totales</span>
                    </div>
                    <div className="kpi-card kpi-expense">
                      <span className="kpi-icon">🔧</span>
                      <span className="kpi-value">{formatCurrency(details.profitability.totalMaintenanceCost)}</span>
                      <span className="kpi-label">Costos Mantenimiento</span>
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

              {activeTab === 'workshop' && (
                <div className="workorders-tab">
                  {loadingWorkOrders ? (
                    <div className="loading-state">Cargando órdenes de trabajo...</div>
                  ) : workOrders.length === 0 ? (
                    <div className="empty-state">
                      <span>🔧</span>
                      <p>No hay órdenes de trabajo registradas</p>
                    </div>
                  ) : (
                    <div className="workorders-with-logs">
                      {/* Selector de orden de trabajo */}
                      <div className="workorder-selector">
                        <label>Seleccionar Orden de Trabajo:</label>
                        <select 
                          value={selectedWorkOrder?.id || ''} 
                          onChange={(e) => {
                            const wo = workOrders.find(w => w.id === e.target.value);
                            setSelectedWorkOrder(wo || null);
                          }}
                        >
                          {workOrders.map((wo) => (
                            <option key={wo.id} value={wo.id}>
                              {wo.type} - {formatDate(wo.entryDate)} ({wo.status})
                            </option>
                          ))}
                        </select>
                        <button className="btn-add-log" onClick={() => setShowLogModal(true)}>
                          ➕ Agregar Bitácora
                        </button>
                      </div>

                      {/* Bitácora */}
                      <div className="binnacle-section">
                        <h3>📋 Bitácora de Trabajo</h3>
                        {loadingLogs ? (
                          <div className="loading-state">Cargando bitácora...</div>
                        ) : workOrderLogs.length === 0 ? (
                          <div className="empty-state">
                            <span>📝</span>
                            <p>No hay registros en la bitácora</p>
                          </div>
                        ) : (
                          <div className="binnacle-table-wrapper">
                            <table className="binnacle-table">
                              <thead>
                                <tr>
                                  <th>Fecha</th>
                                  <th>Descripción</th>
                                  <th>Archivo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {workOrderLogs.map((log) => (
                                  <tr key={log.id}>
                                    <td>{formatDate(log.date)}</td>
                                    <td>{log.description || '-'}</td>
                                    <td>
                                      {log.fileUrl ? (
                                        <a 
                                          href={log.fileUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="file-link"
                                        >
                                          📎 {log.fileName}
                                        </a>
                                      ) : (
                                        <span className="no-file">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                <QRCodeSVG value={`${window.location.origin}/fleet/${details.id}/history`} size={140} level="M" includeMargin={false} />
                <span className="qr-label">Escanea para consultar</span>
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
                <div className="profit-row"><span>Ingresos</span><span className="income">{formatCurrency(details.profitability.totalIncome)}</span></div>
                <div className="profit-row"><span>Costos</span><span className="expense">{formatCurrency(details.profitability.totalMaintenanceCost)}</span></div>
                <div className="profit-row total"><span>Margen</span><span className={details.profitability.totalMargin >= 0 ? 'income' : 'expense'}>{formatCurrency(details.profitability.totalMargin)}</span></div>
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

      {/* Modal para agregar bitácora */}
      {showLogModal && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Agregar Registro a Bitácora</h3>
              <button className="modal-close" onClick={() => setShowLogModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Descripción del trabajo realizado:</label>
                <textarea 
                  value={newLogDescription}
                  onChange={(e) => setNewLogDescription(e.target.value)}
                  placeholder="Describe el trabajo realizado,repuestos utilizados, observaciones..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Archivo (factura, foto, etc.):</label>
                <input 
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={(e) => setLogFile(e.target.files?.[0] || null)}
                />
                {logFile && (
                  <div className="selected-file">
                    📎 {logFile.name}
                    <button type="button" onClick={() => setLogFile(null)}>×</button>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowLogModal(false)} disabled={uploadingLog}>
                Cancelar
              </button>
              <button 
                className="btn-save" 
                onClick={handleAddLog} 
                disabled={uploadingLog || (!newLogDescription && !logFile)}
              >
                {uploadingLog ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
