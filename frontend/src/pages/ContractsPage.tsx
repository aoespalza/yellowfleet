import { useEffect, useState } from 'react';
import { contractApi } from '../api/contractApi';
import type { Contract, ContractFormData } from '../types/contract';
import { ContractForm } from '../components/ContractForm';
import { ContractsTable } from '../components/ContractsTable';
import { AssignMachineModal } from '../components/AssignMachineModal';
import './ContractsPage.css';

const initialFormData: ContractFormData = {
  code: '',
  customer: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  value: 0,
  status: 'DRAFT',
  description: '',
};

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContractFormData>(initialFormData);
  const [assignModal, setAssignModal] = useState<{ contractId: string; contractCode: string } | null>(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await contractApi.getAll();
      setContracts(data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'value' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContractId) {
        await contractApi.update(editingContractId, formData);
      } else {
        await contractApi.create(formData);
      }
      resetForm();
      fetchContracts();
    } catch (error: any) {
      console.error('Error saving contract:', error);
      const message = error.response?.data?.error || error.message;
      alert('Error: ' + message);
    }
  };

  const handleEdit = (contract: Contract) => {
    setFormData({
      code: contract.code,
      customer: contract.customer,
      startDate: new Date(contract.startDate).toISOString().split('T')[0],
      endDate: new Date(contract.endDate).toISOString().split('T')[0],
      value: contract.value,
      status: contract.status,
      description: contract.description,
    });
    setEditingContractId(contract.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este contrato?')) {
      return;
    }
    try {
      await contractApi.delete(id);
      fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingContractId(null);
    setShowForm(false);
  };

  const handleAssignMachine = (contract: Contract) => {
    setAssignModal({ contractId: contract.id, contractCode: contract.code });
  };

  return (
    <div className="contracts-page">
      <div className="page-header">
        <h1>Gestión de Contratos</h1>
        <button
          className="btn-primary"
          onClick={() => {
            if (showForm && editingContractId) {
              resetForm();
            } else {
              setShowForm(!showForm);
            }
          }}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Contrato'}
        </button>
      </div>

      {showForm && (
        <ContractForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isEditing={!!editingContractId}
        />
      )}

      {loading ? (
        <div className="loading">Cargando contratos...</div>
      ) : (
        <>
          <ContractsTable
            contracts={contracts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAssign={handleAssignMachine}
          />
          {assignModal && (
            <AssignMachineModal
              contractId={assignModal.contractId}
              contractCode={assignModal.contractCode}
              onClose={() => setAssignModal(null)}
              onAssigned={fetchContracts}
            />
          )}
        </>
      )}
    </div>
  );
}

export default ContractsPage;
