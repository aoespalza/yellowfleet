import { useMemo } from 'react';
import type { Machine } from '../types/machine';
import './MaintenanceListCard.css';

interface MaintenanceListCardProps {
  machines: Machine[];
}

export function MaintenanceListCard({ machines }: MaintenanceListCardProps) {
  const items = useMemo(() => {
    return machines
      .filter(m => m.maintenanceIntervalHours && m.maintenanceIntervalHours > 0)
      .map(m => {
        const hours = m.hoursSinceLastMaintenance || 0;
        const interval = m.maintenanceIntervalHours!;
        const pct = hours / interval;
        const hoursRemaining = Math.max(0, interval - hours);
        const urgency: 'critical' | 'warning' | 'normal' =
          pct >= 1.0 ? 'critical' : pct >= 0.8 ? 'warning' : 'normal';
        return { ...m, hours, interval, pct, hoursRemaining, urgency };
      })
      .filter(m => m.urgency !== 'normal')
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 8);
  }, [machines]);

  if (items.length === 0) {
    return (
      <div className="expiring-card">
        <div className="expiring-header">
          <span className="expiring-icon">🔧</span>
          <h3>Mantenimiento Preventivo</h3>
        </div>
        <div className="expiring-empty">
          <span>✅</span>
          <p>Todas las máquinas dentro del intervalo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expiring-card">
      <div className="expiring-header">
        <span className="expiring-icon">🔧</span>
        <h3>Mantenimiento Preventivo</h3>
        <span className="expiring-count">{items.length}</span>
      </div>

      <div className="expiring-list">
        {items.map((m) => {
          const pctDisplay = Math.round(m.pct * 100);
          const barColor = m.urgency === 'critical' ? '#dc2626' : '#f59e0b';
          return (
            <div key={m.id} className={`expiring-item urgency-${m.urgency}`}>
              <div className="expiring-info">
                <span className="machine-code">{m.code}</span>
                <span className="machine-name">{m.brand} {m.model}</span>
              </div>

              {/* Barra de progreso */}
              <div style={{ width: '100%', margin: '4px 0' }}>
                <div style={{ background: '#e5e7eb', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${Math.min(pctDisplay, 100)}%`,
                    background: barColor,
                    transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  <span>{m.hours.toFixed(0)} hrs usadas</span>
                  <span>Intervalo: {m.interval} hrs</span>
                </div>
              </div>

              <div className={`days-badge urgency-${m.urgency}`}>
                {m.urgency === 'critical'
                  ? <span className="days-text">🔴 Vencido +{(m.hours - m.interval).toFixed(0)} hrs</span>
                  : <span className="days-text">🟡 Faltan {m.hoursRemaining.toFixed(0)} hrs ({pctDisplay}%)</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
