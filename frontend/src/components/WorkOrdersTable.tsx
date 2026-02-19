import type { WorkOrder } from '../types/workOrder';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';

interface WorkOrdersTableProps {
  workOrders: WorkOrder[];
  onEdit: (workOrder: WorkOrder) => void;
  onDelete: (id: string) => void;
}

const typeLabels: Record<string, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  PREDICTIVE: 'Predictivo',
};

export function WorkOrdersTable({ workOrders, onEdit, onDelete }: WorkOrdersTableProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (workOrders.length === 0) {
    return <div className="empty-state">No hay órdenes de trabajo registradas</div>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Máquina</th>
            <th>Tipo</th>
            <th>Ingreso</th>
            <th>Salida</th>
            <th>Repuestos</th>
            <th>Mano Obra</th>
            <th>Total</th>
            <th>Horas Inact.</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {workOrders.map((workOrder) => (
            <tr key={workOrder.id}>
              <td>{workOrder.machineCode || workOrder.machineId}</td>
              <td>{typeLabels[workOrder.type] || workOrder.type}</td>
              <td>{formatDate(workOrder.entryDate)}</td>
              <td>{formatDate(workOrder.exitDate)}</td>
              <td>{formatCurrency(workOrder.sparePartsCost)}</td>
              <td>{formatCurrency(workOrder.laborCost)}</td>
              <td>{formatCurrency(workOrder.totalCost)}</td>
              <td>{workOrder.downtimeHours !== null && workOrder.downtimeHours !== undefined ? `${workOrder.downtimeHours}h` : '—'}</td>
              <td>
                <WorkOrderStatusBadge status={workOrder.status} />
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-edit"
                    onClick={() => onEdit(workOrder)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => onDelete(workOrder.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
