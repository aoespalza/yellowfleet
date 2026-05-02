import { useState, useEffect } from 'react';
import { equipmentApi } from '../api/equipmentApi';
import { operatorApi } from '../api/operatorApi';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_SIZES, CLOTHING_TYPES } from '../types/equipment';
import type { Equipment, OperatorEquipmentWithDetails, CreateEquipmentDTO, DeliverEquipmentDTO } from '../types/equipment';
import type { Operator } from '../types/operator';
import './EquipmentPage.css';

type PendingItem = {
  equipmentId: string;
  equipmentName: string;
  category: string;
  categoryLabel: string;
};

type PendingByOperator = {
  operatorId: string;
  operatorName: string;
  jobId: string | null;
  jobName: string | null;
  pendingItems: PendingItem[];
};

export default function EquipmentPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'deliveries' | 'alerts'>('catalog');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [deliveries, setDeliveries] = useState<OperatorEquipmentWithDetails[]>([]);
  const [overdue, setOverdue] = useState<OperatorEquipmentWithDetails[]>([]);
  const [upcoming, setUpcoming] = useState<OperatorEquipmentWithDetails[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [pendingByOperator, setPendingByOperator] = useState<PendingByOperator[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [formData, setFormData] = useState<CreateEquipmentDTO>({
    name: '',
    category: 'PROTECTION_CRANIAL',
    clothingType: undefined,
    description: '',
    defaultPeriodicityDays: 30,
    hasSizes: false
  });
  const [deliverData, setDeliverData] = useState<DeliverEquipmentDTO>({
    operatorId: '',
    equipmentId: '',
    quantity: 1,
    size: undefined,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eqRes, delRes, ovRes, upRes, opRes, pendingRes] = await Promise.all([
        equipmentApi.getCatalog(),
        equipmentApi.getAllDeliveries(),
        equipmentApi.getOverdue(),
        equipmentApi.getUpcoming(14),
        operatorApi.getAll(),
        equipmentApi.getAllPending()
      ]);
      setEquipment(eqRes || []);
      setDeliveries(delRes || []);
      setOverdue(ovRes || []);
      setUpcoming(upRes || []);
      setOperators(opRes || []);
      setPendingByOperator(pendingRes || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating equipment:', formData);
    try {
      const result = await equipmentApi.create(formData);
      console.log('Created:', result);
      setShowModal(false);
      setFormData({ name: '', category: 'PROTECTION_CRANIAL', description: '', defaultPeriodicityDays: 30 });
      loadData();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al crear equipo');
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('¿Eliminar este equipo del catálogo?')) return;
    try {
      await equipmentApi.delete(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleDeliver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await equipmentApi.deliver(deliverData);
      setShowDeliverModal(false);
      setDeliverData({ operatorId: '', equipmentId: '', quantity: 1, notes: '' });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al entregar');
    }
  };

  const handleDeleteDelivery = async (id: string) => {
    if (!confirm('¿Eliminar esta entrega?')) return;
    try {
      await equipmentApi.deleteDelivery(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('es-CO');
  const isOverdue = (nextDate: string) => new Date(nextDate) < new Date();

  // Filtrar por tipo
  const protectionEquipment = equipment.filter(eq => eq.category !== 'CLOTHING');
  const clothingEquipment = equipment.filter(eq => eq.category === 'CLOTHING');

  if (loading) {
    return <div className="equipment-page">Cargando...</div>;
  }

  return (
    <div className="equipment-page">
      <div className="page-header">
        <h1>🛡️ Dotación EPP</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowDeliverModal(true)}>
            ➕ Entregar Dotación
          </button>
          <button className="btn-secondary" onClick={() => setShowModal(true)}>
            ➕ Agregar al Catálogo
          </button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          📦 Catálogo EPP ({equipment.length})
        </button>
        <button 
          className={`tab ${activeTab === 'deliveries' ? 'active' : ''}`}
          onClick={() => setActiveTab('deliveries')}
        >
          📋 Entregas ({deliveries.length})
        </button>
        <button 
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          ⚠️ Alertas 
          {overdue.length > 0 && <span className="badge danger">{overdue.length}</span>}
        </button>
      </div>

      {activeTab === 'catalog' && (
        <div className="catalog-section">
          {/* EPP - Equipos de Protección Personal */}
          <div className="catalog-subsection">
            <h2 className="subsection-title">🛡️ Equipos de Protección Personal (EPP)</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Periodicidad</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {protectionEquipment.map(eq => (
                  <tr key={eq.id}>
                    <td><strong>{eq.name}</strong></td>
                    <td>{EQUIPMENT_CATEGORIES.find(c => c.value === eq.category)?.label}</td>
                    <td>{eq.defaultPeriodicityDays} días</td>
                    <td>{eq.description || '-'}</td>
                    <td>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDeleteEquipment(eq.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {protectionEquipment.length === 0 && (
                  <tr><td colSpan={5}>No hay equipos de protección en el catálogo</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Ropa - Prendas de Vestir */}
          <div className="catalog-subsection">
            <h2 className="subsection-title">👕 Ropa y Prendas</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Tallas</th>
                  <th>Periodicidad</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clothingEquipment.map(eq => (
                  <tr key={eq.id}>
                    <td><strong>{eq.name}</strong></td>
                    <td>{eq.clothingType ? CLOTHING_TYPES.find(c => c.value === eq.clothingType)?.label : '-'}</td>
                    <td>{eq.hasSizes ? 'Sí' : 'No'}</td>
                    <td>{eq.defaultPeriodicityDays} días</td>
                    <td>{eq.description || '-'}</td>
                    <td>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDeleteEquipment(eq.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {clothingEquipment.length === 0 && (
                  <tr><td colSpan={6}>No hay prendas de ropa en el catálogo</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'deliveries' && (
        <div className="deliveries-section">
          <table className="data-table">
            <thead>
              <tr>
                <th>Operario</th>
                <th>EPP</th>
                <th>Tipo</th>
                <th>Fecha Entrega</th>
                <th>Próxima Entrega</th>
                <th>Talla</th>
                <th>Cantidad</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map(d => (
                <tr key={d.id} className={isOverdue(d.nextDeliveryDate) ? 'overdue-row' : ''}>
                  <td>{d.operator.name}</td>
                  <td>{d.equipment.name}</td>
                  <td>{d.equipment.clothingType ? CLOTHING_TYPES.find(c => c.value === d.equipment.clothingType)?.label || '-' : '-'}</td>
                  <td>{formatDate(d.deliveryDate)}</td>
                  <td className={isOverdue(d.nextDeliveryDate) ? 'text-danger' : ''}>
                    {formatDate(d.nextDeliveryDate)}
                  </td>
                  <td>{d.size || '-'}</td>
                  <td>{d.quantity}</td>
                  <td>{d.notes || '-'}</td>
                  <td>
                    <button 
                      className="btn-icon danger" 
                      onClick={() => handleDeleteDelivery(d.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr><td colSpan={9}>No hay entregas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="alerts-section">
          {/* Dotación pendiente por cargo */}
          <div className="alert-section">
            <h2 className="subsection-title">📋 Dotación Pendiente por Cargo</h2>
            <p className="alert-description">
              Muestra los elementos de dotación que cada operador <strong>no ha recibido</strong> según su cargo
            </p>
            {pendingByOperator.length > 0 ? (
              <div className="pending-grid">
                {pendingByOperator.map(item => (
                  <div key={item.operatorId} className="pending-card">
                    <div className="pending-header">
                      <h3>{item.operatorName}</h3>
                      <span className="job-badge">{item.jobName || 'Sin cargo'}</span>
                    </div>
                    <div className="pending-items">
                      {item.pendingItems.map((eq, idx) => (
                        <span key={idx} className="pending-tag">
                          {eq.equipmentName}
                        </span>
                      ))}
                    </div>
                    <p className="pending-count">
                      {item.pendingItems.length} elemento(s) pendiente(s)
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-pending">✅ Todos los operadores tienen su dotación completa</p>
            )}
          </div>

          {/* Entregas vencidas y próximas */}
          <div className="alert-cards">
            <div className="alert-card overdue">
              <h3>⚠️ Vencidas</h3>
              <p className="count">{overdue.length}</p>
              <div className="alert-list">
                {overdue.map(d => (
                  <div key={d.id} className="alert-item">
                    <span className="operator">{d.operator.name}</span>
                    <span className="equipment">{d.equipment.name}</span>
                    <span className="date">Venció: {formatDate(d.nextDeliveryDate)}</span>
                  </div>
                ))}
                {overdue.length === 0 && <p>No hay entregas vencidas</p>}
              </div>
            </div>
            
            <div className="alert-card upcoming">
              <h3>📅 Próximas (14 días)</h3>
              <p className="count">{upcoming.length}</p>
              <div className="alert-list">
                {upcoming.map(d => (
                  <div key={d.id} className="alert-item">
                    <span className="operator">{d.operator.name}</span>
                    <span className="equipment">{d.equipment.name}</span>
                    <span className="date">Entrega: {formatDate(d.nextDeliveryDate)}</span>
                  </div>
                ))}
                {upcoming.length === 0 && <p>No hay entregas próximas</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Equipo */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Agregar al Catálogo</h2>
            <form onSubmit={handleCreateEquipment}>
              <div className="form-group">
                <label>Nombre *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Categoría *</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as any, clothingType: e.target.value === 'CLOTHING' ? formData.clothingType : undefined})}
                >
                  {EQUIPMENT_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              {formData.category === 'CLOTHING' && (
                <div className="form-group">
                  <label>Tipo de Prenda *</label>
                  <select 
                    value={formData.clothingType || ''}
                    onChange={e => setFormData({...formData, clothingType: e.target.value as any})}
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    {CLOTHING_TYPES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Periodicidad (días) *</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.defaultPeriodicityDays || ''}
                  onChange={e => setFormData({...formData, defaultPeriodicityDays: parseInt(e.target.value) || 30})}
                  required 
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={formData.hasSizes || false}
                    onChange={e => setFormData({...formData, hasSizes: e.target.checked})}
                  />
                  <span>Requiere talla (prendas de ropa)</span>
                </label>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Entregar Dotación */}
      {showDeliverModal && (
        <div className="modal-overlay" onClick={() => setShowDeliverModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Entregar Dotación</h2>
            <form onSubmit={handleDeliver}>
              <div className="form-group">
                <label>Operario *</label>
                <select 
                  value={deliverData.operatorId}
                  onChange={e => setDeliverData({...deliverData, operatorId: e.target.value})}
                  required
                >
                  <option value="">Seleccionar operario</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>{op.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>EPP *</label>
                <select 
                  value={deliverData.equipmentId}
                  onChange={e => setDeliverData({...deliverData, equipmentId: e.target.value, size: undefined})}
                  required
                >
                  <option value="">Seleccionar EPP</option>
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.defaultPeriodicityDays} días){eq.hasSizes ? ' - ⚠️ Con talla' : ''}</option>
                  ))}
                </select>
              </div>
              {equipment.find(e => e.id === deliverData.equipmentId)?.hasSizes && (
                <div className="form-group">
                  <label>Talla *</label>
                  <select 
                    value={deliverData.size || ''}
                    onChange={e => setDeliverData({...deliverData, size: e.target.value as any})}
                    required
                  >
                    <option value="">Seleccionar talla</option>
                    {EQUIPMENT_SIZES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Cantidad</label>
                <input 
                  type="number" 
                  min="1"
                  value={deliverData.quantity}
                  onChange={e => setDeliverData({...deliverData, quantity: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Notas</label>
                <textarea 
                  value={deliverData.notes}
                  onChange={e => setDeliverData({...deliverData, notes: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDeliverModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">Entregar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}