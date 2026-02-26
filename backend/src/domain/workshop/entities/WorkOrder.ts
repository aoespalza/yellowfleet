export enum WorkOrderType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  PREDICTIVE = 'PREDICTIVE',
}

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface WorkOrderProps {
  id?: string;
  machineId: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  entryDate: Date;
  exitDate?: Date;
  sparePartsCost: number;
  laborCost: number;
  totalCost: number;
  downtimeHours: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkOrder {
  readonly id: string;
  readonly machineId: string;
  private _type: WorkOrderType;
  private _status: WorkOrderStatus;
  readonly entryDate: Date;
  private _exitDate?: Date;
  private _sparePartsCost: number;
  private _laborCost: number;
  private _totalCost: number;
  private _downtimeHours: number;
  private _description?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: WorkOrderProps) {
    this.id = props.id || '';
    this.machineId = props.machineId;
    this._type = props.type;
    this._status = props.status;
    this.entryDate = props.entryDate;
    this._exitDate = props.exitDate;
    this._sparePartsCost = props.sparePartsCost;
    this._laborCost = props.laborCost;
    this._totalCost = props.totalCost;
    this._downtimeHours = props.downtimeHours;
    this._description = props.description;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  get type(): WorkOrderType {
    return this._type;
  }

  get status(): WorkOrderStatus {
    return this._status;
  }

  get exitDate(): Date | undefined {
    return this._exitDate;
  }

  get sparePartsCost(): number {
    return this._sparePartsCost;
  }

  get laborCost(): number {
    return this._laborCost;
  }

  get totalCost(): number {
    return this._totalCost;
  }

  get downtimeHours(): number {
    return this._downtimeHours;
  }

  get description(): string | undefined {
    return this._description;
  }

  startWork(): void {
    if (this._status !== WorkOrderStatus.PENDING) {
      throw new Error('Can only start pending work orders');
    }
    this._status = WorkOrderStatus.IN_PROGRESS;
  }

  closeWork(exitDate: Date, sparePartsCost: number, laborCost: number): void {
    if (this._status === WorkOrderStatus.COMPLETED) {
      throw new Error('Work order already completed');
    }
    
    this._exitDate = exitDate;
    this._sparePartsCost = sparePartsCost;
    this._laborCost = laborCost;
    this._totalCost = sparePartsCost + laborCost;
    
    const exitTime = exitDate.getTime();
    const entryTime = this.entryDate.getTime();
    
    // Validar que la fecha de salida no sea anterior a la de ingreso
    if (exitTime < entryTime) {
      throw new Error('La fecha de salida no puede ser anterior a la fecha de ingreso');
    }
    
    // Calcular días de inactividad (horas / 24)
    const totalHours = (exitTime - entryTime) / (1000 * 60 * 60);
    this._downtimeHours = Math.floor(totalHours);
    
    this._status = WorkOrderStatus.COMPLETED;
  }

  cancel(): void {
    if (this._status === WorkOrderStatus.COMPLETED) {
      throw new Error('Cannot cancel completed work order');
    }
    this._status = WorkOrderStatus.CANCELLED;
  }

  toPlainObject() {
    return {
      id: this.id,
      machineId: this.machineId,
      type: this._type,
      status: this._status,
      entryDate: this.entryDate,
      exitDate: this._exitDate,
      sparePartsCost: this._sparePartsCost,
      laborCost: this._laborCost,
      totalCost: this._totalCost,
      downtimeHours: this._downtimeHours,
      description: this._description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
