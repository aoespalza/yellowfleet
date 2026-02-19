import { useEffect, useMemo, useState } from 'react';
import { machineApi } from '../api/machineApi';
import type { Machine } from '../types/machine';
import { KPICard } from '../components/KPICard';
import { KPIGrid } from '../components/KPIGrid';
import { UtilizationChart } from '../components/UtilizationChart';
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
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
