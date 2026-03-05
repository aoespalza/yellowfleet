import { useEffect, useState } from 'react';
import { notificationApi, type NotificationConfig, type NotificationSummary } from '../api/notificationApi';
import './NotificationsPage.css';

export function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [results, setResults] = useState<NotificationSummary | null>(null);

  const [config, setConfig] = useState<NotificationConfig>({
    notificationEmail: '',
    contractsEnabled: true,
    leasingEnabled: true,
    documentsEnabled: true,
    workshopEnabled: true,
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    from: ''
  });

  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getConfig();
      setConfig(prev => ({
        ...prev,
        ...data,
        password: ''
      }));
    } catch (error: any) {
      showMessage('error', 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await notificationApi.saveConfig(config);
      showMessage('success', 'Configuración guardada correctamente');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const result = await notificationApi.testConnection();
      if (result.success) {
        showMessage('success', result.message);
      } else {
        showMessage('error', result.message);
      }
    } catch (error: any) {
      showMessage('error', 'Error al probar conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      showMessage('error', 'Ingresa un email de prueba');
      return;
    }
    try {
      setTesting(true);
      const result = await notificationApi.sendTestEmail(testEmail);
      if (result.success) {
        showMessage('success', 'Email de prueba enviado correctamente');
      } else {
        showMessage('error', result.message);
      }
    } catch (error: any) {
      showMessage('error', 'Error al enviar email de prueba');
    } finally {
      setTesting(false);
    }
  };

  const handleRunNotifications = async () => {
    try {
      setRunning(true);
      const result = await notificationApi.runNotifications();
      setResults(result);
      showMessage('success', 'Verificación completada');
    } catch (error: any) {
      showMessage('error', 'Error al ejecutar verificaciones');
    } finally {
      setRunning(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return <div className="notifications-page"><div className="loading">Cargando...</div></div>;
  }

  return (
    <div className="notifications-page">
      <h1>Configuración de Notificaciones</h1>

      {message && (
        <div className={`message message--${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="notification-section">
        <h2>📧 Configuración del Servidor SMTP</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Servidor SMTP (Host)</label>
            <input
              type="text"
              value={config.host || ''}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="form-group">
            <label>Puerto</label>
            <input
              type="number"
              value={config.port || 587}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Usuario SMTP</label>
            <input
              type="text"
              value={config.user || ''}
              onChange={(e) => setConfig({ ...config, user: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div className="form-group">
            <label>Contraseña SMTP</label>
            <input
              type="password"
              value={config.password || ''}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div className="form-group">
            <label>Email Remitente (From)</label>
            <input
              type="email"
              value={config.from || ''}
              onChange={(e) => setConfig({ ...config, from: e.target.value })}
              placeholder="YellowFleet <noreply@ejemplo.com>"
            />
          </div>
          <div className="form-group form-group--checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.secure || false}
                onChange={(e) => setConfig({ ...config, secure: e.target.checked })}
              />
              Usar SSL/TLS (puerto 465)
            </label>
          </div>
        </div>

        <div className="button-group">
          <button 
            className="btn-secondary" 
            onClick={handleTestConnection}
            disabled={testing || !config.host || !config.user}
          >
            {testing ? 'Probando...' : '🔗 Probar Conexión'}
          </button>
        </div>
      </div>

      <div className="notification-section">
        <h2>📨 Configuración de Notificaciones</h2>
        <div className="form-grid">
          <div className="form-group form-group--full">
            <label>Emails para recibir notificaciones (separados por coma)</label>
            <input
              type="text"
              value={config.notificationEmail}
              onChange={(e) => setConfig({ ...config, notificationEmail: e.target.value })}
              placeholder="admin@empresa.com, jefe@empresa.com, etc@empresa.com"
            />
          </div>
        </div>

        <div className="checkbox-grid">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={config.contractsEnabled}
              onChange={(e) => setConfig({ ...config, contractsEnabled: e.target.checked })}
            />
            <span>📄 Notificar contratos por vencer (30, 15, 7 días)</span>
          </label>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={config.leasingEnabled}
              onChange={(e) => setConfig({ ...config, leasingEnabled: e.target.checked })}
            />
            <span>💰 Notificar cuotas de leasing pendientes</span>
          </label>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={config.documentsEnabled}
              onChange={(e) => setConfig({ ...config, documentsEnabled: e.target.checked })}
            />
            <span>📄 Notificar documentos por vencer</span>
          </label>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={config.workshopEnabled}
              onChange={(e) => setConfig({ ...config, workshopEnabled: e.target.checked })}
            />
            <span>🔧 Notificar órdenes de taller pendientes</span>
          </label>
        </div>

        <div className="button-group">
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : '💾 Guardar Configuración'}
          </button>
        </div>
      </div>

      <div className="notification-section">
        <h2>🧪 Pruebas</h2>
        <div className="test-row">
          <input
            type="text"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Email de prueba (separados por coma)"
          />
          <button 
            className="btn-secondary" 
            onClick={handleSendTestEmail}
            disabled={testing || !testEmail}
          >
            {testing ? 'Enviando...' : '📤 Enviar Email de Prueba'}
          </button>
        </div>
      </div>

      <div className="notification-section">
        <h2>🚀 Ejecutar Verificaciones</h2>
        <p className="section-description">
          Ejecuta manualmente las verificaciones de notificaciones. Esto enviará emails según la configuración actual.
        </p>
        <button 
          className="btn-primary btn-large" 
          onClick={handleRunNotifications}
          disabled={running}
        >
          {running ? 'Ejecutando...' : '▶️ Ejecutar Todas las Verificaciones'}
        </button>

        {results && (
          <div className="results-grid">
            <div className={`result-card ${results.contracts.count > 0 ? 'result-card--warning' : ''}`}>
              <h3>📄 Contratos</h3>
              <p>Detectados: {results.contracts.count}</p>
              <p>Enviados: {results.contracts.sent}</p>
            </div>
            <div className={`result-card ${results.leasing.count > 0 ? 'result-card--warning' : ''}`}>
              <h3>💰 Leasing</h3>
              <p>Detectados: {results.leasing.count}</p>
              <p>Enviados: {results.leasing.sent}</p>
            </div>
            <div className={`result-card ${results.documents.count > 0 ? 'result-card--warning' : ''}`}>
              <h3>📄 Documentos</h3>
              <p>Detectados: {results.documents.count}</p>
              <p>Enviados: {results.documents.sent}</p>
            </div>
            <div className={`result-card ${results.workOrders.count > 0 ? 'result-card--warning' : ''}`}>
              <h3>🔧 Taller</h3>
              <p>Detectados: {results.workOrders.count}</p>
              <p>Enviados: {results.workOrders.sent}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
