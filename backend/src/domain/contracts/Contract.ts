import { ContractProps } from './ContractProps';
import { ContractStatus } from './ContractStatus';
import { MachineAssignment } from './MachineAssignment';

function generateId(): string {
  return crypto.randomUUID();
}

export class Contract {
  private props: ContractProps;
  private assignments: MachineAssignment[] = [];

  private constructor(props: ContractProps) {
    this.props = props;
  }

  public static create(props: Omit<ContractProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Contract {
    return new Contract({
      ...props,
      id: props.id || generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromDatabase(props: ContractProps): Contract {
    return new Contract(props);
  }

  public activate(): void {
    if (this.props.status !== ContractStatus.DRAFT) {
      throw new Error('Can only activate a DRAFT contract');
    }
    this.props.status = ContractStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  public complete(): void {
    if (this.props.status !== ContractStatus.ACTIVE) {
      throw new Error('Can only complete an ACTIVE contract');
    }
    this.props.status = ContractStatus.COMPLETED;
    this.props.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.props.status === ContractStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed contract');
    }
    this.props.status = ContractStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  public addMachineAssignment(assignment: MachineAssignment): void {
    if (this.props.status !== ContractStatus.ACTIVE) {
      throw new Error('Can only add machine assignments to an ACTIVE contract');
    }
    this.assignments.push(assignment);
    this.props.updatedAt = new Date();
  }

  public addMachineAssignmentFromDb(assignment: MachineAssignment): void {
    this.assignments.push(assignment);
  }

  public update(data: {
    code: string;
    customer: string;
    startDate: Date;
    endDate: Date;
    value: number;
    monthlyValue?: number;
    plazo?: number;
    status: ContractStatus;
    description: string;
  }): void {
    this.props.code = data.code;
    this.props.customer = data.customer;
    this.props.startDate = data.startDate;
    this.props.endDate = data.endDate;
    this.props.value = data.value;
    this.props.monthlyValue = data.monthlyValue;
    this.props.plazo = data.plazo;
    this.props.status = data.status;
    this.props.description = data.description;
    this.props.updatedAt = new Date();
  }

  public getAssignments(): MachineAssignment[] {
    return [...this.assignments];
  }

  public calculateTotalMargin(): number {
    return this.assignments.reduce((total, assignment) => total + assignment.getMargin(), 0);
  }

  public get id(): string | undefined {
    return this.props.id;
  }

  public get code(): string {
    return this.props.code;
  }

  public get customer(): string {
    return this.props.customer;
  }

  public get startDate(): Date {
    return this.props.startDate;
  }

  public get endDate(): Date {
    return this.props.endDate;
  }

  public get value(): number {
    return this.props.value;
  }

  public get monthlyValue(): number | undefined {
    return this.props.monthlyValue;
  }

  public get plazo(): number | undefined {
    return this.props.plazo;
  }

  public get status(): ContractStatus {
    return this.props.status;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  public get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
}
