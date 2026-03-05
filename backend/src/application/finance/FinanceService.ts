import { IContractRepository } from '../contracts/IContractRepository';
import { IMachineRepository } from '../fleet/IMachineRepository';
import { IWorkOrderRepository } from '../workshop/IWorkOrderRepository';
import { MachineStatus } from '../../domain/fleet/MachineStatus';
import prisma from '../../infrastructure/prisma/prismaClient';

export interface MachineProfitabilityResult {
  machineId: string;
  machineCode: string;
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

export interface FinanceDashboardResult {
  totalIncome: number;
  totalMaintenanceCost: number;
  totalSparePartsCost: number;
  totalLaborCost: number;
  grossMargin: number;
  marginPercentage: number;
  totalDowntimeHours: number;
  availabilityPercentage: number;
  activeContracts: number;
  machinesInWorkshop: number;
  averageProfitPerMachine: number;
}

export interface MachineUptimeResult {
  machineId: string;
  machineCode: string;
  totalHours: number;
  workshopHours: number;
  operatingHours: number;
  uptimePercentage: number;
  maintenanceCount: number;
}

export interface WorkshopImpactResult {
  machineId: string;
  machineCode: string;
  sparePartsCost: number;
  laborCost: number;
  totalCost: number;
  downtimeHours: number;
  maintenanceCount: number;
  lostIncome: number;
  lastMaintenanceDate: string | null;
}

export interface LeasingItem {
  id: string;
  machineId: string;
  machineCode: string;
  machineBrand: string;
  machineModel: string;
  purchaseValue: number;
  currentBalance: number;
  monthlyPayment: number;
  entity: string;
  startDate: string;
  endDate: string;
  totalPayments: number;
  paidPayments: number;
  remainingPayments: number;
  interestRate: number | null;
  status: string;
  notes: string | null;
}

export interface LeasingSummary {
  totalLeasings: number;
  activeLeasings: number;
  totalPurchaseValue: number;
  totalCurrentBalance: number;
  totalMonthlyPayments: number;
  totalPaidPayments: number;
  totalRemainingPayments: number;
}

export interface LeasingFormData {
  machineId: string;
  purchaseValue: number;
  currentBalance: number;
  monthlyPayment: number;
  entity: string;
  startDate: string;
  endDate: string;
  totalPayments?: number; // Optional - will be calculated from dates if not provided
  interestRate?: number;
  notes?: string;
}

export interface LeasingPaymentFormData {
  leasingId: string;
  paymentDate: string;
  amount: number;
  paymentsCount: number;
  notes?: string;
}

export interface LeasingPaymentItem {
  id: string;
  leasingId: string;
  paymentDate: string | null;
  amount: number;
  paymentsCount: number;
  totalPaidAfter: number;
  notes: string | null;
  createdAt: string;
}

export class FinanceService {
  constructor(
    private contractRepository: IContractRepository,
    private machineRepository: IMachineRepository,
    private workOrderRepository: IWorkOrderRepository
  ) {}

