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
        
        // Determinar urgencia basada en horas restantes
        let urgency: 'critical' | 'warning' | 'normal' = 'normal';
        if (hrsRemaining <= 50) urgency = 'critical';
        else if (hrsRemaining <= 150) urgency = 'warning';
        
        return { ...m, hrsRemaining, pctUsage, urgency };
      })
      .filter(m => m.hrsRemaining > 0)
      .sort((a, b) => a.hrsRemaining - b.hrsRemaining)
      .slice(0, 8);
  }, [machines]);

  if (machinesNeedingMaintenance.length === 0) {
    return (
      <div className="expiring-card">
        <div className="expiring-header">
          <span className="expiring-icon">🔧</span>
          <h3>Próximos Mantenimientos</h3>
        </div>
        <div className="expiring-empty">
          <span>✅</span>
          <p>No hay máquinas próximas a mantenimiento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expiring-card">
      <div className="expiring-header">
        <span className="expiring-icon">⚠️</span>
        <h3>Próximos Mantenimientos</h3>
        <span className="expiring-count">{machinesNeedingMaintenance.length}</span>
      </div>
      
      <div className="expiring-list">
        {machinesNeedingMaintenance.map((machine) => (
          <Link 
            to={`/fleet/${machine.id}/history`} 
            key={machine.id} 
            className={`expiring-item urgency-${machine.urgency}`}
          >
            <div className="expiring-info">
              <span className="machine-code">{machine.code}</span>
              <span className="machine-name">{machine.brand} {machine.model}</span>
            </div>
            <div className="expiring-doc-info">
              <span className="doc-name">Horas restantes</span>
              <span className="doc-expires">{machine.hrsRemaining.toLocaleString()} hrs</span>
            </div>
            <div className={`days-badge urgency-${machine.urgency}`}>
              {machine.hrsRemaining <= 50 ? (
                <span className="days-text">⚠️ {machine.hrsRemaining.toLocaleString()} hrs</span>
              ) : machine.hrsRemaining <= 150 ? (
                <span className="days-text">🟡 {machine.hrsRemaining.toLocaleString()} hrs</span>
              ) : (
                <span className="days-text">🟢 {machine.hrsRemaining.toLocaleString()} hrs</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
