export interface MachineAssignmentProps {
  id?: string;
  contractId: string;
  machineId: string;
  hourlyRate: number;
  workedHours: number;
  maintenanceCost: number;
  generatedIncome: number;
  margin: number;
  createdAt?: Date;
  updatedAt?: Date;
}
