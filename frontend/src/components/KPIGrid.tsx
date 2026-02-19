import type { ReactNode } from 'react';
import './KPIGrid.css';

interface KPIGridProps {
  children: ReactNode;
}

export function KPIGrid({ children }: KPIGridProps) {
  return <div className="kpi-grid">{children}</div>;
}
