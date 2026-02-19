import { useEffect, useState } from 'react';
import { workOrderApi } from '../api/workOrderApi';
import { machineApi } from '../api/machineApi';
import type { WorkOrder, WorkOrderFormData, WorkOrderType } from '../types/workOrder';
import type { Machine } from '../types/machine';
import { WorkOrderForm } from '../components/WorkOrderForm';
import { WorkOrdersTable } from '../components/WorkOrdersTable';
import './WorkshopPage.css';

const initialFormData: WorkOrderFormData = {
  machineId: '',
  type: 'PREVENTIVE' as WorkOrderType,
  status: 'OPEN',
  entryDate: new Date().toISOString().split('T')[0],
  exitDate: '',
  sparePartsCost: 0,
  laborCost: 0,
  totalCost: 0,
  downtimeHours: 0,
};

export function WorkshopPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkOrderId, setEditingWorkOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkOrderFormData>(initialFormData);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workOrdersData, machinesData] = await Promise.all([
        workOrderApi.getAll(),
        machineApi.getAll(),
      ]);
      
      const workOrdersWithMachineCode = workOrdersData.map((wo) => {
        const machine = machinesData.find((m) => m.id === wo.machineId);
        return {
          ...wo,
          machineCode: machine ? `${machine.code}` : wo.machineId,
        };
      });
      
      setWorkOrders(workOrdersWithMachineCode);
      setMachines(machinesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'sparePartsCost' || name === 'laborCost' || name === 'totalCost' || name === 'downtimeHours'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        machineId: formData.machineId,
        type: formData.type as 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE',
        entryDate: new Date(formData.entryDate),
        sparePartsCost: Number(formData.sparePartsCost),
        laborCost: Number(formData.laborCost),
      };
      
      console.log('Sending payload:', JSON.stringify(payload));
      
      if (editingWorkOrderId) {
        await workOrderApi.update(editingWorkOrderId, payload);
      } else {
        await workOrderApi.create(payload);
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving work order:', error);
    }
  };

  const handleEdit = (workOrder: WorkOrder) => {
    setFormData({
      machineId: workOrder.machineId,
      type: workOrder.type,
      status: workOrder.status,
      entryDate: new Date(workOrder.entryDate).toISOString().split('T')[0],
      exitDate: workOrder.exitDate ? new Date(workOrder.exitDate).toISOString().split('T')[0] : '',
      sparePartsCost: workOrder.sparePartsCost || 0,
      laborCost: workOrder.laborCost || 0,
      totalCost: workOrder.totalCost || 0,
      downtimeHours: workOrder.downtimeHours || 0,
    });
    setEditingWorkOrderId(workOrder.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta orden de trabajo?')) {
      return;
    }
    try {
      await workOrderApi.delete(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting work order:', error);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingWorkOrderId(null);
    setShowForm(false);
  };

  return (
    <div className="workshop-page">
      <div className="page-header">
        <h1>Gestión de Taller</h1>
        <button
          className="btn-primary"
          onClick={() => {
            if (showForm && editingWorkOrderId) {
              resetForm();
            } else {
              setShowForm(!showForm);
            }
          }}
        >
          {showForm ? 'Cancelar' : '+ Nueva Orden de Trabajo'}
        </button>
      </div>

      {showForm && (
        <WorkOrderForm
          formData={formData}
          machines={machines}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isEditing={!!editingWorkOrderId}
        />
      )}

      {loading ? (
        <div className="loading">Cargando órdenes de trabajo...</div>
      ) : (
        <WorkOrdersTable
          workOrders={workOrders}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default WorkshopPage;
