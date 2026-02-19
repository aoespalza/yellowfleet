import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { machineApi } from '../api/machineApi';
import type { Machine, MachineFormData } from '../types/machine';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import './FleetPage.css';

const initialFormData: MachineFormData = {
  code: '',
  type: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  serialNumber: '',
  hourMeter: 0,
  acquisitionDate: new Date().toISOString().split('T')[0],
  acquisitionValue: 0,
  usefulLifeHours: 10000,
  currentLocation: '',
};

export function FleetPage() {
  const { user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MachineFormData>(initialFormData);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const data = await machineApi.getAll();
      setMachines(data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'hourMeter' || name === 'acquisitionValue' || name === 'usefulLifeHours' 
        ? parseFloat(value) || 0 
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMachineId) {
        await machineApi.update(editingMachineId, formData);
      } else {
        await machineApi.create(formData);
      }
      resetForm();
      fetchMachines();
    } catch (error) {
      console.error('Error saving machine:', error);
    }
  };

  const handleEdit = (machine: Machine) => {
    setFormData({
      code: machine.code,
      type: machine.type,
      brand: machine.brand,
      model: machine.model,
      year: machine.year,
      serialNumber: machine.serialNumber,
      hourMeter: machine.hourMeter ?? 0,
      acquisitionDate: machine.acquisitionDate ? new Date(machine.acquisitionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      acquisitionValue: machine.acquisitionValue ?? 0,
      usefulLifeHours: machine.usefulLifeHours ?? 10000,
      currentLocation: machine.currentLocation ?? '',
    });
    setEditingMachineId(machine.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta máquina?')) {
      return;
    }
    try {
      await machineApi.delete(id);
      fetchMachines();
    } catch (error) {
      console.error('Error deleting machine:', error);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingMachineId(null);
    setShowForm(false);
  };

  return (
    <div className="fleet-page">
      <div className="fleet-header">
        <h1>Gestión de Flota</h1>
        {user?.role !== 'OPERATOR' && (
          <button 
            className="btn-primary"
            onClick={() => {
              if (showForm && editingMachineId) {
                resetForm();
              } else {
                setShowForm(!showForm);
              }
            }}
          >
            {showForm ? 'Cancelar' : '+ Nueva Máquina'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-container">
          <h2>{editingMachineId ? 'Editar Máquina' : 'Nueva Máquina'}</h2>
          <form onSubmit={handleSubmit} className="machine-form">
            <div className="form-row">
              <div className="form-group">
                <label>Código</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="EXC-001"
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select name="type" value={formData.type} onChange={handleInputChange} required>
                  <option value="">Seleccionar tipo</option>
                  <option value="Excavadora">Excavadora</option>
                  <option value="Cargador">Cargador</option>
                  <option value="Retroexcavadora">Retroexcavadora</option>
                  <option value="Compactador">Compactador</option>
                  <option value="Grúa">Grúa</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  placeholder="CAT"
                />
              </div>
              <div className="form-group">
                <label>Modelo</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  placeholder="320"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Año</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Número de Serie</label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="CAT0320ABC123456"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Horas de Uso</label>
                <input
                  type="number"
                  name="hourMeter"
                  value={formData.hourMeter}
                  onChange={handleInputChange}
                  required
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Ubicación</label>
                <input
                  type="text"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleInputChange}
                  required
                  placeholder="Bodega Principal"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha de Adquisición</label>
                <input
                  type="date"
                  name="acquisitionDate"
                  value={formData.acquisitionDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Valor de Adquisición ($)</label>
                <input
                  type="number"
                  name="acquisitionValue"
                  value={formData.acquisitionValue}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Vida Útil (Horas)</label>
                <input
                  type="number"
                  name="usefulLifeHours"
                  value={formData.usefulLifeHours}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-submit">
              {editingMachineId ? 'Actualizar Máquina' : 'Crear Máquina'}
            </button>
          </form>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loading">Cargando máquinas...</div>
        ) : machines.length === 0 ? (
          <div className="empty-state">No hay máquinas registradas</div>
        ) : (
          <table className="machines-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Horas</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((machine) => (
                <tr key={machine.id}>
                  <td>
                    <Link to={`/fleet/${machine.id}/history`} className="machine-code-link">
                      {machine.code}
                    </Link>
                  </td>
                  <td>{machine.type}</td>
                  <td>{machine.brand}</td>
                  <td>{machine.model}</td>
                  <td>{machine.year}</td>
                  <td>
                    {machine.hourMeter != null
                      ? Number(machine.hourMeter).toFixed(2)
                      : '—'}
                  </td>
                  <td>{machine.currentLocation}</td>
                  <td>
                    <StatusBadge status={machine.status} />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        to={`/fleet/${machine.id}/history`}
                        className="btn-history"
                        title="Ver Hoja de Vida"
                      >
                        📋
                      </Link>
                      {user?.role !== 'OPERATOR' && (
                        <>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(machine)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(machine.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default FleetPage;
