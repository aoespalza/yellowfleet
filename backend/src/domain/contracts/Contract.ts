import { ContractProps } from './ContractProps';
import { ContractStatus } from './ContractStatus';
import { MachineAssignment } from './MachineAssignment';

export class Contract {
  private props: ContractProps;
  private assignments: MachineAssignment[] = [];

  private constructor(props: ContractProps) {
    this.props = props;
  }

  public static create(props: ContractProps): Contract {
    return new Contract({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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
