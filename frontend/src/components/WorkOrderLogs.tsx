import { useState, useEffect } from 'react';
import { workOrderApi } from '../api/workOrderApi';
import { useAuth } from '../context/AuthContext';
import './WorkOrderLogs.css';

interface WorkOrderLog {
  id: string;
  workOrderId: string;
  date: string;
  description: string;
  createdAt: string;
}

interface WorkOrderLogsProps {
  workOrderId: string;
  onClose: () => void;
}

export function WorkOrderLogs({ workOrderId }: WorkOrderLogsProps) {
  const [logs, setLogs] = useState<WorkOrderLog[]>([]);
  const [newLog, setNewLog] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchLogs();
  }, [workOrderId]);

  const fetchLogs = async () => {
    try {
      const data = await workOrderApi.getLogs(workOrderId);
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.trim()) return;

    try {
      await workOrderApi.addLog(workOrderId, newLog);
      setNewLog('');
      fetchLogs();
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      await workOrderApi.deleteLog(logId);
      fetchLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="logs-card">
      <div className="logs-card-header">
        <h3>📋 Bitácora de Trabajo</h3>
        <span className="logs-count">{logs.length} registros</span>
      </div>

      {user?.role !== 'OPERATOR' && (
        <form onSubmit={handleAddLog} className="log-form">
          <textarea
            placeholder="Registrar progreso, observaciones, actividades realizadas..."
            value={newLog}
            onChange={(e) => setNewLog(e.target.value)}
            rows={2}
          />
          <button type="submit" className="btn-submit-log">
            + Agregar Registro
          </button>
        </form>
      )}

      <div className="logs-list">
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="empty-logs">No hay registros aún. Agrega el primero.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-header">
                <span className="log-date">{formatDate(log.date)}</span>
                {user?.role !== 'OPERATOR' && (
                  <button
                    className="btn-delete-log"
                    onClick={() => handleDeleteLog(log.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <div className="log-description">{log.description}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
