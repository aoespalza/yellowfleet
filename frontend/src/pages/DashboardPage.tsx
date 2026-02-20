import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { machineApi } from '../api/machineApi';
import type { Machine } from '../types/machine';
import { KPICard } from '../components/KPICard';
import { KPIGrid } from '../components/KPIGrid';
import { UtilizationChart } from '../components/UtilizationChart';
import { ExpiringDocumentsCard } from '../components/ExpiringDocumentsCard';
import type { KPIMetric } from '../types/dashboard';
import './DashboardPage.css';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const data = await machineApi.getAll();
        setMachines(data);
      } catch (error) {
        console.error('Error fetching machines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  // Máquinas próximas a mantenimiento (ordenadas por horas restantes)
  const getMachinesNeedingMaintenance = () => {
    return machines
      .filter(m => m.hourMeter && m.usefulLifeHours)
      .map(m => {
        const hrsRemaining = m.usefulLifeHours! - m.hourMeter!;
        const pctUsage = (m.hourMeter! / m.usefulLifeHours!) * 100;
        return { ...m, hrsRemaining, pctUsage };
      })
      .filter(m => m.hrsRemaining > 0)
      .sort((a, b) => a.hrsRemaining - b.hrsRemaining)
      .slice(0, 10);
  };

  const getStatusColor = (pctUsage: number) => {
    if (pctUsage >= 90) return '#dc2626'; // Rojo - crítico
    if (pctUsage >= 75) return '#f59e0b'; // Naranja - urgente
    if (pctUsage >= 50) return '#eab308'; // Amarillo - precaución
    return '#22c55e'; // Verde - OK
  };

  const metrics = useMemo<KPIMetric[]>(() => {
    const totalMachines = machines.length;
    const availableMachines = machines.filter(
      (m) => m.status === 'AVAILABLE'
    ).length;
    const machinesInContract = machines.filter(
      (m) => m.status === 'IN_CONTRACT'
    ).length;
    const machinesInWorkshop = machines.filter(
      (m) => m.status === 'IN_WORKSHOP'
    ).length;
    const totalAcquisitionValue = machines.reduce(
      (sum, m) => sum + (m.acquisitionValue || 0),
      0
    );
    const utilizationPercentage =
      totalMachines > 0 ? (machinesInContract / totalMachines) * 100 : 0;

    return [
      {
        id: 'total',
        title: 'Total Máquinas',
        value: totalMachines,
        variant: 'primary' as const,
        icon: '🏗️',
      },
      {
        id: 'available',
        title: 'Disponibles',
        value: availableMachines,
        variant: 'success' as const,
        icon: '✅',
        subtitle: 'Listas para asignar',
      },
      {
        id: 'contract',
        title: 'En Contrato',
        value: machinesInContract,
        variant: 'info' as const,
        icon: '📄',
        subtitle: 'En operación',
      },
      {
        id: 'workshop',
        title: 'En Taller',
        value: machinesInWorkshop,
        variant: 'warning' as const,
        icon: '🔧',
        subtitle: 'Mantenimiento',
      },
      {
        id: 'value',
        title: 'Valor Flota',
        value: formatCurrency(totalAcquisitionValue),
        variant: 'primary' as const,
        icon: '💰',
        subtitle: 'Valor de adquisición',
      },
      {
        id: 'utilization',
        title: 'Utilización',
        value: `${utilizationPercentage.toFixed(1)}%`,
        variant:
          utilizationPercentage >= 70
            ? ('success' as const)
            : utilizationPercentage >= 40
            ? ('warning' as const)
            : ('danger' as const),
        icon: '📊',
        subtitle: 'En contrato / Total',
      },
    ];
  }, [machines]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard Financiero</h1>
        <span className="dashboard-subtitle">
          Métricas clave de la flota de equipos
        </span>
      </div>

      <div className="dashboard-content">
        <KPIGrid>
          {metrics.map((metric) => (
            <KPICard key={metric.id} metric={metric} />
          ))}
        </KPIGrid>

        <div className="dashboard-charts">
          <div className="dashboard-chart">
            <UtilizationChart
              percentage={
                machines.length > 0
                  ? (machines.filter((m) => m.status === 'IN_CONTRACT').length /
                      machines.length) *
                    100
                  : 0
              }
            />
          </div>
          <div className="dashboard-chart">
            <ExpiringDocumentsCard />
          </div>
        </div>

        {/* Sección de máquinas próximas a mantenimiento */}
        <div className="maintenance-section">
          <h2 className="maintenance-title">🔧 Próximos a Mantenimiento</h2>
          <p className="maintenance-subtitle">Las 10 máquinas con menos horas restantes de vida útil</p>
          
          <div className="maintenance-table-wrapper">
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Equipo</th>
                  <th>Tipo</th>
                  <th>Horómetro</th>
                  <th>Vida Útil</th>
                  <th>Hrs Restantes</th>
                  <th>Uso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {getMachinesNeedingMaintenance().map((machine) => (
                  <tr key={machine.id}>
                    <td className="machine-code">{machine.code}</td>
                    <td>{machine.brand} {machine.model}</td>
                    <td>{machine.type}</td>
                    <td>{(machine.hourMeter || 0).toLocaleString()} hrs</td>
                    <td>{(machine.usefulLifeHours || 0).toLocaleString()} hrs</td>
                    <td className="hours-remaining" style={{ color: getStatusColor(machine.pctUsage) }}>
                      {machine.hrsRemaining.toLocaleString()} hrs
                    </td>
                    <td>
                      <div className="usage-bar-container">
                        <div 
                          className="usage-bar" 
                          style={{ 
                            width: `${Math.min(machine.pctUsage, 100)}%`,
                            backgroundColor: getStatusColor(machine.pctUsage)
                          }}
                        />
                        <span className="usage-text">{machine.pctUsage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <Link to={`/fleet/${machine.id}/history`} className="btn-view-history">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
