import { WorkOrderProps } from './WorkOrderProps';
import { WorkOrderType } from './WorkOrderType';
import { WorkOrderStatus } from './WorkOrderStatus';

export class WorkOrder {
  private props: WorkOrderProps;

  private constructor(props: WorkOrderProps) {
    this.props = props;
  }

  public static create(props: WorkOrderProps): WorkOrder {
    return new WorkOrder({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static restore(props: WorkOrderProps): WorkOrder {
    return new WorkOrder(props);
  }

  public calculateTotalCost(): number {
    return this.props.sparePartsCost + this.props.laborCost;
  }

  public startProgress(): void {
    if (this.props.status !== WorkOrderStatus.OPEN) {
      throw new Error('Can only start progress from OPEN status');
    }
    this.props.status = WorkOrderStatus.IN_PROGRESS;
    this.props.updatedAt = new Date();
  }

  public waitForParts(): void {
    if (this.props.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new Error('Can only wait for parts from IN_PROGRESS status');
    }
    this.props.status = WorkOrderStatus.WAITING_PARTS;
    this.props.updatedAt = new Date();
  }

  public completeWorkOrder(exitDate: Date): void {
    if (
      this.props.status !== WorkOrderStatus.OPEN &&
      this.props.status !== WorkOrderStatus.IN_PROGRESS &&
      this.props.status !== WorkOrderStatus.WAITING_PARTS
    ) {
      throw new Error('Can only complete work order from OPEN, IN_PROGRESS or WAITING_PARTS status');
    }
    this.props.status = WorkOrderStatus.COMPLETED;
    this.props.exitDate = exitDate;
    this.props.totalCost = this.calculateTotalCost();
    const entryTime = this.props.entryDate.getTime();
    const exitTime = exitDate.getTime();
    this.props.downtimeHours = (exitTime - entryTime) / (1000 * 60 * 60);
    this.props.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.props.status === WorkOrderStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed work order');
    }
    this.props.status = WorkOrderStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  public get id(): string | undefined {
    return this.props.id;
  }

  public get machineId(): string {
    return this.props.machineId;
  }

  public get type(): WorkOrderType {
    return this.props.type;
  }

  public get status(): WorkOrderStatus {
    return this.props.status;
  }

  public get entryDate(): Date {
    return this.props.entryDate;
  }

  public get exitDate(): Date | undefined {
    return this.props.exitDate;
  }

  public get sparePartsCost(): number {
    return this.props.sparePartsCost;
  }

  public get laborCost(): number {
    return this.props.laborCost;
  }

  public get totalCost(): number {
    return this.props.totalCost;
  }

  public get downtimeHours(): number | undefined {
    return this.props.downtimeHours;
  }

  public get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  public get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
}
