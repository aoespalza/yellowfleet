import './UtilizationChart.css';

interface UtilizationChartProps {
  percentage: number;
}

export function UtilizationChart({ percentage }: UtilizationChartProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  const getColorClass = () => {
    if (clampedPercentage >= 70) return 'utilization-chart--high';
    if (clampedPercentage >= 40) return 'utilization-chart--medium';
    return 'utilization-chart--low';
  };

  return (
    <div className={`utilization-chart ${getColorClass()}`}>
      <div className="utilization-chart__header">
        <span className="utilization-chart__label">Tasa de Utilización</span>
        <span className="utilization-chart__value">{clampedPercentage.toFixed(1)}%</span>
      </div>
      <div className="utilization-chart__bar-container">
        <div 
          className="utilization-chart__bar"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      <div className="utilization-chart__footer">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
