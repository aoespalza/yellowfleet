import type { WorkOrderStatus } from '../types/workOrder';
import './WorkOrderStatusBadge.css';

interface WorkOrderStatusBadgeProps {
  status: WorkOrderStatus;
}

const statusConfig: Record<WorkOrderStatus, { label: string; className: string }> = {
  OPEN: { label: 'Abierto', className: 'workorder-status-open' },
  IN_PROGRESS: { label: 'En Progreso', className: 'workorder-status-progress' },
  CLOSED: { label: 'Cerrado', className: 'workorder-status-closed' },
};

export function WorkOrderStatusBadge({ status }: WorkOrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.OPEN;

  return (
    <span className={`workorder-status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
