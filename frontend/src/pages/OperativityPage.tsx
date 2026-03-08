import { useEffect, useMemo, useState } from 'react';
import { financeApi, type MachineUptime, type WorkshopImpact } from '../api/financeApi';
import { KPICard } from '../components/KPICard';
import { KPIGrid } from '../components/KPIGrid';
import type { KPIMetric } from '../types/dashboard';
import './OperativityPage.css';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatHours(hours: number): string {
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${Math.round(hours % 24)}h`;
  }
  return `${Math.round(hours)}h`;
}

type TabType = 'uptime' | 'workshop';

export function OperativityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('uptime');
  const [uptime, setUptime] = useState<MachineUptime[]>([]);
  const [workshopImpact, setWorkshopImpact] = useState<WorkshopImpact[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros para Impacto Taller
  const [filters, setFilters] = useState({
    machineCode: '',
    maintenanceCount: '',
    sparePartsCost: '',
    laborCost: '',
    totalCost: '',
    downtimeHours: '',
    lostIncome: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uptimeData, workshopData] = await Promise.all([
          financeApi.getMachineUptime(),
          financeApi.getWorkshopImpact(),
        ]);
        setUptime(uptimeData);
        setWorkshopImpact(workshopData);
      } catch (error) {
        console.error('Error fetching operativity data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const workshopMetrics = useMemo<KPIMetric[]>(() => {
    if (!workshopImpact.length) return [];
    const totalSpareParts = workshopImpact.reduce((sum, m) => sum + m.sparePartsCost, 0);
    const totalLabor = workshopImpact.reduce((sum, m) => sum + m.laborCost, 0);
    const totalCost = workshopImpact.reduce((sum, m) => sum + m.totalCost, 0);
    const totalDowntime = workshopImpact.reduce((sum, m) => sum + m.downtimeHours, 0);
    const totalLostIncome = workshopImpact.reduce((sum, m) => sum + m.lostIncome, 0);
    
    return [
      {
        id: 'spareParts',
        title: 'Repuestos',
        value: formatCurrency(totalSpareParts),
        variant: 'warning' as const,
        icon: '⚙️',
        subtitle: 'Costo total repuestos',
      },
      {
        id: 'labor',
        title: 'Mano de Obra',
        value: formatCurrency(totalLabor),
        variant: 'warning' as const,
        icon: '👷',
        subtitle: 'Costo total mano de obra',
      },
      {
        id: 'totalWorkshopCost',
        title: 'Costo Total Taller',
        value: formatCurrency(totalCost),
        variant: 'danger' as const,
        icon: '🔧',
        subtitle: 'Repuestos + Mano de obra',
      },
      {
        id: 'lostIncome',
        title: 'Ingresos Perdidos',
        value: formatCurrency(totalLostIncome),
        variant: 'danger' as const,
        icon: '📉',
        subtitle: 'Por tiempo en taller',
      },
      {
        id: 'totalDowntime',
        title: 'Horas Inactivas',
        value: formatHours(totalDowntime),
        variant: 'info' as const,
        icon: '⏱️',
        subtitle: 'Tiempo total en taller',
      },
      {
        id: 'maintenanceVisits',
        title: 'Visitas Taller',
        value: workshopImpact.reduce((sum, m) => sum + m.maintenanceCount, 0),
        variant: 'primary' as const,
        icon: '🏢',
        subtitle: 'Total mantenimientos',
      },
    ];
  }, [workshopImpact]);

  // Filtros para Impacto Taller
  const filteredWorkshopImpact = useMemo(() => {
    return workshopImpact.filter((m) => {
      const matchesMachine = !filters.machineCode || 
        m.machineCode.toLowerCase().includes(filters.machineCode.toLowerCase());
      const matchesMaintenance = !filters.maintenanceCount || 
        m.maintenanceCount.toString().includes(filters.maintenanceCount);
      const matchesSpareParts = !filters.sparePartsCost || 
        m.sparePartsCost.toString().includes(filters.sparePartsCost);
      const matchesLabor = !filters.laborCost || 
        m.laborCost.toString().includes(filters.laborCost);
      const matchesTotalCost = !filters.totalCost || 
        m.totalCost.toString().includes(filters.totalCost);
      const matchesDowntime = !filters.downtimeHours || 
        m.downtimeHours.toString().includes(filters.downtimeHours);
      const matchesLostIncome = !filters.lostIncome || 
        m.lostIncome.toString().includes(filters.lostIncome);
      
      return matchesMachine && matchesMaintenance && matchesSpareParts && 
        matchesLabor && matchesTotalCost && matchesDowntime && matchesLostIncome;
    });
  }, [workshopImpact, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      machineCode: '',
      maintenanceCount: '',
      sparePartsCost: '',
      laborCost: '',
      totalCost: '',
      downtimeHours: '',
      lostIncome: '',
    });
  };

  if (loading) {
    return (
      <div className="operativity-page">
        <div className="operativity-loading">Cargando datos de operatividad...</div>
      </div>
    );
  }

  return (
    <div className="operativity-page">
      <div className="operativity-header">
        <h1>Operatividad</h1>
        <span className="operativity-subtitle">
          Disponibilidad de flota e impacto del taller
        </span>
      </div>

      <div className="operativity-tabs">
        <button
          className={`operativity-tab ${activeTab === 'uptime' ? 'operativity-tab--active' : ''}`}
          onClick={() => setActiveTab('uptime')}
        >
          📊 Disponibilidad
        </button>
        <button
          className={`operativity-tab ${activeTab === 'workshop' ? 'operativity-tab--active' : ''}`}
          onClick={() => setActiveTab('workshop')}
        >
          🔧 Impacto Taller
        </button>
      </div>

      <div className="operativity-content">
        {activeTab === 'uptime' && (
          <div className="operativity-uptime">
            <KPIGrid>
              <KPICard
                metric={{
                  id: 'avgUptime',
                  title: 'Disponibilidad Promedio',
                  value: `${uptime.length > 0 ? (uptime.reduce((sum, m) => sum + m.uptimePercentage, 0) / uptime.length).toFixed(1) : 0}%`,
                  variant: 'primary' as const,
                  icon: '📊',
                  subtitle: 'Promedio flota',
                }}
              />
              <KPICard
                metric={{
                  id: 'totalWorkshopHours',
                  title: 'Horas en Taller',
                  value: formatHours(uptime.reduce((sum, m) => sum + m.workshopHours, 0)),
                  variant: 'warning' as const,
                  icon: '🔧',
                  subtitle: 'Total flota',
                }}
              />
              <KPICard
                metric={{
                  id: 'totalMaintenances',
                  title: 'Mantenimientos',
                  value: uptime.reduce((sum, m) => sum + m.maintenanceCount, 0),
                  variant: 'info' as const,
                  icon: '🏢',
                  subtitle: 'Total completados',
                }}
              />
            </KPIGrid>

            <div className="operativity-full-chart">
              <h3>Tiempo de Operatividad por Máquina</h3>
              <div className="operativity-table operativity-table--full">
                <table>
                  <thead>
                    <tr>
                      <th>Máquina</th>
                      <th>Horas Totales</th>
                      <th>Horas Operación</th>
                      <th>Horas Taller</th>
                      <th>Disponibilidad %</th>
                      <th>Mant. Completados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uptime.map((m) => (
                      <tr key={m.machineId}>
                        <td className="machine-code">{m.machineCode}</td>
                        <td>{formatHours(m.totalHours)}</td>
                        <td className="profit">{formatHours(m.operatingHours)}</td>
                        <td className="cost">{formatHours(m.workshopHours)}</td>
                        <td className={m.uptimePercentage >= 80 ? 'profit' : m.uptimePercentage >= 60 ? '' : 'loss'}>
                          {m.uptimePercentage.toFixed(1)}%
                        </td>
                        <td>{m.maintenanceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workshop' && (
          <div className="operativity-workshop">
            <KPIGrid>
              {workshopMetrics.map((metric) => (
                <KPICard key={metric.id} metric={metric} />
              ))}
            </KPIGrid>

            <div className="operativity-full-chart">
              <h3>Impacto del Taller por Máquina</h3>
              
              <div className="operativity-table operativity-table--full">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="text" 
                          name="machineCode" 
                          placeholder="Máquina" 
                          value={filters.machineCode} 
                          onChange={handleFilterChange} 
                          className="filter-input" 
                        />
                      </th>
                      <th>
                        <input 
                          type="text" 
                          name="maintenanceCount" 
                          placeholder="Visitas" 
                          value={filters.maintenanceCount} 
                          onChange={handleFilterChange} 
                          className="filter-input" 
                        />
                      </th>
                      <th>
                        <input 
                          type="text" 
                          name="sparePartsCost" 
                          placeholder="Repuestos" 
                          value={filters.sparePartsCost} 
                          onChange={handleFilterChange} 
                          className="filter-input" 
                        />
                      </th>
                      <th>
                        <input 
                          type="text" 
                          name="laborCost" 
                          placeholder="Mano Obra" 
                          value={filters.laborCost} 
                          onChange={handleFilterChange} 
                          className="filter-input" 
                        />
                      </th>
                      <th>
                        <input 
                          type="text" 
                          name="totalCost" 
                          placeholder="Costo Total" 
                          value={filters.totalCost} 
                          onChange={handleFilterChange} 
                          className="filter-input" 
                        />
                      </th>
                      <th>
                        <input 
                          type="text" 
                          name="downtimeHours" 
                          placeholder="Horas Inact." 
                          value={filters.downtimeHours} 
                          onChange={handleFilterChange} 
                          className="filter-input" 
                        />
                      </th>
                      <th>
                        <input 
                          type="text" 
                          name="lostIncome" 
                          placeholder="Ing. Perdidos" 
                          value={filters.lostIncome} 
                          onChange={handleFilterChange} 
                          className="filter-input" 
                        />
                      </th>
                      <th>
                        <button onClick={clearFilters} className="btn-clear-filters" title="Limpiar filtros">✕</button>
                      </th>
                    </tr>
                    <tr>
                      <th>Máquina</th>
                      <th>Visitas</th>
                      <th>Repuestos</th>
                      <th>Mano de Obra</th>
                      <th>Costo Total</th>
                      <th>Horas Inact.</th>
                      <th>Ing. Perdidos</th>
                      <th>Última Visita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkshopImpact.map((m) => (
                      <tr key={m.machineId}>
                        <td className="machine-code">{m.machineCode}</td>
                        <td>{m.maintenanceCount}</td>
                        <td className="cost">{formatCurrency(m.sparePartsCost)}</td>
                        <td className="cost">{formatCurrency(m.laborCost)}</td>
                        <td className="cost">{formatCurrency(m.totalCost)}</td>
                        <td>{formatHours(m.downtimeHours)}</td>
                        <td className="loss">{formatCurrency(m.lostIncome)}</td>
                        <td>{m.lastMaintenanceDate ? new Date(m.lastMaintenanceDate).toLocaleDateString('es-CL') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
