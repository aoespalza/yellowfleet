import type { WorkOrderFormData, WorkOrderStatus, WorkOrderType } from '../types/workOrder';
import type { Machine } from '../types/machine';

interface WorkOrderFormProps {
  formData: WorkOrderFormData;
  machines: Machine[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const statusOptions: { value: WorkOrderStatus; label: string }[] = [
  { value: 'OPEN', label: 'Abierto' },
  { value: 'IN_PROGRESS', label: 'En Progreso' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const typeOptions: { value: WorkOrderType; label: string }[] = [
  { value: 'PREVENTIVE', label: 'Preventivo' },
  { value: 'CORRECTIVE', label: 'Correctivo' },
];

export function WorkOrderForm({ formData, machines, onChange, onSubmit, onCancel, isEditing }: WorkOrderFormProps) {
  return (
    <div className="form-container">
      <h2>{isEditing ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}</h2>
      <form onSubmit={onSubmit} className="workorder-form">
        <div className="form-row">
          <div className="form-group">
            <label>Máquina</label>
            <select
              name="machineId"
              value={formData.machineId}
              onChange={onChange}
              required
            >
              <option value="">Seleccionar máquina</option>
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.code} - {machine.brand} {machine.model}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select name="type" value={formData.type} onChange={onChange} required>
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Estado</label>
            <select name="status" value={formData.status} onChange={onChange} required>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Horas de Inactividad</label>
            <input
              type="number"
              name="downtimeHours"
              value={formData.downtimeHours}
              onChange={onChange}
              required
              step="0.5"
              min="0"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Fecha de Ingreso</label>
            <input
              type="date"
              name="entryDate"
              value={formData.entryDate}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Fecha de Salida</label>
            <input
              type="date"
              name="exitDate"
              value={formData.exitDate}
              onChange={onChange}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Costo Repuestos ($)</label>
            <input
              type="number"
              name="sparePartsCost"
              value={formData.sparePartsCost}
              onChange={onChange}
              required
              step="0.01"
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Costo Mano de Obra ($)</label>
            <input
              type="number"
              name="laborCost"
              value={formData.laborCost}
              onChange={onChange}
              required
              step="0.01"
              min="0"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Costo Total ($)</label>
            <input
              type="number"
              name="totalCost"
              value={formData.totalCost}
              onChange={onChange}
              required
              step="0.01"
              min="0"
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-submit">
            {isEditing ? 'Actualizar Orden' : 'Crear Orden'}
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
