import type { ContractFormData, ContractStatus } from '../types/contract';

interface ContractFormProps {
  formData: ContractFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const statusOptions: { value: ContractStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export function ContractForm({ formData, onChange, onSubmit, onCancel, isEditing }: ContractFormProps) {
  return (
    <div className="form-container">
      <h2>{isEditing ? 'Editar Contrato' : 'Nuevo Contrato'}</h2>
      <form onSubmit={onSubmit} className="contract-form">
        <div className="form-row">
          <div className="form-group">
            <label>Código</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={onChange}
              required
              placeholder="CTR-001"
            />
          </div>
          <div className="form-group">
            <label>Cliente</label>
            <input
              type="text"
              name="customer"
              value={formData.customer}
              onChange={onChange}
              required
              placeholder="Empresa Constructora XYZ"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Plazo (meses)</label>
            <input
              type="number"
              name="plazo"
              value={formData.plazo || ''}
              onChange={onChange}
              placeholder="0"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Valor Mensual ($)</label>
            <input
              type="number"
              name="monthlyValue"
              value={formData.monthlyValue || ''}
              onChange={onChange}
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div className="form-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={onChange}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Valor Total ($)</label>
            <input
              type="number"
              name="value"
              value={formData.value}
              onChange={onChange}
              required
              step="0.01"
              placeholder="0.00"
              readOnly
            />
          </div>
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
        </div>
        <div className="form-row">
          <div className="form-group form-group--full">
            <label>Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onChange}
              rows={3}
              placeholder="Descripción del contrato..."
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-submit">
            {isEditing ? 'Actualizar Contrato' : 'Crear Contrato'}
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
