import { MachineProps } from './MachineProps';
import { MachineStatus } from './MachineStatus';

export class Machine {
  private props: MachineProps;

  private constructor(props: MachineProps) {
    this.props = props;
  }

  public static create(props: MachineProps): Machine {
    return new Machine({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public updateHourMeter(hours: number): void {
    if (hours < this.props.hourMeter) {
      throw new Error('Hour meter cannot be less than current value');
    }
    this.props.hourMeter = hours;
    this.props.updatedAt = new Date();
  }

  public assignToContract(): void {
    if (this.props.status === MachineStatus.IN_WORKSHOP) {
      throw new Error('Cannot assign machine to contract while in workshop');
    }
    this.props.status = MachineStatus.IN_CONTRACT;
    this.props.updatedAt = new Date();
  }

  public sendToWorkshop(): void {
    if (this.props.status === MachineStatus.IN_CONTRACT) {
      throw new Error('Cannot send machine to workshop while in contract');
    }
    this.props.status = MachineStatus.IN_WORKSHOP;
    this.props.updatedAt = new Date();
  }

  public markAvailable(): void {
    this.props.status = MachineStatus.AVAILABLE;
    this.props.updatedAt = new Date();
  }

  public changeLocation(location: string): void {
    if (this.props.status === MachineStatus.INACTIVE) {
      throw new Error('Cannot change location of inactive machine');
    }
    this.props.currentLocation = location;
    this.props.updatedAt = new Date();
  }

  public get id(): string | undefined {
    return this.props.id;
  }

  public get code(): string {
    return this.props.code;
  }

  public get type(): string {
    return this.props.type;
  }

  public get brand(): string {
    return this.props.brand;
  }

  public get model(): string {
    return this.props.model;
  }

  public get year(): number {
    return this.props.year;
  }

  public get serialNumber(): string {
    return this.props.serialNumber;
  }

  public get hourMeter(): number {
    return this.props.hourMeter;
  }

  public get acquisitionDate(): Date {
    return this.props.acquisitionDate;
  }

  public get acquisitionValue(): number {
    return this.props.acquisitionValue;
  }

  public get usefulLifeHours(): number {
    return this.props.usefulLifeHours;
  }

  public get status(): MachineStatus {
    return this.props.status;
  }

  public get currentLocation(): string {
    return this.props.currentLocation;
  }

  public get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  public get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
}