  async calculateMachineProfitability(machineId: string): Promise<MachineProfitabilityResult> {
    const machine = await this.machineRepository.findById(machineId);
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
      machineCode: machine?.code || 'UNKNOWN',
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

  async getDashboardMetrics(): Promise<FinanceDashboardResult> {
    const [machines, contracts, workOrders] = await Promise.all([
      this.machineRepository.findAll(),
      this.contractRepository.findAll(),
      this.workOrderRepository.findAll(),
    ]);

    // Calcular ingresos totales de contratos
    let totalIncome = 0;
    let totalMaintenanceCost = 0;

    for (const contract of contracts) {
      if (contract.status === 'ACTIVE') {
        totalIncome += contract.value;
      }
      const assignments = contract.getAssignments();
      for (const assignment of assignments) {
        totalMaintenanceCost += assignment.maintenanceCost;
        totalIncome += assignment.generatedIncome;
      }
    }

    // Calcular costos de taller
    const totalSparePartsCost = workOrders.reduce((sum, wo) => sum + wo.sparePartsCost, 0);
    const totalLaborCost = workOrders.reduce((sum, wo) => sum + wo.laborCost, 0);
    const totalDowntimeHours = workOrders.reduce((sum, wo) => sum + (wo.downtimeHours || 0), 0);

    const grossMargin = totalIncome - (totalMaintenanceCost + totalSparePartsCost + totalLaborCost);
    const marginPercentage = totalIncome > 0 ? (grossMargin / totalIncome) * 100 : 0;

    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
    const machinesInWorkshop = machines.filter(m => m.status === MachineStatus.IN_WORKSHOP).length;
    const availableMachines = machines.filter(m => m.status !== MachineStatus.IN_WORKSHOP && m.status !== MachineStatus.INACTIVE).length;
    const availabilityPercentage = machines.length > 0 ? (availableMachines / machines.length) * 100 : 0;
    const averageProfitPerMachine = machines.length > 0 ? grossMargin / machines.length : 0;

    return {
      totalIncome,
      totalMaintenanceCost,
      totalSparePartsCost,
      totalLaborCost,
      grossMargin,
      marginPercentage,
      totalDowntimeHours,
      availabilityPercentage,
      activeContracts,
      machinesInWorkshop,
      averageProfitPerMachine,
    };
  }

  async getMachinesProfitability(): Promise<MachineProfitabilityResult[]> {
    const [machines, contracts, workOrders] = await Promise.all([
      this.machineRepository.findAll(),
      this.contractRepository.findAll(),
      this.workOrderRepository.findAll(),
    ]);

    const results: MachineProfitabilityResult[] = [];

    for (const machine of machines) {
      let totalIncome = 0;
      let totalMaintenanceCost = 0;

      // Ingresos de contratos
      for (const contract of contracts) {
        const assignments = contract.getAssignments();
        for (const assignment of assignments) {
          if (assignment.machineId === machine.id) {
            totalIncome += assignment.generatedIncome;
            totalMaintenanceCost += assignment.maintenanceCost;
          }
        }
      }

      // Costos de mantenimiento
      const machineWorkOrders = workOrders.filter(wo => wo.machineId === machine.id);
      for (const wo of machineWorkOrders) {
        totalMaintenanceCost += wo.totalCost;
      }

      const margin = totalIncome - totalMaintenanceCost;
      const roi = totalIncome > 0 ? (margin / totalIncome) * 100 : 0;

      results.push({
        machineId: machine.id,
        machineCode: machine.code,
        totalIncome,
        totalMaintenanceCost,
        margin,
        roi,
      });
    }

    return results.sort((a, b) => b.margin - a.margin);
  }

  async getMachineUptime(): Promise<MachineUptimeResult[]> {
    const [machines, workOrders] = await Promise.all([
      this.machineRepository.findAll(),
      this.workOrderRepository.findAll(),
    ]);

    const results: MachineUptimeResult[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    for (const machine of machines) {
      const machineWorkOrders = workOrders.filter(wo => wo.machineId === machine.id);
      const workshopHours = machineWorkOrders.reduce((sum, wo) => sum + (wo.downtimeHours || 0), 0);
      const maintenanceCount = machineWorkOrders.filter(wo => wo.status === 'COMPLETED').length;

      // Calcular horas totales (estimado basado en tiempo desde adquisición o 1 año)
      const acquisitionDate = machine.acquisitionDate || oneYearAgo;
      const daysSinceAcquisition = Math.max(1, Math.ceil((now.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24)));
      const totalHours = (daysSinceAcquisition / 24) * 24; // Estimación
      const operatingHours = Math.max(0, totalHours - workshopHours);
      const uptimePercentage = totalHours > 0 ? (operatingHours / totalHours) * 100 : 0;

      results.push({
        machineId: machine.id,
        machineCode: machine.code,
        totalHours,
        workshopHours,
        operatingHours,
        uptimePercentage,
        maintenanceCount,
      });
    }

    return results.sort((a, b) => b.uptimePercentage - a.uptimePercentage);
  }

  async getWorkshopImpact(): Promise<WorkshopImpactResult[]> {
    const [machines, workOrders] = await Promise.all([
      this.machineRepository.findAll(),
      this.workOrderRepository.findAll(),
    ]);

    // Obtener tarifas por hora promedio de contratos
    const contracts = await this.contractRepository.findAll();
    let avgHourlyRate = 50000; // Valor por defecto
    let totalRates = 0;
    let rateCount = 0;

    for (const contract of contracts) {
      const assignments = contract.getAssignments();
      for (const assignment of assignments) {
        if (assignment.hourlyRate && assignment.hourlyRate > 0) {
          totalRates += assignment.hourlyRate;
          rateCount++;
        }
      }
    }
    if (rateCount > 0) {
      avgHourlyRate = totalRates / rateCount;
    }

    const results: WorkshopImpactResult[] = [];

    for (const machine of machines) {
      const machineWorkOrders = workOrders.filter(wo => wo.machineId === machine.id);
      const sparePartsCost = machineWorkOrders.reduce((sum, wo) => sum + wo.sparePartsCost, 0);
      const laborCost = machineWorkOrders.reduce((sum, wo) => sum + wo.laborCost, 0);
      const totalCost = machineWorkOrders.reduce((sum, wo) => sum + wo.totalCost, 0);
      const downtimeHours = machineWorkOrders.reduce((sum, wo) => sum + (wo.downtimeHours || 0), 0);
      const maintenanceCount = machineWorkOrders.length;

      // Ingresos perdidos = horas de inactividad * tarifa promedio
      const lostIncome = downtimeHours * avgHourlyRate;

      // Obtener última orden de trabajo
      const lastWorkOrder = machineWorkOrders.sort((a, b) => 
        new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
      )[0];

      results.push({
        machineId: machine.id,
        machineCode: machine.code,
        sparePartsCost,
        laborCost,
        totalCost,
        downtimeHours,
        maintenanceCount,
        lostIncome,
        lastMaintenanceDate: lastWorkOrder?.entryDate ? lastWorkOrder.entryDate.toISOString() : null,
      });
    }

    return results.sort((a, b) => b.totalCost - a.totalCost);
  }

  async getAllLeasings(): Promise<LeasingItem[]> {
    const leasings = await prisma.leasing.findMany({
      include: { machine: true },
      orderBy: { createdAt: 'desc' },
    });

    return leasings.map((l) => ({
      id: l.id,
      machineId: l.machineId,
      machineCode: l.machine.code,
      machineBrand: l.machine.brand,
      machineModel: l.machine.model,
      purchaseValue: l.purchaseValue,
      currentBalance: l.currentBalance,
      monthlyPayment: l.monthlyPayment,
      entity: l.entity,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
      totalPayments: l.totalPayments,
      paidPayments: l.paidPayments,
      remainingPayments: l.remainingPayments,
      interestRate: l.interestRate,
      status: l.status,
      notes: l.notes,
    }));
  }

  async getLeasingByMachine(machineId: string): Promise<LeasingItem | null> {
    const l = await prisma.leasing.findUnique({
      where: { machineId },
      include: { machine: true },
    });

    if (!l) return null;

    return {
      id: l.id,
      machineId: l.machineId,
      machineCode: l.machine.code,
      machineBrand: l.machine.brand,
      machineModel: l.machine.model,
      purchaseValue: l.purchaseValue,
      currentBalance: l.currentBalance,
      monthlyPayment: l.monthlyPayment,
      entity: l.entity,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
      totalPayments: l.totalPayments,
      paidPayments: l.paidPayments,
      remainingPayments: l.remainingPayments,
      interestRate: l.interestRate,
      status: l.status,
      notes: l.notes,
    };
  }

  async createLeasing(data: LeasingFormData): Promise<LeasingItem> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    // Calculate total payments from dates (months between start and end)
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    const totalPayments = monthsDiff > 0 ? monthsDiff : data.totalPayments || 12;
    const remainingPayments = totalPayments;

    const leasing = await prisma.leasing.create({
      data: {
        machineId: data.machineId,
        purchaseValue: data.purchaseValue,
        currentBalance: data.currentBalance,
        monthlyPayment: data.monthlyPayment,
        entity: data.entity,
        startDate,
        endDate,
        totalPayments,
        paidPayments: 0,
        remainingPayments,
        interestRate: data.interestRate,
        status: 'ACTIVE',
        notes: data.notes,
      },
      include: { machine: true },
    });

    return {
      id: leasing.id,
      machineId: leasing.machineId,
      machineCode: leasing.machine.code,
      machineBrand: leasing.machine.brand,
      machineModel: leasing.machine.model,
      purchaseValue: leasing.purchaseValue,
      currentBalance: leasing.currentBalance,
      monthlyPayment: leasing.monthlyPayment,
      entity: leasing.entity,
      startDate: leasing.startDate.toISOString(),
      endDate: leasing.endDate.toISOString(),
      totalPayments: leasing.totalPayments,
      paidPayments: leasing.paidPayments,
      remainingPayments: leasing.remainingPayments,
      interestRate: leasing.interestRate,
      status: leasing.status,
      notes: leasing.notes,
    };
  }

  async updateLeasing(id: string, data: Partial<LeasingFormData>): Promise<LeasingItem> {
    const updateData: any = { ...data };
    
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }
    
    // Recalculate totalPayments if dates changed
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
      if (monthsDiff > 0) {
        updateData.totalPayments = monthsDiff;
      }
    }
    
