import type { Contract } from '../types/contract';
import './ExpiringContractsCard.css';
import './ExpiringDocumentsCard.css';

interface ExpiringContract {
  id: string;
  code: string;
  customer: string;
  endDate: string;
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'normal';
}

interface ExpiringContractsCardProps {
  contracts: Contract[];
  onNavigate?: (page: string, contractId?: string) => void;
}

export function ExpiringContractsCard({ contracts, onNavigate }: ExpiringContractsCardProps) {
  const handleClick = (contractId: string) => {
    if (onNavigate) {
      onNavigate('contracts', contractId);
    }
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiringContracts: ExpiringContract[] = contracts
    .filter(c => c.status === 'ACTIVE')
    .map(c => {
      const endDate = new Date(c.endDate);
      endDate.setHours(0, 0, 0, 0);
      const diffTime = endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let urgency: 'critical' | 'warning' | 'normal' = 'normal';
      if (daysRemaining <= 15) urgency = 'critical';
      else if (daysRemaining <= 60) urgency = 'warning';
      
      return {
        id: c.id,
        code: c.code,
        customer: c.customer,
        endDate: c.endDate,
        daysRemaining,
        urgency,
      };
    })
    .filter(c => c.daysRemaining > 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL');
  };

  if (expiringContracts.length === 0) {
    return (
      <div className="expiring-card">
        <div className="expiring-header">
          <span className="expiring-icon">📋</span>
          <h3>Contratos por Vencer</h3>
        </div>
        <div className="expiring-empty">
          <span>✅</span>
          <p>No hay contratos próximos a vencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expiring-card">
      <div className="expiring-header">
        <span className="expiring-icon">⚠️</span>
        <h3>Contratos por Vencer</h3>
        <span className="expiring-count">{expiringContracts.length}</span>
      </div>
      
      <div className="expiring-list">
        {expiringContracts.slice(0, 5).map((contract) => (
          <div 
            key={contract.id} 
            className={`expiring-item urgency-${contract.urgency}`}
            onClick={() => handleClick(contract.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="expiring-info">
              <span className="contract-code">{contract.code}</span>
              <span className="contract-customer">{contract.customer}</span>
            </div>
            <div className="expiring-doc-info">
              <span className="contract-end">Vence: {formatDate(contract.endDate)}</span>
            </div>
            <div className={`days-badge urgency-${contract.urgency}`}>
              {contract.daysRemaining <= 15 ? (
                <span className="days-text">⚠️ {contract.daysRemaining} días</span>
              ) : contract.daysRemaining <= 60 ? (
                <span className="days-text">🟡 {contract.daysRemaining} días</span>
              ) : (
                <span className="days-text">🟢 {contract.daysRemaining} días</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
