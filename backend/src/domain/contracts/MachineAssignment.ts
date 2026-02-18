import { MachineAssignmentProps } from './MachineAssignmentProps';

export class MachineAssignment {
  private props: MachineAssignmentProps;

  private constructor(props: MachineAssignmentProps) {
    this.props = props;
  }

  public static create(props: MachineAssignmentProps): MachineAssignment {
    if (props.hourlyRate < 0) {
      throw new Error('Hourly rate cannot be negative');
    }
    if (props.workedHours < 0) {
      throw new Error('Worked hours cannot be negative');
    }
    if (props.maintenanceCost < 0) {
      throw new Error('Maintenance cost cannot be negative');
    }
    return new MachineAssignment({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public updateWorkedHours(hours: number): void {
    if (hours < 0) {
      throw new Error('Worked hours cannot be negative');
    }
    this.props.workedHours = hours;
    this.props.generatedIncome = this.calculateIncome();
    this.props.margin = this.calculateMargin();
    this.props.updatedAt = new Date();
  }

  public addMaintenanceCost(cost: number): void {
    if (cost < 0) {
      throw new Error('Maintenance cost cannot be negative');
    }
    this.props.maintenanceCost += cost;
    this.props.margin = this.calculateMargin();
    this.props.updatedAt = new Date();
  }

  public calculateIncome(): number {
    return this.props.workedHours * this.props.hourlyRate;
  }

  public calculateMargin(): number {
    return this.calculateIncome() - this.props.maintenanceCost;
  }

  public get id(): string | undefined {
    return this.props.id;
  }

  public get contractId(): string {
    return this.props.contractId;
  }

  public get machineId(): string {
    return this.props.machineId;
  }

  public get hourlyRate(): number {
    return this.props.hourlyRate;
  }

  public get workedHours(): number {
    return this.props.workedHours;
  }

  public get maintenanceCost(): number {
    return this.props.maintenanceCost;
  }

  public get generatedIncome(): number {
    return this.props.generatedIncome;
  }

  public get margin(): number {
    return this.props.margin;
  }

  public get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  public get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
}
