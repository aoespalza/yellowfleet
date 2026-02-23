import { useEffect, useState, useMemo } from 'react';
import { workOrderApi } from '../api/workOrderApi';
import { machineApi } from '../api/machineApi';
import type { WorkOrder, WorkOrderFormData, WorkOrderType } from '../types/workOrder';
import type { Machine } from '../types/machine';
import { WorkOrderForm } from '../components/WorkOrderForm';
import { WorkOrderLogs } from '../components/WorkOrderLogs';
import { useAuth } from '../context/AuthContext';
import './WorkshopPage.css';

// Función para obtener la fecha local en formato YYYY-MM-DD
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const initialFormData: WorkOrderFormData = {
  machineId: '',
  type: 'CORRECTIVE' as WorkOrderType,
  status: 'OPEN',
  entryDate: getLocalDateString(),
  exitDate: '',
  sparePartsCost: 0,
  laborCost: 0,
  totalCost: 0,
  downtimeHours: 0,
};

type FilterStatus = 'ALL' | 'OPEN' | 'CLOSED';

export function WorkshopPage() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkOrderId, setEditingWorkOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkOrderFormData>(initialFormData);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  
  // Modal de cierre de orden
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);
  const [closingMachineId, setClosingMachineId] = useState<string | null>(null);
  const [exitDateTime, setExitDateTime] = useState('');
  const [sparePartsCost, setSparePartsCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [uploadInvoices, setUploadInvoices] = useState(false);
  
  // Reset de vida útil al cerrar orden (solo para preventivos)
  const [closingOrderType, setClosingOrderType] = useState<'PREVENTIVE' | 'CORRECTIVE' | null>(null);
  const [newUsefulLifeHours, setNewUsefulLifeHours] = useState<number>(10000);
  
  // Filtros
  const [searchMachine, setSearchMachine] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

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

  const getMachineCode = (machineId: string) => {
    const machine = machines.find((m) => m.id === machineId);
    return machine ? machine.code : machineId;
  };

  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const machineCode = getMachineCode(wo.machineId).toLowerCase();
      const searchLower = searchMachine.toLowerCase();
      const matchesSearch = machineCode.includes(searchLower);
      
      const isOpen = wo.status === 'OPEN' || wo.status === 'IN_PROGRESS' || wo.status === 'WAITING_PARTS';
      const isClosed = wo.status === 'COMPLETED' || wo.status === 'CANCELLED';
      
      let matchesStatus = true;
      if (filterStatus === 'OPEN') {
        matchesStatus = isOpen;
      } else if (filterStatus === 'CLOSED') {
        matchesStatus = isClosed;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [workOrders, searchMachine, filterStatus]);

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
        entryDate: formData.entryDate ? new Date(formData.entryDate) : new Date(),
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
      // Si el nuevo estado es COMPLETED, abrir modal para seleccionar fecha/hora
      if (newStatus === 'COMPLETED') {
        setClosingOrderId(id);
        // Por defecto, proponer la fecha/hora actual
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setExitDateTime(now.toISOString().slice(0, 16));
        
        // Cargar valores actuales de la orden
        const order = workOrders.find(wo => wo.id === id);
        if (order) {
          setSparePartsCost(order.sparePartsCost || 0);
          setLaborCost(order.laborCost || 0);
          setClosingMachineId(order.machineId);
          setClosingOrderType(order.type as 'PREVENTIVE' | 'CORRECTIVE');
          
          // Cargar horas de vida útil actual de la máquina (solo para preventivos)
          if (order.type === 'PREVENTIVE') {
            const machine = machines.find(m => m.id === order.machineId);
            if (machine?.usefulLifeHours) {
              setNewUsefulLifeHours(machine.usefulLifeHours);
            } else {
              setNewUsefulLifeHours(10000);
            }
          }
        }
        
        setShowCloseModal(true);
      } else {
        await workOrderApi.updateStatus(id, newStatus);
        fetchData();
        if (selectedOrder?.id === id) {
          const updated = workOrders.find((wo) => wo.id === id);
          if (updated) setSelectedOrder({ ...updated, status: newStatus as any });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCloseOrder = async () => {
    if (!closingOrderId || !exitDateTime) return;
    
    // Si tiene facturas por cargar,avisar y no cerrar
    if (uploadInvoices) {
      alert('Por favor, primero carga las facturas en la bitácora de la orden (usa el botón "Agregar Nota" o "Subir Archivo") y luego cierra la orden.');
      return;
    }
    
    // Validar que se ingresen las horas de vida útil para preventivos
    if (closingOrderType === 'PREVENTIVE' && (!newUsefulLifeHours || newUsefulLifeHours <= 0)) {
      alert('Para mantenimientos preventivos es obligatorio ingresar las nuevas horas de vida útil.');
      return;
    }
    
    try {
      const exitDate = new Date(exitDateTime);
      await workOrderApi.close(closingOrderId, exitDate, sparePartsCost, laborCost);
      
      // Reset de vida útil es obligatorio para preventivos
      if (closingOrderType === 'PREVENTIVE' && closingMachineId && newUsefulLifeHours > 0) {
        try {
          await machineApi.resetUsefulLifeHours(closingMachineId, newUsefulLifeHours);
        } catch (resetError) {
          console.error('Error resetting useful life hours:', resetError);
          // No bloqueamos el cierre por error en el reset
        }
      }
      
      setShowCloseModal(false);
      setClosingOrderId(null);
      setClosingMachineId(null);
      setClosingOrderType(null);
      setExitDateTime('');
      setSparePartsCost(0);
      setLaborCost(0);
      setUploadInvoices(false);
      setNewUsefulLifeHours(10000);
      fetchData();
      if (selectedOrder?.id === closingOrderId) {
        const updated = workOrders.find((wo) => wo.id === closingOrderId);
        if (updated) setSelectedOrder({ ...updated, status: 'COMPLETED' as any });
      }
    } catch (error) {
      console.error('Error closing work order:', error);
    }
  };

  const handleCancelClose = () => {
    setShowCloseModal(false);
    setClosingOrderId(null);
    setClosingMachineId(null);
    setClosingOrderType(null);
    setExitDateTime('');
    setSparePartsCost(0);
    setLaborCost(0);
    setUploadInvoices(false);
    setNewUsefulLifeHours(10000);
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
              {showForm ? (
                <div className="order-form-full">
                  <WorkOrderForm
                    formData={formData}
                    machines={machines}
                    onChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                    isEditing={!!editingWorkOrderId}
                  />
                </div>
              ) : selectedOrder ? (
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
              <div className="filters-card">
                <h3>Buscar Ordenes</h3>
                
                <div className="filter-group">
                  <label>Por Máquina</label>
                  <input
                    type="text"
                    placeholder="Código de máquina..."
                    value={searchMachine}
                    onChange={(e) => setSearchMachine(e.target.value)}
                    className="filter-input"
                  />
                </div>
                
                <div className="filter-group">
                  <label>Estado</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    className="filter-select"
                  >
                    <option value="ALL">Todas</option>
                    <option value="OPEN">Abiertas</option>
                    <option value="CLOSED">Cerradas</option>
                  </select>
                </div>
                
                <div className="filter-results">
                  {filteredOrders.length} orden(es) encontrada(s)
                </div>
              </div>
              
              <div className="active-orders-card">
                <h3>Órdenes de Trabajo</h3>
                <span className="active-count">{filteredOrders.length}</span>
                
                <div className="active-orders-list">
                  {filteredOrders.length === 0 ? (
                    <p className="no-orders">No se encontraron órdenes</p>
                  ) : (
                    filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`active-order-item ${selectedOrder?.id === order.id ? 'active-order-item--selected' : ''}`}
                        onClick={() => handleSelectOrder(order)}
                      >
                        <div className="active-order-header">
                          <span className="active-order-machine">{getMachineCode(order.machineId)}</span>
                          <span className={`active-order-status ${getStatusClass(order.status)}`}>
                            {order.status === 'OPEN' ? '🆕' : order.status === 'COMPLETED' ? '✅' : order.status === 'CANCELLED' ? '❌' : '⚙️'}
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

          {/* Modal para cerrar orden */}
          {showCloseModal && (
            <div className="modal-overlay" onClick={handleCancelClose}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Cerrar Orden de Trabajo</h2>
                <p>Ingrese los datos del cierre:</p>
                
                <div className="form-group">
                  <label>Fecha y Hora de Salida</label>
                  <input
                    type="datetime-local"
                    value={exitDateTime}
                    onChange={(e) => setExitDateTime(e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Valor Repuestos ($)</label>
                  <input
                    type="number"
                    value={sparePartsCost}
                    onChange={(e) => setSparePartsCost(Number(e.target.value))}
                    className="form-input"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Valor Mano de Obra ($)</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(Number(e.target.value))}
                    className="form-input"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={uploadInvoices}
                      onChange={(e) => setUploadInvoices(e.target.checked)}
                    />
                    <span>Si tienes facturas por cargar, hazlo primero antes de cerrar el caso</span>
                  </label>
                </div>

                {/* Sección de Reset de Vida Útil - SOLO para preventivos (OBLIGATORIO) */}
                {closingOrderType === 'PREVENTIVE' && (
                  <div className="form-group reset-useful-life-section">
                    <div className="reset-mandatory-notice">
                      <span className="notice-icon">🔄</span>
                      <span>El mantenimiento preventivo requiere actualizar las horas de vida útil</span>
                    </div>
                    <div className="reset-useful-life-input">
                      <label>Nuevas horas de vida útil:</label>
                      <input
                        type="number"
                        value={newUsefulLifeHours}
                        onChange={(e) => setNewUsefulLifeHours(Number(e.target.value))}
                        className="form-input"
                        placeholder="10000"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                )}
                
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={handleCancelClose}>
                    Cancelar
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleCloseOrder}
                    disabled={closingOrderType === 'PREVENTIVE' && (!newUsefulLifeHours || newUsefulLifeHours <= 0)}
                    title={closingOrderType === 'PREVENTIVE' && (!newUsefulLifeHours || newUsefulLifeHours <= 0) ? 'Debe ingresar las nuevas horas de vida útil' : ''}
                  >
                    Cerrar Orden
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
