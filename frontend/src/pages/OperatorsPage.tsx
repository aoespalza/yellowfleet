import { useEffect, useState } from 'react';
import { operatorApi } from '../api/operatorApi';
import type { Operator, OperatorFormData } from '../types/operator';
import { useAuth } from '../context/AuthContext';
import './OperatorsPage.css';

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const initialFormData: OperatorFormData = {
  name: '',
  licenseNumber: '',
  phone: '',
  email: '',
  hireDate: getLocalDateString(),
  notes: '',
};

export function OperatorsPage() {
  const { user } = useAuth();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOperatorId, setEditingOperatorId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OperatorFormData>(initialFormData);
  const [showInactive, setShowInactive] = useState(false);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const data = await operatorApi.getAll(!showInactive);
      setOperators(data);
    } catch (error) {
      console.error('Error fetching operators:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, [showInactive]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOperatorId) {
        await operatorApi.update(editingOperatorId, formData);
      } else {
        await operatorApi.create(formData);
      }
      resetForm();
      fetchOperators();
    } catch (error) {
      console.error('Error saving operator:', error);
    }
  };

  const handleEdit = (operator: Operator) => {
    setFormData({
      name: operator.name,
      licenseNumber: operator.licenseNumber || '',
      phone: operator.phone || '',
      email: operator.email || '',
      hireDate: operator.hireDate ? new Date(operator.hireDate).toISOString().split('T')[0] : getLocalDateString(),
      notes: operator.notes || '',
    });
    setEditingOperatorId(operator.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este operador?')) {
      return;
    }
    try {
      await operatorApi.delete(id);
      fetchOperators();
    } catch (error) {
      console.error('Error deleting operator:', error);
    }
  };

  const toggleActive = async (operator: Operator) => {
    try {
      await operatorApi.update(operator.id, { isActive: !operator.isActive });
      fetchOperators();
    } catch (error) {
      console.error('Error toggling operator status:', error);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingOperatorId(null);
    setShowForm(false);
  };

  const filteredOperators = operators;

  return (
    <div className="operators-page">
      <div className="page-header">
        <h1>Gestión de Operadores</h1>
        <div className="header-actions">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Mostrar inactivos
          </label>
          {user?.role !== 'OPERATOR' && (
            <button
              className="btn-primary"
              onClick={() => {
                if (showForm && editingOperatorId) {
                  resetForm();
                } else {
                  setShowForm(!showForm);
                  window.scrollTo(0, 0);
                }
              }}
            >
              {showForm ? 'Cancelar' : '+ Nuevo Operador'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <h2>{editingOperatorId ? 'Editar Operador' : 'Nuevo Operador'}</h2>
          <form onSubmit={handleSubmit} className="operator-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="form-group">
                <label>Número de Licencia</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  placeholder="DL12345678"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="juan@empresa.cl"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha de Contratación</label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Notas</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Notas adicionales sobre el operador..."
                  rows={3}
                />
              </div>
            </div>
            <button type="submit" className="btn-submit">
              {editingOperatorId ? 'Actualizar Operador' : 'Crear Operador'}
            </button>
          </form>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loading">Cargando operadores...</div>
        ) : operators.length === 0 ? (
          <div className="empty-state">No hay operadores registrados</div>
        ) : (
          <table className="operators-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Licencia</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Fecha Contratación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOperators.map((operator) => (
                <tr key={operator.id} className={!operator.isActive ? 'inactive-row' : ''}>
                  <td>{operator.name}</td>
                  <td>{operator.licenseNumber || '—'}</td>
                  <td>{operator.phone || '—'}</td>
                  <td>{operator.email || '—'}</td>
                  <td>
                    {operator.hireDate
                      ? new Date(operator.hireDate).toLocaleDateString('es-CL')
                      : '—'}
                  </td>
                  <td>
                    <span className={`status-badge ${operator.isActive ? 'active' : 'inactive'}`}>
                      {operator.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {user?.role !== 'OPERATOR' && (
                        <>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(operator)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className={`btn-toggle ${operator.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                            onClick={() => toggleActive(operator)}
                            title={operator.isActive ? 'Desactivar' : 'Activar'}
                          >
                            {operator.isActive ? '⏸️' : '▶️'}
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(operator.id)}
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

export default OperatorsPage;