    // Handle paidPayments separately since it's not in LeasingFormData
    const paidPayments = (data as any).paidPayments;
    if (paidPayments !== undefined) {
      const leasing = await prisma.leasing.findUnique({ where: { id } });
      if (leasing) {
        updateData.paidPayments = paidPayments;
        updateData.remainingPayments = leasing.totalPayments - paidPayments;
        if (updateData.remainingPayments <= 0) {
          updateData.status = 'PAID';
        }
      }
    }

    const leasing = await prisma.leasing.update({
      where: { id },
      data: updateData,
      include: { machine: true },
    });

    return {
      id: leasing.id,
      machineId: leasing.machineId,
      machineCode: leasing.machine.code,
      machineBrand: leasing.machine.brand,
      machineModel: leasing.machine.model,
      purchaseValue: leasing.purchaseValue,
      currentBalance: leasing.currentBalance,
      monthlyPayment: leasing.monthlyPayment,
      entity: leasing.entity,
      startDate: leasing.startDate.toISOString(),
      endDate: leasing.endDate.toISOString(),
      totalPayments: leasing.totalPayments,
      paidPayments: leasing.paidPayments,
      remainingPayments: leasing.remainingPayments,
      interestRate: leasing.interestRate,
      status: leasing.status,
      notes: leasing.notes,
    };
  }

