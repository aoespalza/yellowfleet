import { useState, useEffect } from 'react';
import { contractApi } from '../api/contractApi';
import './AssignedMachinesModal.css';

interface AssignedMachinesModalProps {
  contractId: string;
  contractCode: string;
  onClose: () => void;
  onUnassigned: () => void;
}

interface AssignedMachine {
  id: string;
  code: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: string;
  hourlyRate: number;
  workedHours: number;
  generatedIncome: number;
  maintenanceCost: number;
  margin: number;
}

export function AssignedMachinesModal({ contractId, contractCode, onClose, onUnassigned }: AssignedMachinesModalProps) {
  const [machines, setMachines] = useState<AssignedMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [unassigning, setUnassigning] = useState<string | null>(null);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const data = await contractApi.getMachines(contractId);
      setMachines(data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (machineId: string) => {
    if (!window.confirm('¿Está seguro de desasignar esta máquina del contrato?')) return;

    setUnassigning(machineId);
    try {
      await contractApi.unassignMachine(contractId, machineId);
      onUnassigned();
      onClose();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setUnassigning(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Máquinas Asignadas</h2>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>
        <p className="modal-subtitle">Contrato: {contractCode}</p>

        {loading ? (
          <div className="loading">Cargando...</div>
        ) : machines.length === 0 ? (
          <div className="empty-state">No hay máquinas asignadas a este contrato</div>
        ) : (
          <div className="assigned-machines-list">
            {machines.map((machine) => (
              <div key={machine.id} className="assigned-machine-card">
                <div className="machine-info">
                  <div className="machine-header">
                    <span className="machine-code">{machine.code}</span>
                    <span className={`machine-status status-${machine.status.toLowerCase()}`}>
                      {machine.status === 'IN_CONTRACT' ? 'En Contrato' : machine.status}
                    </span>
                  </div>
                  <div className="machine-details">
                    <span>{machine.brand} {machine.model}</span>
                    <span>Serie: {machine.serialNumber}</span>
                  </div>
                </div>
                <div className="machine-stats">
                  <div className="stat">
                    <span className="stat-label">Tarifa/Hora</span>
                    <span className="stat-value">{formatCurrency(machine.hourlyRate)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Horas</span>
                    <span className="stat-value">{machine.workedHours.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Ingreso</span>
                    <span className="stat-value">{formatCurrency(machine.generatedIncome)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Margen</span>
                    <span className="stat-value">{formatCurrency(machine.margin)}</span>
                  </div>
                </div>
                <button 
                  className="btn-unassign"
                  onClick={() => handleUnassign(machine.id)}
                  disabled={unassigning === machine.id}
                >
                  {unassigning === machine.id ? 'Desasignando...' : '🚫 Desasignar'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
