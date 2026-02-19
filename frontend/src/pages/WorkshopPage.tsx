import { useEffect, useState } from 'react';
import { workOrderApi } from '../api/workOrderApi';
import { machineApi } from '../api/machineApi';
import type { WorkOrder, WorkOrderFormData, WorkOrderType } from '../types/workOrder';
import type { Machine } from '../types/machine';
import { WorkOrderForm } from '../components/WorkOrderForm';
import { WorkOrderLogs } from '../components/WorkOrderLogs';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkOrderId, setEditingWorkOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkOrderFormData>(initialFormData);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [activeOrders, setActiveOrders] = useState<WorkOrder[]>([]);

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
      
      // Órdenes activas (OPEN o IN_PROGRESS)
      const active = workOrdersWithMachineCode.filter(
        (wo) => wo.status === 'OPEN' || wo.status === 'IN_PROGRESS'
      );
      setActiveOrders(active);
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

  const handleSelectOrder = (order: WorkOrder) => {
    setSelectedOrder(order);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await workOrderApi.updateStatus(id, newStatus);
      fetchData();
      if (selectedOrder?.id === id) {
        const updated = workOrders.find((wo) => wo.id === id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta orden de trabajo?')) {
      return;
    }
    try {
      await workOrderApi.delete(id);
      if (selectedOrder?.id === id) {
        setSelectedOrder(null);
      }
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

  const getMachineCode = (machineId: string) => {
    const machine = machines.find((m) => m.id === machineId);
    return machine ? machine.code : machineId;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Abierta';
      case 'IN_PROGRESS': return 'En Progreso';
      case 'WAITING_PARTS': return 'Esperando Repuestos';
      case 'COMPLETED': return 'Completada';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-progress';
      case 'WAITING_PARTS': return 'status-waiting';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PREVENTIVE': return 'Preventivo';
      case 'CORRECTIVE': return 'Correctivo';
      case 'PREDICTIVE': return 'Predictivo';
      default: return type;
    }
  };

  return (
    <div className="workshop-page">
      <div className="page-header">
        <h1>Gestión de Taller</h1>
        {user?.role !== 'OPERATOR' && (
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
            {showForm ? 'Cancelar' : '+ Nueva Orden'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">Cargando órdenes de trabajo...</div>
      ) : (
        <>
          {/* Layout principal: 75% orden seleccionada + 25% activas */}
          <div className="workshop-layout">
            {/* Panel izquierdo: Orden seleccionada (75%) */}
            <div className="workshop-main">
              {selectedOrder ? (
                <div className="order-detail-card">
                  <div className="order-detail-header">
                    <div>
                      <h2>Orden de Trabajo</h2>
                      <span className="order-id">#{selectedOrder.id.slice(0, 8)}</span>
                    </div>
                    <div className="order-actions">
                      {user?.role !== 'OPERATOR' && (
                        <>
                          <button 
                            className="btn-edit-small"
                            onClick={() => handleEdit(selectedOrder)}
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            className="btn-delete-small"
                            onClick={() => handleDelete(selectedOrder.id)}
                          >
                            🗑️ Eliminar
                          </button>
                        </>
                      )}
                      {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                        <select
                          className="status-select"
                          value={selectedOrder.status}
                          onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                        >
                          <option value="OPEN">Abierta</option>
                          <option value="IN_PROGRESS">En Progreso</option>
                          <option value="WAITING_PARTS">Esperando Repuestos</option>
                          <option value="COMPLETED">Completar</option>
                          <option value="CANCELLED">Cancelar</option>
                        </select>
                      )}
                    </div>
                  </div>
                  
                  <div className="order-detail-grid">
                    <div className="order-info">
                      <label>Máquina</label>
                      <span className="order-value">{getMachineCode(selectedOrder.machineId)}</span>
                    </div>
                    <div className="order-info">
                      <label>Tipo</label>
                      <span className="order-value">{getTypeLabel(selectedOrder.type)}</span>
                    </div>
                    <div className="order-info">
                      <label>Estado</label>
                      <span className={`order-badge ${getStatusClass(selectedOrder.status)}`}>
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="order-info">
                      <label>Fecha Ingreso</label>
                      <span className="order-value">
                        {new Date(selectedOrder.entryDate).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    {selectedOrder.exitDate && (
                      <div className="order-info">
                        <label>Fecha Salida</label>
                        <span className="order-value">
                          {new Date(selectedOrder.exitDate).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                    )}
                    <div className="order-info">
                      <label>Horas Inactividad</label>
                      <span className="order-value">{selectedOrder.downtimeHours || 0}h</span>
                    </div>
                    <div className="order-info">
                      <label>Repuestos</label>
                      <span className="order-value">
                        ${selectedOrder.sparePartsCost?.toLocaleString('es-CL') || 0}
                      </span>
                    </div>
                    <div className="order-info">
                      <label>Mano de Obra</label>
                      <span className="order-value">
                        ${selectedOrder.laborCost?.toLocaleString('es-CL') || 0}
                      </span>
                    </div>
                    <div className="order-info order-info--total">
                      <label>Total</label>
                      <span className="order-value order-value--large">
                        ${((selectedOrder.sparePartsCost || 0) + (selectedOrder.laborCost || 0)).toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>

                  {showForm && (
                    <div className="order-form-container">
                      <WorkOrderForm
                        formData={formData}
                        machines={machines}
                        onChange={handleInputChange}
                        onSubmit={handleSubmit}
                        onCancel={resetForm}
                        isEditing={!!editingWorkOrderId}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="order-empty">
                  <span className="order-empty-icon">🔧</span>
                  <p>Selecciona una orden de trabajo para ver los detalles</p>
                </div>
              )}
            </div>

            {/* Panel derecho: Órdenes activas (25%) */}
            <div className="workshop-sidebar">
              <div className="active-orders-card">
                <h3>Órdenes Activas</h3>
                <span className="active-count">{activeOrders.length}</span>
                
                <div className="active-orders-list">
                  {activeOrders.length === 0 ? (
                    <p className="no-orders">No hay órdenes activas</p>
                  ) : (
                    activeOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`active-order-item ${selectedOrder?.id === order.id ? 'active-order-item--selected' : ''}`}
                        onClick={() => handleSelectOrder(order)}
                      >
                        <div className="active-order-header">
                          <span className="active-order-machine">{getMachineCode(order.machineId)}</span>
                          <span className={`active-order-status ${getStatusClass(order.status)}`}>
                            {order.status === 'OPEN' ? '🆕' : '⚙️'}
                          </span>
                        </div>
                        <div className="active-order-type">{getTypeLabel(order.type)}</div>
                        <div className="active-order-date">
                          {new Date(order.entryDate).toLocaleDateString('es-CL')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bitácora debajo (100%) */}
          {selectedOrder && (
            <div className="workshop-logs">
              <WorkOrderLogs
                workOrderId={selectedOrder.id}
                onClose={() => {}}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default WorkshopPage;
