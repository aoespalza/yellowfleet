import type { WorkOrderStatus } from '../types/workOrder';
import './WorkOrderStatusBadge.css';

interface WorkOrderStatusBadgeProps {
  status: WorkOrderStatus;
}

const statusConfig: Record<WorkOrderStatus, { label: string; className: string }> = {
  OPEN: { label: 'Abierto', className: 'workorder-status-open' },
  IN_PROGRESS: { label: 'En Progreso', className: 'workorder-status-progress' },
  WAITING_PARTS: { label: 'Esperando Repuestos', className: 'workorder-status-waiting' },
  COMPLETED: { label: 'Completado', className: 'workorder-status-completed' },
  CANCELLED: { label: 'Cancelado', className: 'workorder-status-cancelled' },
};

export function WorkOrderStatusBadge({ status }: WorkOrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.OPEN;

  return (
    <span className={`workorder-status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
