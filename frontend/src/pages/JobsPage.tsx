import { useState, useEffect } from 'react';
import { jobApi } from '../api/jobApi';
import { MACHINE_TYPES, EQUIPMENT_CATEGORIES } from '../types/job';
import type { Job, JobFormData } from '../types/job';
import './JobsPage.css';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState<JobFormData>({
    name: '',
    description: '',
    hourlyRate: undefined,
    machineTypes: [],
    equipmentCategories: [],
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await jobApi.getAll();
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await jobApi.update(editingJob.id, formData);
      } else {
        await jobApi.create(formData);
      }
      setShowModal(false);
      setEditingJob(null);
      setFormData({ name: '', description: '', hourlyRate: undefined, machineTypes: [], equipmentCategories: [] });
      loadJobs();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar cargo');
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      name: job.name,
      description: job.description || '',
      hourlyRate: job.hourlyRate,
      machineTypes: job.machineTypes,
      equipmentCategories: job.equipmentCategories,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cargo?')) return;
    try {
      await jobApi.delete(id);
      loadJobs();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const toggleMachineType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      machineTypes: prev.machineTypes.includes(type as any)
        ? prev.machineTypes.filter(t => t !== type)
        : [...prev.machineTypes, type as any]
    }));
  };

  const toggleEquipmentCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      equipmentCategories: prev.equipmentCategories.includes(category as any)
        ? prev.equipmentCategories.filter(c => c !== category)
        : [...prev.equipmentCategories, category as any]
    }));
  };

  const getMachineTypeLabel = (type: string) => MACHINE_TYPES.find(t => t.value === type)?.label || type;
  const getEquipmentCategoryLabel = (category: string) => EQUIPMENT_CATEGORIES.find(c => c.value === category)?.label || category;

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
  };

  if (loading) {
    return <div className="jobs-page">Cargando...</div>;
  }

  return (
    <div className="jobs-page">
      <div className="page-header">
        <h1>👔 Cargos</h1>
        <button className="btn-primary" onClick={() => {
          setEditingJob(null);
          setFormData({ name: '', description: '', hourlyRate: undefined, machineTypes: [], equipmentCategories: [] });
          setShowModal(true);
        }}>
          ➕ Nuevo Cargo
        </button>
      </div>

      <div className="jobs-grid">
        {jobs.map(job => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <h3>{job.name}</h3>
              <div className="job-actions">
                <button className="btn-icon" onClick={() => handleEdit(job)}>✏️</button>
                <button className="btn-icon danger" onClick={() => handleDelete(job.id)}>🗑️</button>
              </div>
            </div>
            {job.description && <p className="job-description">{job.description}</p>}
            {job.hourlyRate && (
              <p className="job-rate">
                <strong>Tarifa/hora:</strong> {formatCurrency(job.hourlyRate)}
              </p>
            )}
            
            <div className="job-section">
              <h4>🚜 Máquinas que puede operar:</h4>
              {job.machineTypes.length > 0 ? (
                <div className="tags">
                  {job.machineTypes.map(type => (
                    <span key={type} className="tag machine-tag">{getMachineTypeLabel(type)}</span>
                  ))}
                </div>
              ) : (
                <p className="empty-text">No tiene máquinas asignadas</p>
              )}
            </div>

            <div className="job-section">
              <h4>🛡️ Dotación (EPP) que recibe:</h4>
              {job.equipmentCategories.length > 0 ? (
                <div className="tags">
                  {job.equipmentCategories.map(cat => (
                    <span key={cat} className="tag equipment-tag">{getEquipmentCategoryLabel(cat)}</span>
                  ))}
                </div>
              ) : (
                <p className="empty-text">No tiene dotación asignada</p>
              )}
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="empty-state">
            <p>No hay cargos registrados</p>
            <p>Crea el primer cargo para comenzar</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingJob ? 'Editar Cargo' : 'Nuevo Cargo'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tarifa por hora (para control de horas extras)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate || ''}
                  onChange={e => setFormData({ ...formData, hourlyRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="Ej: 15000"
                />
              </div>

              <div className="form-group">
                <label>🚜 Máquinas que puede operar (seleccionar varias)</label>
                <div className="checkbox-grid">
                  {MACHINE_TYPES.map(type => (
                    <label key={type.value} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.machineTypes.includes(type.value as any)}
                        onChange={() => toggleMachineType(type.value)}
                      />
                      <span>{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>🛡️ Dotación (EPP) que recibe (seleccionar varias)</label>
                <div className="checkbox-grid">
                  {EQUIPMENT_CATEGORIES.map(cat => (
                    <label key={cat.value} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.equipmentCategories.includes(cat.value as any)}
                        onChange={() => toggleEquipmentCategory(cat.value)}
                      />
                      <span>{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingJob ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}