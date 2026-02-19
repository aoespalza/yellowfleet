import { useState, useEffect } from 'react';
import { contractApi } from '../api/contractApi';
import { machineApi } from '../api/machineApi';
import type { Machine } from '../types/machine';

interface AssignMachineModalProps {
  contractId: string;
  contractCode: string;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignMachineModal({ contractId, contractCode, onClose, onAssigned }: AssignMachineModalProps) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [hourlyRate, setHourlyRate] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const data = await machineApi.getAll();
      setMachines(data.filter(m => m.status === 'AVAILABLE'));
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || hourlyRate <= 0) return;

    setSaving(true);
    try {
      await contractApi.assignMachine(contractId, selectedMachine, hourlyRate);
      onAssigned();
      onClose();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Asignar Máquina a Contrato</h2>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>
        <p className="modal-subtitle">Contrato: {contractCode}</p>

        <form onSubmit={handleAssign}>
          <div className="form-group">
            <label>Máquina</label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              required
            >
              <option value="">Seleccionar máquina...</option>
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.code} ({machine.serialNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tarifa por Hora ($)</label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? 'Asignando...' : 'Asignar'}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
