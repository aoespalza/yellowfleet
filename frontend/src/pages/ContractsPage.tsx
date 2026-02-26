import { useEffect, useState } from 'react';
import { contractApi } from '../api/contractApi';
import type { Contract, ContractFormData } from '../types/contract';
import { ContractForm } from '../components/ContractForm';
import { ContractsTable } from '../components/ContractsTable';
import { AssignMachineModal } from '../components/AssignMachineModal';
import { AssignedMachinesModal } from '../components/AssignedMachinesModal';
import { useAuth } from '../context/AuthContext';
import './ContractsPage.css';

// Función para obtener la fecha local en formato YYYY-MM-DD
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const initialFormData: ContractFormData = {
  code: '',
  customer: '',
  startDate: getLocalDateString(),
  endDate: getLocalDateString(),
  value: 0,
  status: 'DRAFT',
  description: '',
};

export function ContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContractFormData>(initialFormData);
  const [assignModal, setAssignModal] = useState<{ contractId: string; contractCode: string } | null>(null);
  const [assignedMachinesModal, setAssignedMachinesModal] = useState<{ contractId: string; contractCode: string } | null>(null);

  // Filtros
  const [filters, setFilters] = useState<Record<string, string>>({
    code: '',
    customer: '',
    status: '',
    startDate: '',
    endDate: '',
    value: '',
  });

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
    window.scrollTo(0, 0);
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

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      code: '',
      customer: '',
      status: '',
      startDate: '',
      endDate: '',
      value: '',
    });
  };

  const filteredContracts: Contract[] = contracts.filter((contract) => {
    const f = filters;
    return (
      (f.code === '' || contract.code.toLowerCase().includes(f.code.toLowerCase())) &&
      (f.customer === '' || contract.customer.toLowerCase().includes(f.customer.toLowerCase())) &&
      (f.status === '' || contract.status === f.status) &&
      (f.startDate === '' || contract.startDate.includes(f.startDate)) &&
      (f.endDate === '' || contract.endDate.includes(f.endDate)) &&
      (f.value === '' || contract.value.toString().includes(f.value))
    );
  });

  const handleAssignMachine = (contract: Contract) => {
    setAssignModal({ contractId: contract.id, contractCode: contract.code });
  };

  return (
    <div className="contracts-page">
      <div className="page-header">
        <h1>Gestión de Contratos</h1>
        {user?.role !== 'OPERATOR' && (
          <button
            className="btn-primary"
            onClick={() => {
              if (showForm && editingContractId) {
                resetForm();
              } else {
                setShowForm(!showForm);
                window.scrollTo(0, 0);
              }
            }}
          >
            {showForm ? 'Cancelar' : '+ Nuevo Contrato'}
          </button>
        )}
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
            contracts={filteredContracts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAssign={handleAssignMachine}
            onViewMachines={(contract) => setAssignedMachinesModal({ contractId: contract.id, contractCode: contract.code })}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />
          {assignModal && (
            <AssignMachineModal
              contractId={assignModal.contractId}
              contractCode={assignModal.contractCode}
              onClose={() => setAssignModal(null)}
              onAssigned={fetchContracts}
            />
          )}
          {assignedMachinesModal && (
            <AssignedMachinesModal
              contractId={assignedMachinesModal.contractId}
              contractCode={assignedMachinesModal.contractCode}
              onClose={() => setAssignedMachinesModal(null)}
              onUnassigned={fetchContracts}
            />
          )}
        </>
      )}
    </div>
  );
}

export default ContractsPage;
