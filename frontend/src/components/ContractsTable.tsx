import type { Contract } from '../types/contract';
import { ContractStatusBadge } from './ContractStatusBadge';

interface ContractsTableProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (id: string) => void;
  onAssign: (contract: Contract) => void;
  onViewMachines: (contract: Contract) => void;
  filters?: Record<string, string>;
  onFilterChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onClearFilters?: () => void;
}

export function ContractsTable({ 
  contracts, 
  onEdit, 
  onDelete, 
  onAssign, 
  onViewMachines,
  filters,
  onFilterChange,
  onClearFilters
}: ContractsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (contracts.length === 0) {
    return <div className="empty-state">No hay contratos registrados</div>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>
              {filters && onFilterChange ? (
                <input type="text" name="code" placeholder="Código" value={filters.code || ''} onChange={onFilterChange} className="filter-input" />
              ) : 'Código'}
            </th>
            <th>
              {filters && onFilterChange ? (
                <input type="text" name="customer" placeholder="Cliente" value={filters.customer || ''} onChange={onFilterChange} className="filter-input" />
              ) : 'Cliente'}
            </th>
            <th>
              {filters && onFilterChange ? (
                <input type="date" name="startDate" value={filters.startDate || ''} onChange={onFilterChange} className="filter-input" />
              ) : 'Inicio'}
            </th>
            <th>
              {filters && onFilterChange ? (
                <input type="date" name="endDate" value={filters.endDate || ''} onChange={onFilterChange} className="filter-input" />
              ) : 'Fin'}
            </th>
            <th>
              {filters && onFilterChange ? (
                <input type="text" name="value" placeholder="Valor" value={filters.value || ''} onChange={onFilterChange} className="filter-input" />
              ) : 'Valor'}
            </th>
            <th>Máquinas</th>
            <th>
              {filters && onFilterChange ? (
                <select name="status" value={filters.status || ''} onChange={onFilterChange} className="filter-input">
                  <option value="">Todos</option>
                  <option value="DRAFT">Borrador</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="COMPLETED">Completado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              ) : 'Estado'}
            </th>
            <th>
              {filters && onClearFilters && (
                <button onClick={onClearFilters} className="btn-clear-filters" title="Limpiar filtros">✕</button>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id}>
              <td>{contract.code}</td>
              <td>{contract.customer}</td>
              <td>{formatDate(contract.startDate)}</td>
              <td>{formatDate(contract.endDate)}</td>
              <td>{formatCurrency(contract.value)}</td>
              <td>
                <span className="machine-count">{contract.machineCount}</span>
              </td>
              <td>
                <ContractStatusBadge status={contract.status} />
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-view"
                    onClick={() => onViewMachines(contract)}
                    title="Ver Máquinas Asignadas"
                  >
                    🏗️
                  </button>
                  <button
                    className="btn-assign"
                    onClick={() => onAssign(contract)}
                    title="Asignar Máquina"
                  >
                    ➕
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => onEdit(contract)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => onDelete(contract.id)}
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
