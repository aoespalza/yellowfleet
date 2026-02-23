import { useState, useEffect } from 'react';
import type { Role } from '../api/roleApi';
import { roleApi } from '../api/roleApi';
import './RoleForm.css';
import './RoleForm.css';

interface RoleFormProps {
  role?: Role | null;
  onClose: () => void;
  onSave: () => void;
}

const PERMISSIONS = [
  { key: 'canCreateMachine', label: 'Crear máquinas', category: 'Máquinas' },
  { key: 'canEditMachine', label: 'Editar máquinas', category: 'Máquinas' },
  { key: 'canDeleteMachine', label: 'Eliminar máquinas', category: 'Máquinas' },
  { key: 'canUpdateHourMeter', label: 'Actualizar horómetro', category: 'Máquinas' },
  { key: 'canCreateContract', label: 'Crear contratos', category: 'Contratos' },
  { key: 'canEditContract', label: 'Editar contratos', category: 'Contratos' },
  { key: 'canDeleteContract', label: 'Eliminar contratos', category: 'Contratos' },
  { key: 'canAssignMachine', label: 'Asignar máquinas', category: 'Contratos' },
  { key: 'canCreateWorkOrder', label: 'Crear órdenes', category: 'Órdenes' },
  { key: 'canEditWorkOrder', label: 'Editar órdenes', category: 'Órdenes' },
  { key: 'canDeleteWorkOrder', label: 'Eliminar órdenes', category: 'Órdenes' },
  { key: 'canCloseWorkOrder', label: 'Cerrar órdenes', category: 'Órdenes' },
  { key: 'canEditLegalDocuments', label: 'Editar documentos legales', category: 'Documentos' },
  { key: 'canCreateUser', label: 'Crear usuarios', category: 'Usuarios' },
  { key: 'canEditUser', label: 'Editar usuarios', category: 'Usuarios' },
  { key: 'canDeleteUser', label: 'Eliminar usuarios', category: 'Usuarios' },
  { key: 'canManageRoles', label: 'Gestionar roles', category: 'Usuarios' },
];

export function RoleForm({ role, onClose, onSave }: RoleFormProps) {
  const [formData, setFormData] = useState<Partial<Role>>({
    name: '',
    description: '',
    canCreateMachine: false,
    canEditMachine: false,
    canDeleteMachine: false,
    canUpdateHourMeter: false,
    canCreateContract: false,
    canEditContract: false,
    canDeleteContract: false,
    canAssignMachine: false,
    canCreateWorkOrder: false,
    canEditWorkOrder: false,
    canDeleteWorkOrder: false,
    canCloseWorkOrder: false,
    canEditLegalDocuments: false,
    canCreateUser: false,
    canEditUser: false,
    canDeleteUser: false,
    canManageRoles: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        canCreateMachine: role.canCreateMachine,
        canEditMachine: role.canEditMachine,
        canDeleteMachine: role.canDeleteMachine,
        canUpdateHourMeter: role.canUpdateHourMeter,
        canCreateContract: role.canCreateContract,
        canEditContract: role.canEditContract,
        canDeleteContract: role.canDeleteContract,
        canAssignMachine: role.canAssignMachine,
        canCreateWorkOrder: role.canCreateWorkOrder,
        canEditWorkOrder: role.canEditWorkOrder,
        canDeleteWorkOrder: role.canDeleteWorkOrder,
        canCloseWorkOrder: role.canCloseWorkOrder,
        canEditLegalDocuments: role.canEditLegalDocuments,
        canCreateUser: role.canCreateUser,
        canEditUser: role.canEditUser,
        canDeleteUser: role.canDeleteUser,
        canManageRoles: role.canManageRoles,
      });
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role) {
        await roleApi.update(role.name, formData);
      } else {
        await roleApi.create(formData);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar rol');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (key: keyof Role) => {
    setFormData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const groupedPermissions = PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof PERMISSIONS>);

  const allCategories = Object.keys(groupedPermissions);

  return (
    <div className="modal-overlay">
      <div className="modal-content role-form-modal">
        <div className="modal-header">
          <h2>{role ? 'Editar Permisos' : 'Nuevo Rol'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="role-form">
          {error && <div className="alert-error">{error}</div>}

          <div className="form-group">
            <label>Nombre del Rol</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={!!role}
              placeholder="NOMBRE_ROL"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del rol"
            />
          </div>

          <div className="permissions-section">
            <h3>Permisos</h3>
            
            {allCategories.map(category => (
              <div key={category} className="permission-category">
                <h4>{category}</h4>
                <div className="permission-grid">
                  {groupedPermissions[category].map(perm => (
                    <label key={perm.key} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={!!formData[perm.key as keyof Role]}
                        onChange={() => togglePermission(perm.key as keyof Role)}
                      />
                      <span className="checkmark"></span>
                      <span className="permission-label">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Guardando...' : role ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
