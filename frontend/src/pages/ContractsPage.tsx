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
  value: '',
  monthlyValue: '',
  plazo: '',
  status: 'DRAFT',
  description: '',
};

interface ContractsPageProps {
  initialContractId?: string;
}

export function ContractsPage({ initialContractId }: ContractsPageProps) {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState(false); // Modo vista (no editable)
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

  // Si se pasa un contractId inicial, abrir en modo vista
  useEffect(() => {
    if (initialContractId && contracts.length > 0) {
      const contract = contracts.find(c => c.id === initialContractId);
      if (contract) {
        setEditingContractId(initialContractId);
        setShowForm(true);
        setViewMode(true); // Abrir en modo vista
        setFormData({
          code: contract.code,
          customer: contract.customer,
          startDate: contract.startDate.split('T')[0],
          endDate: contract.endDate.split('T')[0],
          value: contract.value.toString(),
          monthlyValue: contract.monthlyValue ? contract.monthlyValue.toString() : '',
          plazo: contract.plazo ? contract.plazo.toString() : '',
          status: contract.status,
          description: contract.description || '',
        });
      }
    }
  }, [initialContractId, contracts]);

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
    
    let newData = {
      ...formData,
      [name]: ['value', 'monthlyValue', 'plazo'].includes(name) ? parseFloat(value) || 0 : value,
    };
    
    // Calcular automáticamente: fecha fin según plazo
    if (name === 'startDate' || name === 'plazo') {
      const startDate = newData.startDate ? new Date(newData.startDate) : null;
      const plazo = Number(newData.plazo);
      if (startDate && plazo) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + plazo);
        newData.endDate = endDate.toISOString().split('T')[0];
      }
    }
    
    // Calcular automáticamente: valor total = mensual × plazo
    if (name === 'monthlyValue' || name === 'plazo') {
      const monthlyValue = Number(newData.monthlyValue);
      const plazo = Number(newData.plazo);
      if (monthlyValue && plazo) {
        newData.value = (monthlyValue * plazo).toString();
      }
    }
    
    setFormData(newData);
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
      value: contract.value.toString(),
      monthlyValue: contract.monthlyValue?.toString(),
      plazo: contract.plazo?.toString(),
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
    setViewMode(false);
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
          isEditing={!!editingContractId && !viewMode}
          viewMode={viewMode}
          onEnableEdit={() => setViewMode(false)}
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
