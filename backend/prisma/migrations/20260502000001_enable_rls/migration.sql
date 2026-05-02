-- ============================================================
-- RLS (Row Level Security) para YellowFleet
-- Roles: ADMIN (todo), MANAGER (todo operacional), OPERATOR (solo lectura)
-- El backend hace SET LOCAL ROLE yf_app en cada TX autenticada.
-- ============================================================

-- ── Crear rol de aplicación ───────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'yf_app') THEN
    CREATE ROLE yf_app NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO yf_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yf_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yf_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yf_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yf_app;

-- ── Funciones de contexto ─────────────────────────────────────
CREATE OR REPLACE FUNCTION app_user_id() RETURNS text AS $$
  SELECT COALESCE(current_setting('app.user_id', true), '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_user_role() RETURNS text AS $$
  SELECT COALESCE(current_setting('app.user_role', true), '');
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION app_user_id() TO yf_app;
GRANT EXECUTE ON FUNCTION app_user_role() TO yf_app;

-- ── Habilitar RLS en todas las tablas ────────────────────────
ALTER TABLE "User"                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User"                       FORCE ROW LEVEL SECURITY;
ALTER TABLE "Role"                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Role"                       FORCE ROW LEVEL SECURITY;
ALTER TABLE "Machine"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Machine"                    FORCE ROW LEVEL SECURITY;
ALTER TABLE "Operator"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Operator"                   FORCE ROW LEVEL SECURITY;
ALTER TABLE "Job"                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job"                        FORCE ROW LEVEL SECURITY;
ALTER TABLE "Equipment"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Equipment"                  FORCE ROW LEVEL SECURITY;
ALTER TABLE "OperatorEquipment"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OperatorEquipment"          FORCE ROW LEVEL SECURITY;
ALTER TABLE "Contract"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contract"                   FORCE ROW LEVEL SECURITY;
ALTER TABLE "MachineAssignment"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MachineAssignment"          FORCE ROW LEVEL SECURITY;
ALTER TABLE "MachineOperatorAssignment"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MachineOperatorAssignment"  FORCE ROW LEVEL SECURITY;
ALTER TABLE "WorkOrder"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkOrder"                  FORCE ROW LEVEL SECURITY;
ALTER TABLE "WorkOrderLog"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkOrderLog"               FORCE ROW LEVEL SECURITY;
ALTER TABLE "HourMeterLog"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HourMeterLog"               FORCE ROW LEVEL SECURITY;
ALTER TABLE "LegalDocument"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LegalDocument"              FORCE ROW LEVEL SECURITY;
ALTER TABLE "Leasing"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Leasing"                    FORCE ROW LEVEL SECURITY;
ALTER TABLE "LeasingPayment"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeasingPayment"             FORCE ROW LEVEL SECURITY;
ALTER TABLE "SystemConfig"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemConfig"               FORCE ROW LEVEL SECURITY;

-- ── POLÍTICAS — DO block separado por tabla ───────────────────

-- User: ADMIN todo, MANAGER y OPERATOR solo lectura, OPERATOR solo su fila
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='user_admin' AND tablename='User') THEN
    CREATE POLICY user_admin    ON "User" FOR ALL    TO yf_app USING (app_user_role() = 'ADMIN');
    CREATE POLICY user_manager  ON "User" FOR SELECT TO yf_app USING (app_user_role() = 'MANAGER');
    CREATE POLICY user_operator ON "User" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR' AND id = app_user_id());
  END IF;
END $$;

-- Role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='role_admin' AND tablename='Role') THEN
    CREATE POLICY role_admin  ON "Role" FOR ALL    TO yf_app USING (app_user_role() = 'ADMIN');
    CREATE POLICY role_read   ON "Role" FOR SELECT TO yf_app USING (app_user_role() IN ('MANAGER', 'OPERATOR'));
  END IF;
END $$;

-- Machine
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='machine_staff' AND tablename='Machine') THEN
    CREATE POLICY machine_staff    ON "Machine" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY machine_operator ON "Machine" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- Operator
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='operator_staff' AND tablename='Operator') THEN
    CREATE POLICY operator_staff    ON "Operator" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY operator_read     ON "Operator" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- Job
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='job_staff' AND tablename='Job') THEN
    CREATE POLICY job_staff  ON "Job" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY job_read   ON "Job" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- Equipment
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='equipment_staff' AND tablename='Equipment') THEN
    CREATE POLICY equipment_staff  ON "Equipment" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY equipment_read   ON "Equipment" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- OperatorEquipment
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='opequip_staff' AND tablename='OperatorEquipment') THEN
    CREATE POLICY opequip_staff  ON "OperatorEquipment" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY opequip_read   ON "OperatorEquipment" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- Contract
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='contract_staff' AND tablename='Contract') THEN
    CREATE POLICY contract_staff    ON "Contract" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY contract_operator ON "Contract" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- MachineAssignment
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='massign_staff' AND tablename='MachineAssignment') THEN
    CREATE POLICY massign_staff    ON "MachineAssignment" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY massign_operator ON "MachineAssignment" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- MachineOperatorAssignment
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='moassign_staff' AND tablename='MachineOperatorAssignment') THEN
    CREATE POLICY moassign_staff    ON "MachineOperatorAssignment" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY moassign_operator ON "MachineOperatorAssignment" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- WorkOrder
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='wo_staff' AND tablename='WorkOrder') THEN
    CREATE POLICY wo_staff    ON "WorkOrder" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY wo_operator ON "WorkOrder" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- WorkOrderLog
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='wolog_staff' AND tablename='WorkOrderLog') THEN
    CREATE POLICY wolog_staff    ON "WorkOrderLog" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY wolog_operator ON "WorkOrderLog" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- HourMeterLog: OPERATOR puede INSERT (actualiza horómetro desde móvil)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='hmlog_staff' AND tablename='HourMeterLog') THEN
    CREATE POLICY hmlog_staff    ON "HourMeterLog" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY hmlog_operator_read   ON "HourMeterLog" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
    CREATE POLICY hmlog_operator_insert ON "HourMeterLog" FOR INSERT TO yf_app WITH CHECK (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- LegalDocument
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='legaldoc_staff' AND tablename='LegalDocument') THEN
    CREATE POLICY legaldoc_staff    ON "LegalDocument" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY legaldoc_operator ON "LegalDocument" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- Leasing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='leasing_staff' AND tablename='Leasing') THEN
    CREATE POLICY leasing_staff    ON "Leasing" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY leasing_operator ON "Leasing" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- LeasingPayment
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='leasingpay_staff' AND tablename='LeasingPayment') THEN
    CREATE POLICY leasingpay_staff    ON "LeasingPayment" FOR ALL    TO yf_app USING (app_user_role() IN ('ADMIN', 'MANAGER'));
    CREATE POLICY leasingpay_operator ON "LeasingPayment" FOR SELECT TO yf_app USING (app_user_role() = 'OPERATOR');
  END IF;
END $$;

-- SystemConfig: solo ADMIN
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='sysconfig_admin' AND tablename='SystemConfig') THEN
    CREATE POLICY sysconfig_admin ON "SystemConfig" FOR ALL TO yf_app USING (app_user_role() = 'ADMIN');
  END IF;
END $$;

-- Permisos explícitos a yf_app en todas las tablas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yf_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yf_app;
