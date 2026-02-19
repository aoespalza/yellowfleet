import type { ContractStatus } from '../types/contract';
import './ContractStatusBadge.css';

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

const statusConfig: Record<ContractStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Borrador', className: 'contract-status-draft' },
  ACTIVE: { label: 'Activo', className: 'contract-status-active' },
  COMPLETED: { label: 'Completado', className: 'contract-status-completed' },
  CANCELLED: { label: 'Cancelado', className: 'contract-status-cancelled' },
};

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <span className={`contract-status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
