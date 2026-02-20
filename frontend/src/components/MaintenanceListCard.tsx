import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Machine } from '../types/machine';
import './MaintenanceListCard.css';

interface MaintenanceListCardProps {
  machines: Machine[];
}

export function MaintenanceListCard({ machines }: MaintenanceListCardProps) {
  const machinesNeedingMaintenance = useMemo(() => {
    return machines
      .filter(m => m.hourMeter && m.usefulLifeHours)
      .map(m => {
        const hrsRemaining = m.usefulLifeHours! - m.hourMeter!;
        const pctUsage = (m.hourMeter! / m.usefulLifeHours!) * 100;
        return { ...m, hrsRemaining, pctUsage };
      })
      .filter(m => m.hrsRemaining > 0)
      .sort((a, b) => a.hrsRemaining - b.hrsRemaining)
      .slice(0, 8);
  }, [machines]);

  const getStatusColor = (pctUsage: number) => {
    if (pctUsage >= 90) return '#dc2626';
    if (pctUsage >= 75) return '#f59e0b';
    if (pctUsage >= 50) return '#eab308';
    return '#22c55e';
  };

  if (machinesNeedingMaintenance.length === 0) {
    return (
      <div className="maintenance-list-card">
        <div className="maintenance-list-header">
          <span className="maintenance-icon">🔧</span>
          <h3>Próximos a Mantenimiento</h3>
        </div>
        <div className="maintenance-list-empty">
          <span>✅</span>
          <p>No hay máquinas próximas a mantenimiento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="maintenance-list-card">
      <div className="maintenance-list-header">
        <span className="maintenance-icon">🔧</span>
        <h3>Próximos a Mantenimiento</h3>
        <span className="maintenance-count">{machinesNeedingMaintenance.length}</span>
      </div>
      
      <div className="maintenance-list">
        {machinesNeedingMaintenance.map((machine) => (
          <Link 
            to={`/fleet/${machine.id}/history`} 
            key={machine.id} 
            className="maintenance-item"
          >
            <div className="maintenance-info">
              <span className="maintenance-code">{machine.code}</span>
              <span className="maintenance-name">{machine.brand} {machine.model}</span>
            </div>
            <div className="maintenance-stats">
              <span className="maintenance-hours">
                {machine.hrsRemaining.toLocaleString()} hrs
              </span>
              <div 
                className="maintenance-bar"
                style={{ 
                  width: `${Math.min(machine.pctUsage, 100)}%`,
                  backgroundColor: getStatusColor(machine.pctUsage)
                }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
