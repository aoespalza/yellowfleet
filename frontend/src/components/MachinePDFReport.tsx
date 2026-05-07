import type { MachineDetails } from '../api/machineApi';
import type { WorkOrder } from '../types/workOrder';
import './MachinePDFReport.css';

interface Props {
  details: MachineDetails;
  workOrders: WorkOrder[];
}

const fmt = (v: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('es-CL') : '—';

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE:   'Disponible',
  IN_CONTRACT: 'En Contrato',
  IN_WORKSHOP: 'En Taller',
  IN_TRANSFER: 'En Traslado',
  INACTIVE:    'Inactivo',
};

const WO_TYPE: Record<string, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  PREDICTIVE: 'Predictivo',
};

const WO_STATUS: Record<string, string> = {
  OPEN:          'Abierta',
  IN_PROGRESS:   'En Progreso',
  WAITING_PARTS: 'Esperando Repuestos',
  COMPLETED:     'Completada',
  CANCELLED:     'Cancelada',
};

export function MachinePDFReport({ details, workOrders }: Props) {
  const today = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
  const p = details.profitability;

  // Mantenimiento preventivo (si viene en los datos extendidos)
  const maint = (details as any);
  const maintPct = maint.maintenanceIntervalHours
    ? Math.round(((maint.hoursSinceLastMaintenance || 0) / maint.maintenanceIntervalHours) * 100)
    : null;

  return (
    <div className="pdf-report">

      {/* ── ENCABEZADO ── */}
      <header className="pdf-header">
        <div className="pdf-header-left">
          <div className="pdf-logo">🟡 YellowFleet</div>
          <div className="pdf-subtitle">Hoja de Vida de Máquina</div>
        </div>
        <div className="pdf-header-right">
          <div className="pdf-machine-code">{details.code}</div>
          <div className="pdf-date">Generado: {today}</div>
        </div>
      </header>

      {/* ── INFORMACIÓN GENERAL ── */}
      <section className="pdf-section">
        <h2 className="pdf-section-title">Información General</h2>
        <div className="pdf-grid-2">
          <table className="pdf-info-table">
            <tbody>
              <tr><td className="pdf-label">Tipo</td><td>{details.type}</td></tr>
              <tr><td className="pdf-label">Marca / Modelo</td><td>{details.brand} {details.model}</td></tr>
              <tr><td className="pdf-label">Año</td><td>{details.year}</td></tr>
              <tr><td className="pdf-label">N° Serie</td><td>{details.serialNumber}</td></tr>
            </tbody>
          </table>
          <table className="pdf-info-table">
            <tbody>
              <tr><td className="pdf-label">Estado</td><td>{STATUS_LABEL[details.status] || details.status}</td></tr>
              <tr><td className="pdf-label">Horómetro</td><td>{details.hourMeter?.toLocaleString() || 0} hrs</td></tr>
              <tr><td className="pdf-label">Ubicación</td><td>{details.currentLocation || '—'}</td></tr>
              <tr><td className="pdf-label">Valor Adquisición</td><td>{fmt(details.acquisitionValue)}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── MANTENIMIENTO PREVENTIVO ── */}
      {maint.maintenanceIntervalHours && (
        <section className="pdf-section">
          <h2 className="pdf-section-title">Mantenimiento Preventivo</h2>
          <div className="pdf-grid-2">
            <table className="pdf-info-table">
              <tbody>
                <tr><td className="pdf-label">Intervalo</td><td>{maint.maintenanceIntervalHours} hrs</td></tr>
                <tr><td className="pdf-label">Horas desde último mant.</td><td>{(maint.hoursSinceLastMaintenance || 0).toFixed(0)} hrs</td></tr>
                <tr><td className="pdf-label">Uso del intervalo</td>
                  <td style={{ color: maintPct! >= 100 ? '#dc2626' : maintPct! >= 80 ? '#d97706' : '#16a34a', fontWeight: 700 }}>
                    {maintPct}%
                  </td>
                </tr>
                <tr><td className="pdf-label">Último mantenimiento</td><td>{fmtDate(maint.lastMaintenanceDate)}</td></tr>
              </tbody>
            </table>
            <div className="pdf-maint-bar-wrapper">
              <div className="pdf-maint-bar-bg">
                <div className="pdf-maint-bar-fill"
                  style={{ width: `${Math.min(maintPct!, 100)}%`,
                    background: maintPct! >= 100 ? '#dc2626' : maintPct! >= 80 ? '#d97706' : '#16a34a' }} />
              </div>
              <div className="pdf-maint-bar-label">
                {maintPct! >= 100 ? '⚠️ Mantenimiento vencido' :
                 maintPct! >= 80  ? '🟡 Próximo a vencer' : '✅ Al día'}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── RENTABILIDAD ── */}
      <section className="pdf-section">
        <h2 className="pdf-section-title">Rentabilidad Acumulada</h2>
        <div className="pdf-kpi-row">
          <div className="pdf-kpi"><div className="pdf-kpi-val">{p.totalWorkedHours?.toLocaleString() || 0} hrs</div><div className="pdf-kpi-lbl">Horas Trabajadas</div></div>
          <div className="pdf-kpi"><div className="pdf-kpi-val income">{fmt(p.totalIncome)}</div><div className="pdf-kpi-lbl">Ingresos Totales</div></div>
          <div className="pdf-kpi"><div className="pdf-kpi-val expense">{fmt(p.totalMaintenanceCost)}</div><div className="pdf-kpi-lbl">Costos Mant.</div></div>
          <div className="pdf-kpi"><div className={`pdf-kpi-val ${p.totalMargin >= 0 ? 'income' : 'expense'}`}>{fmt(p.totalMargin)}</div><div className="pdf-kpi-lbl">Margen Total</div></div>
        </div>
        {p.productivityPercentage !== undefined && (
          <div className="pdf-kpi-row" style={{ marginTop: 8 }}>
            <div className="pdf-kpi"><div className="pdf-kpi-val">{p.totalContractDays?.toLocaleString() || 0}</div><div className="pdf-kpi-lbl">Días Contrato</div></div>
            <div className="pdf-kpi"><div className="pdf-kpi-val">{p.productiveDays?.toLocaleString() || 0}</div><div className="pdf-kpi-lbl">Días Productivos</div></div>
            <div className="pdf-kpi"><div className="pdf-kpi-val">{p.productivityPercentage?.toFixed(1)}%</div><div className="pdf-kpi-lbl">Productividad</div></div>
            <div className="pdf-kpi"><div className="pdf-kpi-val income">{fmt(p.dailyIncome || 0)}/día</div><div className="pdf-kpi-lbl">Ingreso Diario Prom.</div></div>
          </div>
        )}
      </section>

      {/* ── CONTRATOS ── */}
      {details.contracts.length > 0 && (
        <section className="pdf-section">
          <h2 className="pdf-section-title">Historial de Contratos ({details.contracts.length})</h2>
          <table className="pdf-table">
            <thead>
              <tr>
                <th>Código</th><th>Cliente</th><th>Inicio</th><th>Fin</th>
                <th>Estado</th><th>Horas</th><th>Ingresos</th><th>Costos</th><th>Margen</th>
              </tr>
            </thead>
            <tbody>
              {details.contracts.map(c => (
                <tr key={c.contractId}>
                  <td>{c.contractCode}</td>
                  <td>{c.customer}</td>
                  <td>{fmtDate(c.startDate)}</td>
                  <td>{fmtDate(c.endDate)}</td>
                  <td>{c.status}</td>
                  <td style={{ textAlign: 'right' }}>{c.workedHours.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(c.generatedIncome)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(c.maintenanceCost)}</td>
                  <td style={{ textAlign: 'right', color: c.margin >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{fmt(c.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── ÓRDENES DE TRABAJO ── */}
      {workOrders.length > 0 && (
        <section className="pdf-section">
          <h2 className="pdf-section-title">Órdenes de Trabajo ({workOrders.length})</h2>
          <table className="pdf-table">
            <thead>
              <tr>
                <th>Tipo</th><th>Estado</th><th>Entrada</th><th>Salida</th>
                <th>Días Paro</th><th>Repuestos</th><th>M. de Obra</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map(wo => (
                <tr key={wo.id}>
                  <td>{WO_TYPE[wo.type] || wo.type}</td>
                  <td>{WO_STATUS[wo.status] || wo.status}</td>
                  <td>{fmtDate(wo.entryDate)}</td>
                  <td>{wo.exitDate ? fmtDate(wo.exitDate) : '—'}</td>
                  <td style={{ textAlign: 'right' }}>{wo.downtimeHours != null ? Math.round(wo.downtimeHours / 24) : '—'}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(wo.sparePartsCost || 0)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(wo.laborCost || 0)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(wo.totalCost || 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ fontWeight: 700 }}>TOTALES</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  {Math.round(workOrders.reduce((s, wo) => s + (wo.downtimeHours || 0), 0) / 24)} días
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  {fmt(workOrders.reduce((s, wo) => s + (wo.sparePartsCost || 0), 0))}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  {fmt(workOrders.reduce((s, wo) => s + (wo.laborCost || 0), 0))}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  {fmt(workOrders.reduce((s, wo) => s + (wo.totalCost || 0), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>
      )}

      {/* ── PIE ── */}
      <footer className="pdf-footer">
        <div>YellowFleet — Sistema de Gestión de Flota</div>
        <div>Documento generado el {today}</div>
      </footer>
    </div>
  );
}
