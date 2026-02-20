import { useState, useEffect } from 'react';
import { workOrderApi, type WorkOrderLog as WorkOrderLogType } from '../api/workOrderApi';
import { useAuth } from '../context/AuthContext';
import './WorkOrderLogs.css';

interface WorkOrderLog extends WorkOrderLogType {}

interface WorkOrderLogsProps {
  workOrderId: string;
  onClose: () => void;
}

export function WorkOrderLogs({ workOrderId }: WorkOrderLogsProps) {
  const [logs, setLogs] = useState<WorkOrderLog[]>([]);
  const [newLog, setNewLog] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    if (!newLog.trim() && !selectedFile) return;

    setSubmitting(true);
    try {
      if (selectedFile) {
        await workOrderApi.uploadLogWithFile(workOrderId, newLog, selectedFile);
      } else {
        await workOrderApi.addLog(workOrderId, newLog);
      }
      setNewLog('');
      setSelectedFile(null);
      fetchLogs();
    } catch (error) {
      console.error('Error adding log:', error);
    } finally {
      setSubmitting(false);
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
          <div className="log-file-upload">
            <label className="file-input-label">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="file-input"
              />
              <span className="file-button">
                {selectedFile ? '📎 ' + selectedFile.name : '📎 Subir archivo'}
              </span>
            </label>
            {selectedFile && (
              <button
                type="button"
                className="btn-remove-file"
                onClick={() => setSelectedFile(null)}
              >
                ×
              </button>
            )}
          </div>
          <button type="submit" className="btn-submit-log" disabled={submitting || (!newLog.trim() && !selectedFile)}>
            {submitting ? 'Guardando...' : '+ Agregar Registro'}
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
              {log.fileUrl && (
                <div className="log-file">
                  <a
                    href={log.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="log-file-link"
                  >
                    📎 {log.fileName || 'Ver archivo'}
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
