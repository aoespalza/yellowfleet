import type { Contract } from '../types/contract';
import { ContractStatusBadge } from './ContractStatusBadge';

interface ContractsTableProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (id: string) => void;
  onAssign: (contract: Contract) => void;
}

export function ContractsTable({ contracts, onEdit, onDelete, onAssign }: ContractsTableProps) {
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
            <th>Código</th>
            <th>Cliente</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Valor</th>
            <th>Máquinas</th>
            <th>Estado</th>
            <th>Acciones</th>
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
                    className="btn-assign"
                    onClick={() => onAssign(contract)}
                    title="Asignar Máquina"
                  >
                    🏗️
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
