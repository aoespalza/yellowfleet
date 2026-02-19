import type { KPIMetric } from '../types/dashboard';
import './KPICard.css';

interface KPICardProps {
  metric: KPIMetric;
}

export function KPICard({ metric }: KPICardProps) {
  return (
    <div className={`kpi-card kpi-card--${metric.variant}`}>
      <div className="kpi-card__header">
        <span className="kpi-card__icon">{metric.icon}</span>
        <span className="kpi-card__title">{metric.title}</span>
      </div>
      <div className="kpi-card__value">{metric.value}</div>
      {metric.subtitle && (
        <div className="kpi-card__subtitle">{metric.subtitle}</div>
      )}
    </div>
  );
}
