import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Operator } from '../types/operator';
import './OperatorCard.css';

interface OperatorCardProps {
  operator: Operator;
  onClose: () => void;
}

export function OperatorCard({ operator, onClose }: OperatorCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const qrData = JSON.stringify({
    id: operator.id,
    name: operator.name,
    license: operator.licenseNumber,
    empresa: operator.empresa,
    estado: operator.isActive ? 'ACTIVO' : 'INACTIVO',
    eps: operator.eps,
    arl: operator.arl,
  });

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Carnet Operador - ${operator.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="card-overlay" onClick={onClose}>
      <div className="card-container" ref={cardRef} onClick={(e) => e.stopPropagation()}>
        <button className="card-close" onClick={onClose}>✕</button>
        
        {/* Header with logo */}
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-logo">
              <span className="logo-icon">🚜</span>
              <span className="logo-text">YELLOW FLEET</span>
            </div>
          </div>
          <div className="card-header-right">
            <span className="card-type">CARNET DE IDENTIFICACIÓN</span>
          </div>
        </div>

        {/* Main content */}
        <div className="card-main">
          {/* Photo section */}
          <div className="card-photo-section">
            {operator.photoUrl ? (
              <img src={operator.photoUrl} alt={operator.name} className="card-photo" />
            ) : (
              <div className="card-photo-placeholder">
                {operator.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`card-status-badge ${operator.isActive ? 'active' : 'inactive'}`}>
              {operator.isActive ? '✓ ACTIVO' : '✕ INACTIVO'}
            </div>
          </div>

          {/* Info section */}
          <div className="card-info">
            <h2 className="card-name">{operator.name}</h2>
            <p className="card-role">OPERADOR DE MAQUINARIA</p>
            <p className="card-empresa">{operator.empresa || '—'}</p>
            
            <div className="card-details">
              <div className="card-detail-row">
                <span className="detail-label">Cédula</span>
                <span className="detail-value">{operator.licenseNumber || '—'}</span>
              </div>
              <div className="card-detail-row">
                <span className="detail-label">Teléfono</span>
                <span className="detail-value">{operator.phone || '—'}</span>
              </div>
              <div className="card-detail-row">
                <span className="detail-label">ARL</span>
                <span className="detail-value">{operator.arl || '—'}</span>
              </div>
              <div className="card-detail-row">
                <span className="detail-label">EPS</span>
                <span className="detail-value">{operator.eps || '—'}</span>
              </div>
              <div className="card-detail-row blood">
                <span className="detail-label">Grupo Sanguíneo</span>
                <span className="detail-value">{operator.grupoSanguineo || '—'}</span>
              </div>
            </div>
          </div>

          {/* QR Section */}
          <div className="card-qr-section">
            <div className="qr-wrapper">
              <QRCodeSVG
                value={qrData}
                size={90}
                level="M"
                includeMargin={false}
              />
            </div>
            <span className="qr-hint">Escanee para verificar</span>
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer">
          <div className="footer-left">
            <span className="footer-id">ID: {operator.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="footer-right">
            <span className="footer-valid">Válido hasta: 31/12/2026</span>
          </div>
        </div>

        {/* Actions */}
        <div className="card-actions">
          <button className="btn-print" onClick={handlePrint}>
            🖨️ Imprimir Carnet
          </button>
        </div>
      </div>
    </div>
  );
}
