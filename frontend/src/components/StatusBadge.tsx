import type { MachineStatus } from '../types/machine';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: MachineStatus;
}

const statusConfig: Record<MachineStatus, { label: string; className: string }> = {
  AVAILABLE: { label: 'Disponible', className: 'status-available' },
  IN_CONTRACT: { label: 'En Contrato', className: 'status-contract' },
  IN_WORKSHOP: { label: 'En Taller', className: 'status-workshop' },
  IN_TRANSFER: { label: 'En Traslado', className: 'status-transfer' },
  INACTIVE: { label: 'Inactivo', className: 'status-inactive' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.INACTIVE;
  
  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
