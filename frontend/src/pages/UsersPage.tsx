import { useState, useEffect } from 'react';
import type { AuthUser } from '../api/authApi';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import './UsersPage.css';

export function UsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'OPERATOR',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await authApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        const updateData: any = {};
        if (formData.username) updateData.username = formData.username;
        if (formData.email) updateData.email = formData.email;
        if (formData.role) updateData.role = formData.role;
        if (formData.password) updateData.password = formData.password;
        
        await authApi.updateUser(editingUser.id, updateData);
        setSuccess('Usuario actualizado exitosamente');
      } else {
        await authApi.register(formData);
        setSuccess('Usuario creado exitosamente');
      }
      
      setFormData({ username: '', password: '', email: '', role: 'OPERATOR' });
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar usuario');
    }
  };

  const handleEdit = (user: AuthUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      email: user.email || '',
      role: user.role,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) return;

    try {
      await authApi.deleteUser(id);
      setSuccess('Usuario eliminado');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', email: '', role: 'OPERATOR' });
    setError('');
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'MANAGER': return 'role-manager';
      case 'OPERATOR': return 'role-operator';
      default: return '';
    }
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>👥 Gestión de Usuarios</h1>
        {currentUser?.role === 'ADMIN' && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
          </button>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {showForm && (
        <div className="form-container">
          <h2>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-row">
              <div className="form-group">
                <label>Usuario</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="usuario"
                />
              </div>
              <div className="form-group">
                <label>
                  {editingUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required={!editingUser}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit">
                {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loading">Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">No hay usuarios registrados</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email || '-'}</td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {currentUser?.role === 'ADMIN' && (
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(user)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        {user.id !== currentUser.id && (
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(user.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    )}
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
