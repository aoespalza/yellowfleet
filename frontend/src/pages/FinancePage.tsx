import { useEffect, useState } from 'react';
import { financeApi, type Leasing, type LeasingSummary, type LeasingFormData, type MachineWithoutLeasing, type LeasingPayment, type LeasingPaymentFormData } from '../api/financeApi';
import { KPICard } from '../components/KPICard';
import { KPIGrid } from '../components/KPIGrid';
import './FinancePage.css';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

type TabType = 'leasing';

export function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabType>('leasing');
  const [loading, setLoading] = useState(true);
  
  // Leasing state
  const [leasings, setLeasings] = useState<Leasing[]>([]);
  const [leasingSummary, setLeasingSummary] = useState<LeasingSummary | null>(null);
  const [machinesWithoutLeasing, setMachinesWithoutLeasing] = useState<MachineWithoutLeasing[]>([]);
  const [showLeasingModal, setShowLeasingModal] = useState(false);
  const [editingLeasing, setEditingLeasing] = useState<Leasing | null>(null);
  const [selectedLeasingForPayment, setSelectedLeasingForPayment] = useState<Leasing | null>(null);
  const [leasingPayments, setLeasingPayments] = useState<LeasingPayment[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState<LeasingPaymentFormData>({
    leasingId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentsCount: 1,
    notes: '',
  });
  const [leasingForm, setLeasingForm] = useState<LeasingFormData>({
    machineId: '',
    purchaseValue: 0,
    currentBalance: 0,
    monthlyPayment: 0,
    entity: '',
    startDate: '',
    endDate: '',
    totalPayments: 0,
    interestRate: undefined,
    notes: '',
  });

  // Calculate totalPayments from dates
  const calculateTotalPayments = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return months > 0 ? months : 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leasingsData, summaryData, machinesData] = await Promise.all([
          financeApi.getLeasings(),
          financeApi.getLeasingSummary(),
          financeApi.getMachinesWithoutLeasing(),
        ]);
        setLeasings(leasingsData);
        setLeasingSummary(summaryData);
        setMachinesWithoutLeasing(machinesData);
      } catch (error) {
        console.error('Error fetching leasing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateLeasing = async () => {
    try {
      await financeApi.createLeasing(leasingForm);
      setShowLeasingModal(false);
      setLeasingForm({
        machineId: '',
        purchaseValue: 0,
        currentBalance: 0,
        monthlyPayment: 0,
        entity: '',
        startDate: '',
        endDate: '',
        totalPayments: 0,
        interestRate: undefined,
        notes: '',
      });
      // Refresh leasing data
      const [leasingsData, summaryData, machinesData] = await Promise.all([
        financeApi.getLeasings(),
        financeApi.getLeasingSummary(),
        financeApi.getMachinesWithoutLeasing(),
      ]);
      setLeasings(leasingsData);
      setLeasingSummary(summaryData);
      setMachinesWithoutLeasing(machinesData);
    } catch (error) {
      console.error('Error creating leasing:', error);
    }
  };

  const handleUpdateLeasing = async () => {
    if (!editingLeasing) return;
    try {
      await financeApi.updateLeasing(editingLeasing.id, leasingForm);
      setShowLeasingModal(false);
      setEditingLeasing(null);
      setLeasingForm({
        machineId: '',
        purchaseValue: 0,
        currentBalance: 0,
        monthlyPayment: 0,
        entity: '',
        startDate: '',
        endDate: '',
        totalPayments: 0,
        interestRate: undefined,
        notes: '',
      });
      // Refresh leasing data
      const [leasingsData, summaryData] = await Promise.all([
        financeApi.getLeasings(),
        financeApi.getLeasingSummary(),
      ]);
      setLeasings(leasingsData);
      setLeasingSummary(summaryData);
    } catch (error) {
      console.error('Error updating leasing:', error);
    }
  };

  const handleDeleteLeasing = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este leasing?')) return;
    try {
      await financeApi.deleteLeasing(id);
      // Refresh leasing data
      const [leasingsData, summaryData, machinesData] = await Promise.all([
        financeApi.getLeasings(),
        financeApi.getLeasingSummary(),
        financeApi.getMachinesWithoutLeasing(),
      ]);
      setLeasings(leasingsData);
      setLeasingSummary(summaryData);
      setMachinesWithoutLeasing(machinesData);
    } catch (error) {
      console.error('Error deleting leasing:', error);
    }
  };

  const openEditLeasing = (leasing: Leasing) => {
    const startDate = leasing.startDate.split('T')[0];
    const endDate = leasing.endDate.split('T')[0];
    setEditingLeasing(leasing);
    setLeasingForm({
      machineId: leasing.machineId,
      purchaseValue: leasing.purchaseValue,
      currentBalance: leasing.currentBalance,
      monthlyPayment: leasing.monthlyPayment,
      entity: leasing.entity,
      startDate,
      endDate,
      totalPayments: calculateTotalPayments(startDate, endDate) || leasing.totalPayments,
      interestRate: leasing.interestRate || undefined,
      notes: leasing.notes || '',
    });
    setShowLeasingModal(true);
  };

  const openPaymentModal = async (leasing: Leasing) => {
    setSelectedLeasingForPayment(leasing);
    setPaymentForm({
      leasingId: leasing.id,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: leasing.monthlyPayment,
      paymentsCount: 1,
      notes: '',
    });
    setShowPaymentModal(true);
    
    // Fetch existing payments
    try {
      const payments = await financeApi.getPaymentsByLeasing(leasing.id);
      setLeasingPayments(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setLeasingPayments([]);
    }
  };

  const handleCreatePayment = async () => {
    if (!selectedLeasingForPayment) return;
    try {
      await financeApi.createPayment(paymentForm);
      // Refresh payments and leasing data
      const payments = await financeApi.getPaymentsByLeasing(selectedLeasingForPayment.id);
      setLeasingPayments(payments);
      const leasingsData = await financeApi.getLeasings();
      setLeasings(leasingsData);
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!selectedLeasingForPayment) return;
    if (!confirm('¿Estás seguro de eliminar este pago?')) return;
    try {
      await financeApi.deletePayment(paymentId);
      // Refresh payments and leasing data
      const payments = await financeApi.getPaymentsByLeasing(selectedLeasingForPayment.id);
      setLeasingPayments(payments);
      const leasingsData = await financeApi.getLeasings();
      setLeasings(leasingsData);
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  if (loading) {
    return (
      <div className="finance-page">
        <div className="finance-loading">Cargando dashboard financiero...</div>
      </div>
    );
  }

  return (
    <div className="finance-page">
      <div className="finance-header">
        <h1>Dashboard Financiero</h1>
        <span className="finance-subtitle">
          Indicadores de rentabilidad, operatividad e impacto del taller
        </span>
      </div>

      <div className="finance-tabs">
        <button
          className={`finance-tab ${activeTab === 'leasing' ? 'finance-tab--active' : ''}`}
          onClick={() => setActiveTab('leasing')}
        >
          📋 Leasing
        </button>
      </div>

      <div className="finance-content">
        {activeTab === 'leasing' && (
          <div className="finance-leasing">
            <div className="finance-leasing-header">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingLeasing(null);
                  setLeasingForm({
                    machineId: '',
                    purchaseValue: 0,
                    currentBalance: 0,
                    monthlyPayment: 0,
                    entity: '',
                    startDate: '',
                    endDate: '',
                    totalPayments: 0,
                    interestRate: undefined,
                    notes: '',
                  });
                  setShowLeasingModal(true);
                }}
              >
                + Nuevo Leasing
              </button>
            </div>

            {leasingSummary && (
              <KPIGrid>
                <KPICard
                  metric={{
                    id: 'totalLeasings',
                    title: 'Total Leasings',
                    value: leasingSummary.totalLeasings,
                    variant: 'primary' as const,
                    icon: '📋',
                    subtitle: 'Registrados',
                  }}
                />
                <KPICard
                  metric={{
                    id: 'activeLeasings',
                    title: 'Leasings Activos',
                    value: leasingSummary.activeLeasings,
                    variant: 'info' as const,
                    icon: '✅',
                    subtitle: 'En curso',
                  }}
                />
                <KPICard
                  metric={{
                    id: 'totalPurchaseValue',
                    title: 'Valor Compra Total',
                    value: formatCurrency(leasingSummary.totalPurchaseValue),
                    variant: 'primary' as const,
                    icon: '💰',
                    subtitle: 'Valor original',
                  }}
                />
                <KPICard
                  metric={{
                    id: 'totalCurrentBalance',
                    title: 'Saldo Pendiente',
                    value: formatCurrency(leasingSummary.totalCurrentBalance),
                    variant: 'warning' as const,
                    icon: '📉',
                    subtitle: 'Capital por pagar',
                  }}
                />
                <KPICard
                  metric={{
                    id: 'totalMonthlyPayments',
                    title: 'Cuota Mensual',
                    value: formatCurrency(leasingSummary.totalMonthlyPayments),
                    variant: 'info' as const,
                    icon: '📅',
                    subtitle: 'Total mensual',
                  }}
                />
                <KPICard
                  metric={{
                    id: 'totalRemainingPayments',
                    title: 'Pagos Restantes',
                    value: leasingSummary.totalRemainingPayments,
                    variant: 'warning' as const,
                    icon: '⏳',
                    subtitle: 'Cuotas pendientes',
                  }}
                />
              </KPIGrid>
            )}

            <div className="finance-full-chart">
              <h3>Leasings Registrados</h3>
              <div className="finance-table finance-table--full">
                <table>
                  <thead>
                    <tr>
                      <th>Máquina</th>
                      <th>Entidad</th>
                      <th>Valor Compra</th>
                      <th>Saldo Pendiente</th>
                      <th>Cuota Mensual</th>
                      <th>Cuotas Pagadas</th>
                      <th>Cuotas Restantes</th>
                      <th>Fecha Inicio</th>
                      <th>Fecha Fin</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leasings.map((l) => (
                      <tr key={l.id}>
                        <td className="machine-code">{l.machineCode}</td>
                        <td>{l.entity}</td>
                        <td className="income">{formatCurrency(l.purchaseValue)}</td>
                        <td className="cost">{formatCurrency(l.currentBalance)}</td>
                        <td>{formatCurrency(l.monthlyPayment)}</td>
                        <td>{l.paidPayments} / {l.totalPayments}</td>
                        <td>{l.remainingPayments}</td>
                        <td>{new Date(l.startDate).toLocaleDateString('es-CL')}</td>
                        <td>{new Date(l.endDate).toLocaleDateString('es-CL')}</td>
                        <td>
                          <span className={`status-badge status-badge--${l.status === 'ACTIVE' ? 'success' : l.status === 'PAID' ? 'info' : 'danger'}`}>
                            {l.status === 'ACTIVE' ? 'Activo' : l.status === 'PAID' ? 'Pagado' : 'Cancelado'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn-icon"
                            onClick={() => openPaymentModal(l)}
                            title="Registrar Pago"
                          >
                            💰
                          </button>
                          <button 
                            className="btn-icon"
                            onClick={() => openEditLeasing(l)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon"
                            onClick={() => handleDeleteLeasing(l.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal for creating/editing leasing */}
            {showLeasingModal && (
              <div className="modal-overlay" onClick={() => setShowLeasingModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{editingLeasing ? 'Editar Leasing' : 'Nuevo Leasing'}</h3>
                    <button className="modal-close" onClick={() => setShowLeasingModal(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    {!editingLeasing && (
                      <div className="form-group">
                        <label>Máquina</label>
                        <select
                          value={leasingForm.machineId}
                          onChange={(e) => setLeasingForm({ ...leasingForm, machineId: e.target.value })}
                        >
                          <option value="">Seleccionar máquina...</option>
                          {machinesWithoutLeasing.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.code} - {m.brand} {m.model}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="form-group">
                      <label>Entidad Financiadora</label>
                      <input
                        type="text"
                        value={leasingForm.entity}
                        onChange={(e) => setLeasingForm({ ...leasingForm, entity: e.target.value })}
                        placeholder="Banco o empresa de leasing"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Valor de Compra</label>
                        <input
                          type="number"
                          value={leasingForm.purchaseValue}
                          onChange={(e) => setLeasingForm({ ...leasingForm, purchaseValue: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Saldo Capital</label>
                        <input
                          type="number"
                          value={leasingForm.currentBalance}
                          onChange={(e) => setLeasingForm({ ...leasingForm, currentBalance: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Cuota Mensual</label>
                        <input
                          type="number"
                          value={leasingForm.monthlyPayment}
                          onChange={(e) => setLeasingForm({ ...leasingForm, monthlyPayment: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Total Cuotas (calculado automáticamente)</label>
                        <input
                          type="number"
                          value={leasingForm.totalPayments}
                          readOnly
                          style={{ backgroundColor: '#f5f5f5' }}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Fecha Inicio</label>
                        <input
                          type="date"
                          value={leasingForm.startDate}
                          onChange={(e) => {
                            const newStartDate = e.target.value;
                            const newEndDate = leasingForm.endDate;
                            setLeasingForm({ 
                              ...leasingForm, 
                              startDate: newStartDate,
                              totalPayments: calculateTotalPayments(newStartDate, newEndDate)
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Fecha Fin</label>
                        <input
                          type="date"
                          value={leasingForm.endDate}
                          onChange={(e) => {
                            const newEndDate = e.target.value;
                            const newStartDate = leasingForm.startDate;
                            setLeasingForm({ 
                              ...leasingForm, 
                              endDate: newEndDate,
                              totalPayments: calculateTotalPayments(newStartDate, newEndDate)
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Tasa de Interés (%) - Opcional</label>
                      <input
                        type="number"
                        step="0.01"
                        value={leasingForm.interestRate || ''}
                        onChange={(e) => setLeasingForm({ ...leasingForm, interestRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Notas - Opcional</label>
                      <textarea
                        value={leasingForm.notes}
                        onChange={(e) => setLeasingForm({ ...leasingForm, notes: e.target.value })}
                        placeholder="Observaciones adicionales..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowLeasingModal(false)}>
                      Cancelar
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={editingLeasing ? handleUpdateLeasing : handleCreateLeasing}
                      disabled={!leasingForm.machineId && !editingLeasing}
                    >
                      {editingLeasing ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedLeasingForPayment && (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
              <h3>Registrar Pago - {selectedLeasingForPayment.machineCode}</h3>
              
              <div className="modal-content">
                <div className="payment-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Fecha de Pago</label>
                      <input
                        type="date"
                        value={paymentForm.paymentDate}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Monto</label>
                      <input
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Cuotas pagadas</label>
                      <input
                        type="number"
                        min="1"
                        value={paymentForm.paymentsCount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentsCount: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Notas - Opcional</label>
                      <input
                        type="text"
                        value={paymentForm.notes || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        placeholder="Ej: Pago anticipado"
                      />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={handleCreatePayment}>
                    Registrar Pago
                  </button>
                </div>

                {/* Payment History */}
                <div className="payment-history">
                  <h4>Historial de Pagos</h4>
                  {leasingPayments.length === 0 ? (
                    <p className="no-data">No hay pagos registrados</p>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Monto</th>
                          <th>Cuotas</th>
                          <th>Total Pagado</th>
                          <th>Notas</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {leasingPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td>{new Date(payment.paymentDate).toLocaleDateString('es-CL')}</td>
                            <td>{formatCurrency(payment.amount)}</td>
                            <td>{payment.paymentsCount}</td>
                            <td>{payment.totalPaidAfter}/{selectedLeasingForPayment.totalPayments}</td>
                            <td>{payment.notes || '-'}</td>
                            <td>
                              <button 
                                className="btn-icon"
                                onClick={() => handleDeletePayment(payment.id)}
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancePage;
