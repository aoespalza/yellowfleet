interface ContractExpiryIndicatorProps {
  endDate: string;
  status: string;
}

export function ContractExpiryIndicator({ endDate, status }: ContractExpiryIndicatorProps) {
  // Don't show indicator for non-active contracts
  if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'DRAFT') {
    return <span className="expiry-indicator expiry-indicator--na" title="No aplica">-</span>;
  }

  const now = new Date();
  const end = new Date(endDate);
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let className = 'expiry-indicator';
  let title = '';
  
  if (daysRemaining < 0) {
    // Already expired
    className += ' expiry-indicator--expired';
    title = `Vencido hace ${Math.abs(daysRemaining)} días`;
  } else if (daysRemaining <= 30) {
    // Less than 30 days - red
    className += ' expiry-indicator--danger';
    title = `Vence en ${daysRemaining} días`;
  } else if (daysRemaining <= 90) {
    // Between 30 and 90 days - yellow
    className += ' expiry-indicator--warning';
    title = `Vence en ${daysRemaining} días`;
  } else {
    // More than 90 days - green
    className += ' expiry-indicator--success';
    title = `Vence en ${daysRemaining} días`;
  }

  return (
    <span className={className} title={title}>
      <span className="expiry-dot"></span>
    </span>
  );
}
