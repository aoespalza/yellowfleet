import { useState, useEffect } from 'react';
import { machineApi } from '../api/machineApi';
import { useNavigate } from 'react-router-dom';
import './ExpiringDocumentsCard.css';

interface ExpiringDocument {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  documentType: string;
  documentName: string;
  expirationDate: string;
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'normal';
}

export function ExpiringDocumentsCard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<ExpiringDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringDocuments();
  }, []);

  const fetchExpiringDocuments = async () => {
    try {
      const data = await machineApi.getExpiringLegalDocuments(30);
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching expiring documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL');
  };

  const handleClick = (machineId: string) => {
    navigate(`/fleet/${machineId}/history`);
  };

  if (loading) {
    return <div className="expiring-card loading">Cargando...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="expiring-card">
        <div className="expiring-header">
          <span className="expiring-icon">📋</span>
          <h3>Documentos por Vencer/Vencidos</h3>
        </div>
        <div className="expiring-empty">
          <span>✅</span>
          <p>No hay documentos próximos a vencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expiring-card">
      <div className="expiring-header">
        <span className="expiring-icon">⚠️</span>
        <h3>Documentos por Vencer/Vencidos</h3>
        <span className="expiring-count">{documents.length}</span>
      </div>
      
      <div className="expiring-list">
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className={`expiring-item urgency-${doc.urgency}`}
            onClick={() => handleClick(doc.machineId)}
          >
            <div className="expiring-info">
              <span className="machine-code">{doc.machineCode}</span>
              <span className="machine-name">{doc.machineName}</span>
            </div>
            <div className="expiring-doc-info">
              <span className="doc-name">{doc.documentName}</span>
              <span className="doc-expires">Vence: {formatDate(doc.expirationDate)}</span>
            </div>
            <div className={`days-badge urgency-${doc.urgency}`}>
              {doc.daysRemaining <= 0 ? (
                <span className="days-text">⚠️ VENCIDO</span>
              ) : doc.daysRemaining <= 7 ? (
                <span className="days-text">⚠️ {doc.daysRemaining} días</span>
              ) : doc.daysRemaining <= 15 ? (
                <span className="days-text">🟡 {doc.daysRemaining} días</span>
              ) : (
                <span className="days-text">🟢 {doc.daysRemaining} días</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
