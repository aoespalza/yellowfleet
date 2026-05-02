import { useEffect, useState } from 'react';
import { operatorApi } from '../api/operatorApi';
import { jobApi } from '../api/jobApi';
import type { Operator, OperatorFormData } from '../types/operator';
import type { Job } from '../types/job';
import { useAuth } from '../context/AuthContext';
import { OperatorCard } from '../components/OperatorCard';
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
  photoUrl: '',
  empresa: '',
  arl: '',
  eps: '',
  grupoSanguineo: '',
  jobId: '',
};

export function OperatorsPage() {
  const { user } = useAuth();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingOperatorId, setViewingOperatorId] = useState<string | null>(null);
  const [editingOperatorId, setEditingOperatorId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OperatorFormData>(initialFormData);
  const [showInactive, setShowInactive] = useState(false);
  const [cardOperator, setCardOperator] = useState<Operator | null>(null);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const [operatorsData, jobsData] = await Promise.all([
        operatorApi.getAll(!showInactive),
        jobApi.getAll()
      ]);
      setOperators(operatorsData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching operators:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, [showInactive]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photoUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
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
      photoUrl: operator.photoUrl || '',
      empresa: operator.empresa || '',
      arl: operator.arl || '',
      eps: operator.eps || '',
      grupoSanguineo: operator.grupoSanguineo || '',
      jobId: operator.jobId || '',
    });
    setEditingOperatorId(operator.id);
    setViewingOperatorId(null);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleView = (operator: Operator) => {
    setFormData({
      name: operator.name,
      licenseNumber: operator.licenseNumber || '',
      phone: operator.phone || '',
      email: operator.email || '',
      hireDate: operator.hireDate ? new Date(operator.hireDate).toISOString().split('T')[0] : getLocalDateString(),
      notes: operator.notes || '',
      photoUrl: operator.photoUrl || '',
      empresa: operator.empresa || '',
      arl: operator.arl || '',
      eps: operator.eps || '',
      grupoSanguineo: operator.grupoSanguineo || '',
      jobId: operator.jobId || '',
    });
    setViewingOperatorId(operator.id);
    setEditingOperatorId(null);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleShowCard = (operator: Operator) => {
    setCardOperator(operator);
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
    setViewingOperatorId(null);
    setShowForm(false);
  };

  const handleCloseView = () => {
    resetForm();
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
                if (showForm && (editingOperatorId || viewingOperatorId)) {
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
          <h2>{editingOperatorId ? 'Editar Operador' : viewingOperatorId ? 'Ver Operador' : 'Nuevo Operador'}</h2>
          <form onSubmit={handleSubmit} className="operator-form">
            {/* Foto del operador */}
            <div className="form-row">
              <div className="form-group">
                <label>Foto del Operador</label>
                <div className="photo-upload">
                  {formData.photoUrl ? (
                    <div className="photo-preview">
                      <img src={formData.photoUrl} alt="Foto del operador" />
                    </div>
                  ) : (
                    <div className="photo-placeholder">
                      <span>📷</span>
                      <span>Sin foto</span>
                    </div>
                  )}
                  {editingOperatorId && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="photo-input"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required={!!editingOperatorId}
                  disabled={!!viewingOperatorId}
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="form-group">
                <label>Cédula</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  disabled={!!viewingOperatorId}
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
                  disabled={!!viewingOperatorId}
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
                  disabled={!!viewingOperatorId}
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
                  disabled={!!viewingOperatorId}
                />
              </div>
              <div className="form-group">
                <label>Empresa</label>
                <input
                  type="text"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleInputChange}
                  disabled={!!viewingOperatorId}
                  placeholder="Nombre de la empresa"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>ARL</label>
                <input
                  type="text"
                  name="arl"
                  value={formData.arl}
                  onChange={handleInputChange}
                  disabled={!!viewingOperatorId}
                  placeholder="Administradora de Riesgos Laborales"
                />
              </div>
              <div className="form-group">
                <label>EPS</label>
                <input
                  type="text"
                  name="eps"
                  value={formData.eps}
                  onChange={handleInputChange}
                  disabled={!!viewingOperatorId}
                  placeholder="Entidad Promotora de Salud"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Grupo Sanguíneo</label>
                <select
                  name="grupoSanguineo"
                  value={formData.grupoSanguineo}
                  onChange={handleInputChange}
                  disabled={!!viewingOperatorId}
                >
                  <option value="">Seleccionar...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className="form-group">
                <label>👔 Cargo</label>
                <select
                  name="jobId"
                  value={formData.jobId}
                  onChange={handleInputChange}
                  disabled={!!viewingOperatorId}
                >
                  <option value="">Seleccionar cargo...</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.name} {job.hourlyRate ? `(${job.hourlyRate}/hr)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Notas</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={!!viewingOperatorId}
                  placeholder="Notas adicionales sobre el operador..."
                  rows={3}
                />
              </div>
            </div>
            {editingOperatorId && (
              <button type="submit" className="btn-submit">
                Actualizar Operador
              </button>
            )}
            {viewingOperatorId && (
              <button type="button" className="btn-submit" onClick={handleCloseView}>
                Cerrar
              </button>
            )}
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
                <th>Foto</th>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Cargo</th>
                <th>ARL</th>
                <th>EPS</th>
                <th>Grupo Sang.</th>
                <th>Fecha Contratación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOperators.map((operator) => (
                <tr key={operator.id} className={!operator.isActive ? 'inactive-row' : ''}>
                  <td>
                    {operator.photoUrl ? (
                      <img src={operator.photoUrl} alt={operator.name} className="operator-photo" />
                    ) : (
                      <div className="operator-photo-placeholder">
                        {operator.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td>{operator.name}</td>
                  <td>{operator.empresa || '—'}</td>
                  <td>{operator.licenseNumber || '—'}</td>
                  <td>{operator.phone || '—'}</td>
                  <td>{operator.email || '—'}</td>
                  <td>{operator.job?.name || '—'}</td>
                  <td>{operator.arl || '—'}</td>
                  <td>{operator.eps || '—'}</td>
                  <td>{operator.grupoSanguineo || '—'}</td>
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
                      <button
                        className="btn-view"
                        onClick={() => handleView(operator)}
                        title="Ver"
                      >
                        👁️
                      </button>
                      <button
                        className="btn-card"
                        onClick={() => handleShowCard(operator)}
                        title="Generar Carnet"
                      >
                        🪪
                      </button>
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

      {cardOperator && (
        <OperatorCard
          operator={cardOperator}
          onClose={() => setCardOperator(null)}
        />
      )}
    </div>
  );
}

export default OperatorsPage;