  async deleteLeasing(id: string): Promise<void> {
    await prisma.leasing.delete({ where: { id } });
  }

  async getLeasingSummary(): Promise<LeasingSummary> {
    const leasings = await prisma.leasing.findMany();

    const activeLeasings = leasings.filter(l => l.status === 'ACTIVE');

    return {
      totalLeasings: leasings.length,
      activeLeasings: activeLeasings.length,
      totalPurchaseValue: leasings.reduce((sum, l) => sum + l.purchaseValue, 0),
      totalCurrentBalance: activeLeasings.reduce((sum, l) => sum + l.currentBalance, 0),
      totalMonthlyPayments: activeLeasings.reduce((sum, l) => sum + l.monthlyPayment, 0),
      totalPaidPayments: leasings.reduce((sum, l) => sum + l.paidPayments, 0),
      totalRemainingPayments: activeLeasings.reduce((sum, l) => sum + l.remainingPayments, 0),
    };
  }

  async getMachinesWithoutLeasing(): Promise<Array<{ id: string; code: string; brand: string; model: string; acquisitionValue: number | null }>> {
    const machinesWithLeasing = await prisma.leasing.findMany({
      where: { status: { in: ['ACTIVE', 'PAID'] } },
      select: { machineId: true },
    });
    
    const leasedMachineIds = machinesWithLeasing.map(l => l.machineId);

    const machines = await prisma.machine.findMany({
      where: {
        id: { notIn: leasedMachineIds },
        status: { notIn: [MachineStatus.INACTIVE] },
      },
      select: {
        id: true,
        code: true,
        brand: true,
        model: true,
        acquisitionValue: true,
      },
      orderBy: { code: 'asc' },
    });

    return machines;
  }

