import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { MachineDetails } from '../api/machineApi';
import { machineApi } from '../api/machineApi';
import './MachineHistoryPage.css';

export function MachineHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<MachineDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'contracts' | 'workshop'>('summary');
  const [showHourMeterModal, setShowHourMeterModal] = useState(false);
  const [newHourMeter, setNewHourMeter] = useState('');
  const [updatingHourMeter, setUpdatingHourMeter] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchDetails(id);
    }
  }, [id]);

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
      {/* Header */}
      <header className="history-header">
        <div className="header-brand" onClick={() => navigate('/')}>
          <span className="brand-icon">🏗️</span>
          <span className="brand-text">YellowFleet</span>
        </div>
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
                  {details.workOrders.length === 0 ? (
                    <div className="empty-state"><span>🔧</span><p>No hay órdenes de trabajo</p></div>
                  ) : (
                    <div className="workorders-list">
                      {details.workOrders.map((wo) => (
                        <div key={wo.id} className="workorder-card">
                          <div className="workorder-header">
                            <span className={`workorder-type ${wo.type.toLowerCase()}`}>
                              {wo.type === 'PREVENTIVE' && '🛡️ Preventivo'}
                              {wo.type === 'CORRECTIVE' && '🔧 Correctivo'}
                              {wo.type === 'PREDICTIVE' && '📡 Predictivo'}
                            </span>
                            <span className={`workorder-status ${wo.status.toLowerCase()}`}>{wo.status}</span>
                          </div>
                          <div className="workorder-dates">
                            <span>📥 {formatDate(wo.entryDate)}</span>
                            {wo.exitDate && <span>📤 {formatDate(wo.exitDate)}</span>}
                          </div>
                          <div className="workorder-costs">
                            <div className="cost-item"><span>Repuestos:</span><span>{formatCurrency(wo.sparePartsCost)}</span></div>
                            <div className="cost-item"><span>Mano Obra:</span><span>{formatCurrency(wo.laborCost)}</span></div>
                            <div className="cost-item total"><span>Total:</span><span>{formatCurrency(wo.totalCost)}</span></div>
                          </div>
                        </div>
                      ))}
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
            <div className="hourmeter-stat"><span className="label">Vida útil total</span><span className="value">{(details.usefulLifeHours || 10000).toLocaleString()} hrs</span></div>
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
    </div>
  );
}
