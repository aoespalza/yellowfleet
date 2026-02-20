import { useState, useEffect } from 'react';
import { machineApi, type LegalDocuments } from '../api/machineApi';
import { useAuth } from '../context/AuthContext';
import './LegalDocumentsCard.css';

interface LegalDocumentsCardProps {
  machineId: string;
}

export function LegalDocumentsCard({ machineId }: LegalDocumentsCardProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<LegalDocuments>({
    POLIZA: null,
    SOAT: null,
    TECNICO_MECANICA: null,
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    insuranceName: '',
    policyNumber: '',
    expirationDate: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, [machineId]);

  const fetchDocuments = async () => {
    try {
      const data = await machineApi.getLegalDocuments(machineId);
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching legal documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: string) => {
    const doc = documents[type as keyof typeof documents];
    setFormData({
      insuranceName: doc?.insuranceName || '',
      policyNumber: doc?.policyNumber || '',
      expirationDate: doc?.expirationDate ? doc.expirationDate.split('T')[0] : '',
    });
    setEditing(type);
  };

  const handleSave = async (type: string) => {
    setSaving(true);
    try {
      // Enviar todos los documentos para mantener los existentes
      const docToSave = {
        type,
        insuranceName: formData.insuranceName || undefined,
        policyNumber: formData.policyNumber || undefined,
        expirationDate: formData.expirationDate || undefined,
      };
      
      const updated = await machineApi.updateLegalDocuments(machineId, {
        POLIZA: type === 'POLIZA' ? docToSave : documents.POLIZA || undefined,
        SOAT: type === 'SOAT' ? docToSave : documents.SOAT || undefined,
        TECNICO_MECANICA: type === 'TECNICO_MECANICA' ? docToSave : documents.TECNICO_MECANICA || undefined,
      });
      setDocuments(updated);
      setEditing(null);
    } catch (error) {
      console.error('Error saving legal document:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({ insuranceName: '', policyNumber: '', expirationDate: '' });
  };

  const isExpired = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const getUrgency = (dateStr: string | null | undefined): 'critical' | 'warning' | 'normal' | null => {
    if (!dateStr) return null;
    const now = new Date();
    const expDate = new Date(dateStr);
    const daysRemaining = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 7) return 'critical';
    if (daysRemaining <= 15) return 'warning';
    if (daysRemaining <= 30) return 'normal';
    return null;
  };

  const getDaysRemaining = (dateStr: string | null | undefined): number | null => {
    if (!dateStr) return null;
    const now = new Date();
    const expDate = new Date(dateStr);
    return Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CL');
  };

  const getDocTitle = (type: string) => {
    switch (type) {
      case 'POLIZA': return 'Póliza de Seguro';
      case 'SOAT': return 'SOAT';
      case 'TECNICO_MECANICA': return 'Revisión Técnico-Mecánica';
      default: return type;
    }
  };

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'POLIZA': return '🛡️';
      case 'SOAT': return '📋';
      case 'TECNICO_MECANICA': return '🔧';
      default: return '📄';
    }
  };

  if (loading) {
    return <div className="legal-documents-card loading">Cargando...</div>;
  }

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="legal-documents-card">
      <h3>📄 Documentos Legales</h3>
      
      <div className="documents-grid">
        {/* PÓLIZA */}
        <div className={`document-item ${isExpired(documents.POLIZA?.expirationDate) ? 'expired' : ''}`}>
          <div className="document-header">
            <span className="document-icon">{getDocIcon('POLIZA')}</span>
            <span className="document-title">{getDocTitle('POLIZA')}</span>
            {isExpired(documents.POLIZA?.expirationDate) && (
              <span className="expired-badge">VENCIDO</span>
            )}
            {!isExpired(documents.POLIZA?.expirationDate) && getUrgency(documents.POLIZA?.expirationDate) && (
              <span className={`urgency-badge urgency-${getUrgency(documents.POLIZA?.expirationDate)}`}>
                {getDaysRemaining(documents.POLIZA?.expirationDate)} días
              </span>
            )}
          </div>
          
          {editing === 'POLIZA' ? (
            <div className="document-form">
              <div className="form-field">
                <label>Aseguradora</label>
                <input
                  type="text"
                  value={formData.insuranceName}
                  onChange={(e) => setFormData({ ...formData, insuranceName: e.target.value })}
                  placeholder="Nombre de aseguradora"
                />
              </div>
              <div className="form-field">
                <label>N° Póliza</label>
                <input
                  type="text"
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  placeholder="Número de póliza"
                />
              </div>
              <div className="form-field">
                <label>Fecha Vencimiento</label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button className="btn-cancel" onClick={handleCancel}>Cancelar</button>
                <button className="btn-save" onClick={() => handleSave('POLIZA')} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="document-content">
              <div className="document-field">
                <span className="field-label">Aseguradora</span>
                <span className="field-value">{documents.POLIZA?.insuranceName || '-'}</span>
              </div>
              <div className="document-field">
                <span className="field-label">N° Póliza</span>
                <span className="field-value">{documents.POLIZA?.policyNumber || '-'}</span>
              </div>
              <div className="document-field">
                <span className="field-label">Vencimiento</span>
                <span className={`field-value ${isExpired(documents.POLIZA?.expirationDate) ? 'text-expired' : ''}`}>
                  {formatDate(documents.POLIZA?.expirationDate)}
                </span>
              </div>
              {canEdit && (
                <button className="btn-edit" onClick={() => handleEdit('POLIZA')}>
                  ✏️ Editar
                </button>
              )}
            </div>
          )}
        </div>

        {/* SOAT */}
        <div className={`document-item ${isExpired(documents.SOAT?.expirationDate) ? 'expired' : ''}`}>
          <div className="document-header">
            <span className="document-icon">{getDocIcon('SOAT')}</span>
            <span className="document-title">{getDocTitle('SOAT')}</span>
            {isExpired(documents.SOAT?.expirationDate) && (
              <span className="expired-badge">VENCIDO</span>
            )}
            {!isExpired(documents.SOAT?.expirationDate) && getUrgency(documents.SOAT?.expirationDate) && (
              <span className={`urgency-badge urgency-${getUrgency(documents.SOAT?.expirationDate)}`}>
                {getDaysRemaining(documents.SOAT?.expirationDate)} días
              </span>
            )}
          </div>
          
          {editing === 'SOAT' ? (
            <div className="document-form">
              <div className="form-field">
                <label>Aseguradora</label>
                <input
                  type="text"
                  value={formData.insuranceName}
                  onChange={(e) => setFormData({ ...formData, insuranceName: e.target.value })}
                  placeholder="Nombre de aseguradora"
                />
              </div>
              <div className="form-field">
                <label>N° Póliza</label>
                <input
                  type="text"
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  placeholder="Número de póliza"
                />
              </div>
              <div className="form-field">
                <label>Fecha Vencimiento</label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button className="btn-cancel" onClick={handleCancel}>Cancelar</button>
                <button className="btn-save" onClick={() => handleSave('SOAT')} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="document-content">
              <div className="document-field">
                <span className="field-label">Aseguradora</span>
                <span className="field-value">{documents.SOAT?.insuranceName || '-'}</span>
              </div>
              <div className="document-field">
                <span className="field-label">N° Póliza</span>
                <span className="field-value">{documents.SOAT?.policyNumber || '-'}</span>
              </div>
              <div className="document-field">
                <span className="field-label">Vencimiento</span>
                <span className={`field-value ${isExpired(documents.SOAT?.expirationDate) ? 'text-expired' : ''}`}>
                  {formatDate(documents.SOAT?.expirationDate)}
                </span>
              </div>
              {canEdit && (
                <button className="btn-edit" onClick={() => handleEdit('SOAT')}>
                  ✏️ Editar
                </button>
              )}
            </div>
          )}
        </div>

        {/* REVISIÓN TÉCNICO-MECÁNICA */}
        <div className={`document-item ${isExpired(documents.TECNICO_MECANICA?.expirationDate) ? 'expired' : ''}`}>
          <div className="document-header">
            <span className="document-icon">{getDocIcon('TECNICO_MECANICA')}</span>
            <span className="document-title">{getDocTitle('TECNICO_MECANICA')}</span>
            {isExpired(documents.TECNICO_MECANICA?.expirationDate) && (
              <span className="expired-badge">VENCIDO</span>
            )}
            {!isExpired(documents.TECNICO_MECANICA?.expirationDate) && getUrgency(documents.TECNICO_MECANICA?.expirationDate) && (
              <span className={`urgency-badge urgency-${getUrgency(documents.TECNICO_MECANICA?.expirationDate)}`}>
                {getDaysRemaining(documents.TECNICO_MECANICA?.expirationDate)} días
              </span>
            )}
          </div>
          
          {editing === 'TECNICO_MECANICA' ? (
            <div className="document-form">
              <div className="form-field">
                <label>N° Certificado</label>
                <input
                  type="text"
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  placeholder="Número de certificado"
                />
              </div>
              <div className="form-field">
                <label>Fecha Vencimiento</label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button className="btn-cancel" onClick={handleCancel}>Cancelar</button>
                <button className="btn-save" onClick={() => handleSave('TECNICO_MECANICA')} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="document-content">
              <div className="document-field">
                <span className="field-label">N° Certificado</span>
                <span className="field-value">{documents.TECNICO_MECANICA?.policyNumber || '-'}</span>
              </div>
              <div className="document-field">
                <span className="field-label">Vencimiento</span>
                <span className={`field-value ${isExpired(documents.TECNICO_MECANICA?.expirationDate) ? 'text-expired' : ''}`}>
                  {formatDate(documents.TECNICO_MECANICA?.expirationDate)}
                </span>
              </div>
              {canEdit && (
                <button className="btn-edit" onClick={() => handleEdit('TECNICO_MECANICA')}>
                  ✏️ Editar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
