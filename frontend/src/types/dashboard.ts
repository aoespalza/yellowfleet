export type KPIVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface KPIMetric {
  id: string;
  title: string;
  value: string | number;
  variant: KPIVariant;
  icon?: string;
  subtitle?: string;
}

export interface DashboardData {
  totalMachines: number;
  availableMachines: number;
  machinesInContract: number;
  machinesInWorkshop: number;
  totalAcquisitionValue: number;
  utilizationPercentage: number;
}
