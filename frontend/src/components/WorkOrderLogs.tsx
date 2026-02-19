import { useState, useEffect } from 'react';
import { workOrderApi } from '../api/workOrderApi';

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

export function WorkOrderLogs({ workOrderId, onClose }: WorkOrderLogsProps) {
  const [logs, setLogs] = useState<WorkOrderLog[]>([]);
  const [newLog, setNewLog] = useState('');
  const [loading, setLoading] = useState(true);

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Bitácora de Orden de Trabajo</h2>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleAddLog} className="log-form">
          <textarea
            placeholder="Registrar progreso del día..."
            value={newLog}
            onChange={(e) => setNewLog(e.target.value)}
            rows={3}
          />
          <button type="submit" className="btn-submit">Agregar Registro</button>
        </form>

        <div className="logs-list">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : logs.length === 0 ? (
            <div className="empty-logs">No hay registros aún</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="log-item">
                <div className="log-date">{formatDate(log.date)}</div>
                <div className="log-description">{log.description}</div>
                <button
                  className="btn-delete-log"
                  onClick={() => handleDeleteLog(log.id)}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
