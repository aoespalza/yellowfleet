import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { machineApi } from '../api/machineApi';
import { workOrderApi } from '../api/workOrderApi';
import type { Machine } from '../types/machine';
import jsQR from 'jsqr';

export function OperatorMobilePage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const machineIdFromQR = searchParams.get('maquina');

  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [newHourMeter, setNewHourMeter] = useState('');
  const [hourMsg, setHourMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [savingHours, setSavingHours] = useState(false);

  // Scanner QR
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const stopScanner = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScannerOpen(false);
    setScanError(null);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext('2d')!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code?.data) {
      try {
        const url = new URL(code.data);
        const id = url.searchParams.get('maquina');
        if (id) {
          stopScanner();
          // Navegar a la misma página con el parámetro de la máquina
          window.location.href = `${window.location.pathname}?maquina=${id}`;
          return;
        }
      } catch {
        // QR válido pero no es URL de YellowFleet, seguir escaneando
      }
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    setScanError(null);
    setScannerOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      // Dar tiempo a que el modal monte el video
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          rafRef.current = requestAnimationFrame(scanFrame);
        }
      }, 100);
    } catch {
      setScanError('No se pudo acceder a la cámara. Verifica los permisos en tu navegador.');
      setScannerOpen(false);
    }
  }, [scanFrame]);

  // Limpiar stream al desmontar
  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  // Formulario de reporte de falla
  const [showFaultForm, setShowFaultForm] = useState(false);
  const [faultDesc, setFaultDesc] = useState('');
  const [savingFault, setSavingFault] = useState(false);
  const [faultMsg, setFaultMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadMachine();
  }, []);

  const loadMachine = async () => {
    try {
      setLoading(true);
      if (machineIdFromQR) {
        // Cargar la máquina específica del QR
        const machines = await machineApi.getAll();
        const found = machines.find(m => m.id === machineIdFromQR);
        setMachine(found || null);
      } else {
        setMachine(null);
      }
    } catch {
      setMachine(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHours = async () => {
    if (!machine || !newHourMeter) return;
    const val = parseFloat(newHourMeter);
    if (isNaN(val) || val < (machine.hourMeter as any || 0)) {
      setHourMsg({ type: 'error', text: 'El horómetro no puede ser menor al valor actual' });
      return;
    }
    try {
      setSavingHours(true);
      const result = await machineApi.updateHourMeter(machine.id, val);
      setMachine(prev => prev ? { ...prev, hourMeter: val as any } : prev);
      setNewHourMeter('');
      setHourMsg({ type: 'ok', text: `Horómetro actualizado a ${val} hrs` +
        (result.maintenanceStatus?.isDue ? ' ⚠️ Mantenimiento vencido' : '') });
      setTimeout(() => setHourMsg(null), 4000);
    } catch {
      setHourMsg({ type: 'error', text: 'Error al actualizar. Intenta de nuevo.' });
    } finally {
      setSavingHours(false);
    }
  };

  const handleReportFault = async () => {
    if (!machine || !faultDesc.trim()) return;
    try {
      setSavingFault(true);
      await workOrderApi.create({
        machineId: machine.id,
        type: 'CORRECTIVE',
        entryDate: new Date().toISOString(),
        description: faultDesc.trim()
      } as any);
      setFaultDesc('');
      setShowFaultForm(false);
      setFaultMsg({ type: 'ok', text: 'Falla reportada correctamente. Taller notificado.' });
      await loadMachine();
      setTimeout(() => setFaultMsg(null), 5000);
    } catch {
      setFaultMsg({ type: 'error', text: 'Error al reportar. Intenta de nuevo.' });
    } finally {
      setSavingFault(false);
    }
  };

  const statusLabel: Record<string, { label: string; color: string }> = {
    AVAILABLE:    { label: 'Disponible',     color: '#10b981' },
    IN_CONTRACT:  { label: 'En contrato',    color: '#3b82f6' },
    IN_WORKSHOP:  { label: 'En taller',      color: '#f59e0b' },
    IN_TRANSFER:  { label: 'En traslado',    color: '#8b5cf6' },
    INACTIVE:     { label: 'Inactivo',       color: '#6b7280' },
  };

  const st = machine ? (statusLabel[machine.status] || { label: machine.status, color: '#6b7280' }) : null;

  const maintenancePct = machine?.maintenanceIntervalHours
    ? Math.round(((machine.hoursSinceLastMaintenance || 0) / machine.maintenanceIntervalHours) * 100)
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#111827', color: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#1f2937', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🟡</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>YellowFleet</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Hola, {user?.username}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onNavigate && (
            <button onClick={() => onNavigate('dashboard')}
              style={{ background: '#374151', border: 'none', color: '#f9fafb', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
              🖥️ Escritorio
            </button>
          )}
          <button onClick={logout}
            style={{ background: '#374151', border: 'none', color: '#9ca3af', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Cargando...</div>
        ) : !machine ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📷</div>
            <h2 style={{ color: '#f59e0b', marginBottom: 8 }}>Escanea el QR</h2>
            <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Usa la cámara para escanear el código QR pegado en la máquina.
            </p>
            <button
              onClick={startScanner}
              style={{ background: '#f59e0b', border: 'none', color: '#111827', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer', width: '100%', maxWidth: 280 }}>
              📷 Abrir cámara
            </button>
            {machineIdFromQR && (
              <p style={{ color: '#dc2626', fontSize: 13, marginTop: 16 }}>
                No se encontró la máquina con ese código. Verifica el QR.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Tarjeta de máquina */}
            <div style={{ background: '#1f2937', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{machine.code}</div>
                  <div style={{ fontSize: 14, color: '#d1d5db' }}>{machine.brand} {machine.model} {machine.year}</div>
                </div>
                <span style={{ background: st!.color + '22', color: st!.color, border: `1px solid ${st!.color}44`, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  {st!.label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: '#111827', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>HORÓMETRO</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{(machine.hourMeter as any || 0).toLocaleString()} hrs</div>
                </div>
                {machine.currentLocation && (
                  <div style={{ background: '#111827', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>UBICACIÓN</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{machine.currentLocation as any}</div>
                  </div>
                )}
              </div>

              {/* Barra de mantenimiento */}
              {maintenancePct !== null && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#9ca3af' }}>Mantenimiento preventivo</span>
                    <span style={{ color: maintenancePct >= 100 ? '#dc2626' : maintenancePct >= 80 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                      {maintenancePct}%
                    </span>
                  </div>
                  <div style={{ background: '#374151', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${Math.min(maintenancePct, 100)}%`,
                      background: maintenancePct >= 100 ? '#dc2626' : maintenancePct >= 80 ? '#f59e0b' : '#10b981'
                    }} />
                  </div>
                  {maintenancePct >= 80 && (
                    <div style={{ marginTop: 6, fontSize: 12, color: maintenancePct >= 100 ? '#dc2626' : '#f59e0b' }}>
                      {maintenancePct >= 100
                        ? '🔴 Mantenimiento vencido — notifica a tu supervisor'
                        : `🟡 Faltan ${((machine.maintenanceIntervalHours || 0) - (machine.hoursSinceLastMaintenance || 0)).toFixed(0)} hrs para el próximo mantenimiento`}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actualizar horómetro */}
            {machine.status !== 'IN_WORKSHOP' && (
              <div style={{ background: '#1f2937', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #374151' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#f59e0b' }}>⏱️ Actualizar Horómetro</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    placeholder={`Actual: ${(machine.hourMeter as any || 0)} hrs`}
                    value={newHourMeter}
                    onChange={e => setNewHourMeter(e.target.value)}
                    style={{ flex: 1, background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', padding: '10px 12px', fontSize: 16 }}
                  />
                  <button
                    onClick={handleUpdateHours}
                    disabled={savingHours || !newHourMeter}
                    style={{ background: '#f59e0b', border: 'none', color: '#111827', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: savingHours ? 0.6 : 1 }}>
                    {savingHours ? '...' : 'Guardar'}
                  </button>
                </div>
                {hourMsg && (
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, fontSize: 13,
                    background: hourMsg.type === 'ok' ? '#064e3b' : '#7f1d1d',
                    color: hourMsg.type === 'ok' ? '#6ee7b7' : '#fca5a5' }}>
                    {hourMsg.text}
                  </div>
                )}
              </div>
            )}

            {/* Reportar falla */}
            <div style={{ background: '#1f2937', borderRadius: 12, padding: 16, border: '1px solid #374151' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#f59e0b' }}>🚨 Reportar Falla</h3>

              {machine.status === 'IN_WORKSHOP' ? (
                <div style={{ color: '#f59e0b', fontSize: 13, padding: '8px 12px', background: '#451a03', borderRadius: 8 }}>
                  ⚠️ Esta máquina ya tiene una orden de trabajo activa en el taller.
                </div>
              ) : !showFaultForm ? (
                <button
                  onClick={() => setShowFaultForm(true)}
                  style={{ width: '100%', background: '#7f1d1d', border: '1px solid #dc2626', color: '#fca5a5', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  + Nueva Falla / Novedad
                </button>
              ) : (
                <>
                  <textarea
                    rows={4}
                    placeholder="Describe la falla o novedad con el mayor detalle posible..."
                    value={faultDesc}
                    onChange={e => setFaultDesc(e.target.value)}
                    style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', padding: '10px 12px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => { setShowFaultForm(false); setFaultDesc(''); }}
                      style={{ flex: 1, background: '#374151', border: 'none', color: '#9ca3af', padding: '10px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button onClick={handleReportFault} disabled={savingFault || !faultDesc.trim()}
                      style={{ flex: 2, background: '#dc2626', border: 'none', color: 'white', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: savingFault ? 0.6 : 1 }}>
                      {savingFault ? 'Enviando...' : '🚨 Reportar Falla'}
                    </button>
                  </div>
                </>
              )}

              {faultMsg && (
                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, fontSize: 13,
                  background: faultMsg.type === 'ok' ? '#064e3b' : '#7f1d1d',
                  color: faultMsg.type === 'ok' ? '#6ee7b7' : '#fca5a5' }}>
                  {faultMsg.text}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {/* Modal scanner QR */}
      {scannerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}>📷 Apunta al QR de la máquina</span>
            <button onClick={stopScanner}
              style={{ background: '#374151', border: 'none', color: '#f9fafb', padding: '8px 16px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
              ✕ Cerrar
            </button>
          </div>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <video ref={videoRef} playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Marco guía */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 220, height: 220,
              border: '3px solid #f59e0b', borderRadius: 12,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
            }} />
            <p style={{ position: 'absolute', bottom: 24, width: '100%', textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>
              Centra el código QR dentro del recuadro
            </p>
          </div>
          {scanError && (
            <div style={{ padding: 16, background: '#7f1d1d', color: '#fca5a5', textAlign: 'center', fontSize: 14 }}>
              {scanError}
            </div>
          )}
        </div>
      )}

      {/* Canvas oculto para procesar frames */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
