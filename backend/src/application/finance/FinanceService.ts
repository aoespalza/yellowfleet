import { IContractRepository } from '../contracts/IContractRepository';
import { IMachineRepository } from '../fleet/IMachineRepository';
import { IWorkOrderRepository } from '../workshop/IWorkOrderRepository';
import { MachineStatus } from '../../domain/fleet/MachineStatus';

export interface MachineProfitabilityResult {
  machineId: string;
  totalIncome: number;
  totalMaintenanceCost: number;
  margin: number;
  roi: number;
}

export interface ContractMarginResult {
  contractId: string;
  totalMargin: number;
  marginPercentage: number;
}

export interface FleetAvailabilityResult {
  totalMachines: number;
  availableMachines: number;
  availabilityPercentage: number;
}

export class FinanceService {
  constructor(
    private contractRepository: IContractRepository,
    private machineRepository: IMachineRepository,
    private workOrderRepository: IWorkOrderRepository
  ) {}

  async calculateMachineProfitability(machineId: string): Promise<MachineProfitabilityResult> {
    const contracts = await this.contractRepository.findAll();

    let totalIncome = 0;
    let totalMaintenanceCost = 0;

    for (const contract of contracts) {
      const assignments = contract.getAssignments();
      for (const assignment of assignments) {
        if (assignment.machineId === machineId) {
          totalIncome += assignment.generatedIncome;
          totalMaintenanceCost += assignment.maintenanceCost;
        }
      }
    }

    const margin = totalIncome - totalMaintenanceCost;
    const roi = totalIncome > 0 ? margin / totalIncome : 0;

    return {
      machineId,
      totalIncome,
      totalMaintenanceCost,
      margin,
      roi,
    };
  }

  async calculateContractMargin(contractId: string): Promise<ContractMarginResult> {
    const contract = await this.contractRepository.findById(contractId);

    if (!contract) {
      throw new Error('Contract not found');
    }

    const totalMargin = contract.calculateTotalMargin();
    const totalValue = contract.value;
    const marginPercentage = totalValue > 0 ? (totalMargin / totalValue) * 100 : 0;

    return {
      contractId,
      totalMargin,
      marginPercentage,
    };
  }

  async calculateFleetAvailability(): Promise<FleetAvailabilityResult> {
    const machines = await this.machineRepository.findAll();
    const totalMachines = machines.length;

    const availableMachines = machines.filter(
      (machine) => machine.status !== MachineStatus.IN_WORKSHOP && machine.status !== MachineStatus.INACTIVE
    ).length;

    const availabilityPercentage = totalMachines > 0 ? (availableMachines / totalMachines) * 100 : 0;

    return {
      totalMachines,
      availableMachines,
      availabilityPercentage,
    };
  }
}
