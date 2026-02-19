import { MachineStatus } from './MachineStatus';

export interface MachineProps {
  id: string;
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
  currentLocation: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Machine {
  private props: MachineProps;

  private constructor(props: MachineProps) {
    this.props = props;
  }

  // 🔥 CREATE (para nuevas máquinas)
  static create(
    props: Omit<MachineProps, 'id' | 'createdAt' | 'updatedAt' | 'acquisitionDate'> & { 
      id?: string;
      acquisitionDate?: Date;
    }
  ): Machine {
    return new Machine({
      ...props,
      id: props.id || crypto.randomUUID(),
      acquisitionDate: props.acquisitionDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 🔥 RESTORE (para cuando viene de DB)
  static restore(props: MachineProps): Machine {
    return new Machine(props);
  }

  // 🔥 MÉTODO QUE TE FALTA
  updateDetails(
    updates: Omit<MachineProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): void {
    this.props = {
      ...this.props,
      ...updates,
      updatedAt: new Date(),
    };
  }

  // ===== GETTERS =====

  get id() {
    return this.props.id;
  }

  get code() {
    return this.props.code;
  }

  get type() {
    return this.props.type;
  }

  get brand() {
    return this.props.brand;
  }

  get model() {
    return this.props.model;
  }

  get year() {
    return this.props.year;
  }

  get serialNumber() {
    return this.props.serialNumber;
  }

  get hourMeter() {
    return this.props.hourMeter;
  }

  get acquisitionDate() {
    return this.props.acquisitionDate;
  }

  get acquisitionValue() {
    return this.props.acquisitionValue;
  }

  get usefulLifeHours() {
    return this.props.usefulLifeHours;
  }

  get status() {
    return this.props.status;
  }

  get currentLocation() {
    return this.props.currentLocation;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }
}
