export enum MachineStatus {
  AVAILABLE = 'AVAILABLE',
  IN_CONTRACT = 'IN_CONTRACT',
  IN_WORKSHOP = 'IN_WORKSHOP',
  IN_TRANSFER = 'IN_TRANSFER',
  INACTIVE = 'INACTIVE',
}

export interface MachineProps {
  id?: string;
  code: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  serialNumber: string;
  hourMeter: number;
  acquisitionDate: Date;
  acquisitionValue: number;
  usefulLifeHours: number;
  status: MachineStatus;
  currentLocation?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Machine {
  readonly id: string;
  readonly code: string;
  readonly type: string;
  readonly brand: string;
  readonly model: string;
  readonly year: number;
  readonly serialNumber: string;
  private _hourMeter: number;
  readonly acquisitionDate: Date;
  readonly acquisitionValue: number;
  readonly usefulLifeHours: number;
  private _status: MachineStatus;
  private _currentLocation?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: MachineProps) {
    this.id = props.id || '';
    this.code = props.code;
    this.type = props.type;
    this.brand = props.brand;
    this.model = props.model;
    this.year = props.year;
    this.serialNumber = props.serialNumber;
    this._hourMeter = props.hourMeter;
    this.acquisitionDate = props.acquisitionDate;
    this.acquisitionValue = props.acquisitionValue;
    this.usefulLifeHours = props.usefulLifeHours;
    this._status = props.status;
    this._currentLocation = props.currentLocation;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  get hourMeter(): number {
    return this._hourMeter;
  }

  get status(): MachineStatus {
    return this._status;
  }

  get currentLocation(): string | undefined {
    return this._currentLocation;
  }

  updateHourMeter(hours: number): void {
    if (hours < this._hourMeter) {
      throw new Error('New hour meter must be greater than current');
    }
    this._hourMeter = hours;
  }

  changeStatus(newStatus: MachineStatus): void {
    const currentStatus = this._status;
    
    if (currentStatus === MachineStatus.IN_WORKSHOP && newStatus !== MachineStatus.IN_WORKSHOP) {
      throw new Error('Cannot change status: machine is in workshop');
    }

    if (currentStatus === MachineStatus.IN_CONTRACT && newStatus === MachineStatus.IN_WORKSHOP) {
      throw new Error('Cannot send to workshop: machine is in active contract');
    }

    this._status = newStatus;
  }

  assignToContract(): void {
    if (this._status === MachineStatus.IN_WORKSHOP) {
      throw new Error('Cannot assign to contract: machine is in workshop');
    }
    this._status = MachineStatus.IN_CONTRACT;
  }

  releaseFromContract(): void {
    if (this._status === MachineStatus.IN_CONTRACT) {
      this._status = MachineStatus.AVAILABLE;
    }
  }

  sendToWorkshop(): void {
    if (this._status === MachineStatus.IN_CONTRACT) {
      throw new Error('Cannot send to workshop: machine is in active contract');
    }
    this._status = MachineStatus.IN_WORKSHOP;
  }

  toPlainObject() {
    return {
      id: this.id,
      code: this.code,
      type: this.type,
      brand: this.brand,
      model: this.model,
      year: this.year,
      serialNumber: this.serialNumber,
      hourMeter: this._hourMeter,
      acquisitionDate: this.acquisitionDate,
      acquisitionValue: this.acquisitionValue,
      usefulLifeHours: this.usefulLifeHours,
      status: this._status,
      currentLocation: this._currentLocation,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