  // Payment methods
  async getPaymentsByLeasing(leasingId: string): Promise<LeasingPaymentItem[]> {
    const payments = await prisma.leasingPayment.findMany({
      where: { leasingId },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map(p => ({
      id: p.id,
      leasingId: p.leasingId,
      paymentDate: p.paymentDate?.toISOString() || null,
      amount: p.amount,
      paymentsCount: p.paymentsCount,
      totalPaidAfter: p.totalPaidAfter,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async createPayment(data: LeasingPaymentFormData): Promise<LeasingPaymentItem> {
    const leasing = await prisma.leasing.findUnique({
      where: { id: data.leasingId },
    });

    if (!leasing) {
      throw new Error('Leasing not found');
    }

    const totalPaidAfter = leasing.paidPayments + data.paymentsCount;
    
    // Calculate new balance: decrease proportionally to payments made
    const paymentRatio = totalPaidAfter / leasing.totalPayments;
    const newCurrentBalance = leasing.purchaseValue * (1 - paymentRatio);

    const payment = await prisma.leasingPayment.create({
      data: {
        leasingId: data.leasingId,
        paymentDate: new Date(data.paymentDate),
        amount: data.amount,
        paymentsCount: data.paymentsCount,
        totalPaidAfter,
        notes: data.notes,
      },
    });

    // Update leasing with new paid payments and current balance
    await prisma.leasing.update({
      where: { id: data.leasingId },
      data: {
        paidPayments: totalPaidAfter,
        remainingPayments: leasing.totalPayments - totalPaidAfter,
        currentBalance: Math.max(0, newCurrentBalance),
        status: totalPaidAfter >= leasing.totalPayments ? 'PAID' : 'ACTIVE',
      },
    });

    return {
      id: payment.id,
      leasingId: payment.leasingId,
      paymentDate: payment.paymentDate?.toISOString() || null,
      amount: payment.amount,
      paymentsCount: payment.paymentsCount,
      totalPaidAfter: payment.totalPaidAfter,
      notes: payment.notes,
      createdAt: payment.createdAt.toISOString(),
    };
  }

  async deletePayment(id: string): Promise<void> {
    const payment = await prisma.leasingPayment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const leasing = await prisma.leasing.findUnique({
      where: { id: payment.leasingId },
    });

    if (leasing) {
      const newPaidPayments = payment.totalPaidAfter - payment.paymentsCount;
      // Recalculate balance proportionally
      const paymentRatio = Math.max(0, newPaidPayments) / leasing.totalPayments;
      const newCurrentBalance = leasing.purchaseValue * (1 - paymentRatio);
      
      await prisma.leasing.update({
        where: { id: payment.leasingId },
        data: {
          paidPayments: Math.max(0, newPaidPayments),
          remainingPayments: leasing.totalPayments - Math.max(0, newPaidPayments),
          currentBalance: Math.max(0, newCurrentBalance),
          status: newPaidPayments >= leasing.totalPayments ? 'PAID' : 'ACTIVE',
        },
      });
    }

    await prisma.leasingPayment.delete({
      where: { id },
    });
  }
}
