import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { MachineDetails } from '../api/machineApi';
import { machineApi } from '../api/machineApi';
import './MachineHistoryPage.css';

export function MachineHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<MachineDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'contracts' | 'workshop'>('summary');
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
    <div className="history-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <h1>📋 Hoja de Vida - {details.code}</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Resumen
        </button>
        <button
          className={`tab ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          Contratos ({details.contracts.length})
        </button>
        <button
          className={`tab ${activeTab === 'workshop' ? 'active' : ''}`}
          onClick={() => setActiveTab('workshop')}
        >
          Taller ({details.workOrders.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="summary-tab">
            <div className="detail-grid">
              <div className="detail-section">
                <h3>🚜 Características</h3>
                <div className="detail-row">
                  <span className="label">Código:</span>
                  <span className="value">{details.code}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Tipo:</span>
                  <span className="value">{details.type}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Marca:</span>
                  <span className="value">{details.brand}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Modelo:</span>
                  <span className="value">{details.model}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Año:</span>
                  <span className="value">{details.year}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Número de Serie:</span>
                  <span className="value">{details.serialNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Horómetro:</span>
                  <span className="value">{details.hourMeter?.toLocaleString() || 0} hrs</span>
                </div>
                <div className="detail-row">
                  <span className="label">Valor Adquisición:</span>
                  <span className="value">{formatCurrency(details.acquisitionValue || 0)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Vida Útil:</span>
                  <span className="value">{details.usefulLifeHours?.toLocaleString() || 0} hrs</span>
                </div>
                <div className="detail-row">
                  <span className="label">Ubicación:</span>
                  <span className="value">{details.currentLocation || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Estado:</span>
                  <span className={`value status-badge ${getStatusBadgeClass(details.status)}`}>
                    {details.status}
                  </span>
                </div>
              </div>

              {details.currentContract && (
                <div className="detail-section">
                  <h3>📄 Contrato Actual</h3>
                  <div className="detail-row">
                    <span className="label">Código:</span>
                    <span className="value">{details.currentContract.code}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Cliente:</span>
                    <span className="value">{details.currentContract.customer}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Inicio:</span>
                    <span className="value">{formatDate(details.currentContract.startDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Fin:</span>
                    <span className="value">{formatDate(details.currentContract.endDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Tarifa/hr:</span>
                    <span className="value">{formatCurrency(details.currentContract.hourlyRate)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="profitability-section">
              <h3>📊 Resumen de Rentabilidad</h3>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Horas Trabajadas</span>
                  <span className="kpi-value">{details.profitability.totalWorkedHours.toLocaleString()}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Ingresos Totales</span>
                  <span className="kpi-value income">{formatCurrency(details.profitability.totalIncome)}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Costos Mantenimiento</span>
                  <span className="kpi-value expense">{formatCurrency(details.profitability.totalMaintenanceCost)}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Margen Total</span>
                  <span className={`kpi-value ${details.profitability.totalMargin >= 0 ? 'profit' : 'loss'}`}>
                    {formatCurrency(details.profitability.totalMargin)}
                  </span>
                </div>
              </div>
            </div>

            <div className="workshop-summary">
              <h3>🔧 Resumen de Taller</h3>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Visitas Taller</span>
                  <span className="kpi-value">{details.workshopSummary.totalVisits}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Costo Repuestos</span>
                  <span className="kpi-value expense">{formatCurrency(details.workshopSummary.totalSparePartsCost)}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Costo Mano Obra</span>
                  <span className="kpi-value expense">{formatCurrency(details.workshopSummary.totalLaborCost)}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Horas Detención</span>
                  <span className="kpi-value">{details.workshopSummary.totalDowntimeHours.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="contracts-tab">
            {details.contracts.length === 0 ? (
              <div className="empty-state">No hay contratos registrados</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contrato</th>
                    <th>Cliente</th>
                    <th>Período</th>
                    <th>Horas</th>
                    <th>Ingresos</th>
                    <th>Costos</th>
                    <th>Margen</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {details.contracts.map((contract) => (
                    <tr key={contract.contractId}>
                      <td>{contract.contractCode}</td>
                      <td>{contract.customer}</td>
                      <td>
                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                      </td>
                      <td>{contract.workedHours.toLocaleString()}</td>
                      <td className="income">{formatCurrency(contract.generatedIncome)}</td>
                      <td className="expense">{formatCurrency(contract.maintenanceCost)}</td>
                      <td className={contract.margin >= 0 ? 'profit' : 'loss'}>
                        {formatCurrency(contract.margin)}
                      </td>
                      <td>
                        <span className={`status-badge-sm ${contract.status.toLowerCase()}`}>
                          {contract.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'workshop' && (
          <div className="workshop-tab">
            {details.workOrders.length === 0 ? (
              <div className="empty-state">No hay órdenes de trabajo registradas</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Repuestos</th>
                    <th>Mano Obra</th>
                    <th>Total</th>
                    <th>Detención</th>
                  </tr>
                </thead>
                <tbody>
                  {details.workOrders.map((wo) => (
                    <tr key={wo.id}>
                      <td>
                        <span className={`type-badge ${wo.type.toLowerCase()}`}>
                          {wo.type}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge-sm ${wo.status.toLowerCase()}`}>
                          {wo.status}
                        </span>
                      </td>
                      <td>{formatDate(wo.entryDate)}</td>
                      <td>{formatDate(wo.exitDate)}</td>
                      <td>{formatCurrency(wo.sparePartsCost)}</td>
                      <td>{formatCurrency(wo.laborCost)}</td>
                      <td className="expense">{formatCurrency(wo.totalCost)}</td>
                      <td>{wo.downtimeHours ? `${wo.downtimeHours} hrs` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
