export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ContractProps {
  id?: string;
  code: string;
  customer: string;
  startDate: Date;
  endDate: Date;
  value: number;
  status: ContractStatus;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Contract {
  readonly id: string;
  readonly code: string;
  readonly customer: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly value: number;
  private _status: ContractStatus;
  private _description?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ContractProps) {
    this.id = props.id || '';
    this.code = props.code;
    this.customer = props.customer;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.value = props.value;
    this._status = props.status;
    this._description = props.description;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  get status(): ContractStatus {
    return this._status;
  }

  get description(): string | undefined {
    return this._description;
  }

  activate(): void {
    if (this._status !== ContractStatus.DRAFT) {
      throw new Error('Can only activate draft contracts');
    }
    if (this.endDate < new Date()) {
      throw new Error('Cannot activate expired contract');
    }
    this._status = ContractStatus.ACTIVE;
  }

  complete(): void {
    if (this._status !== ContractStatus.ACTIVE) {
      throw new Error('Can only complete active contracts');
    }
    this._status = ContractStatus.COMPLETED;
  }

  cancel(): void {
    if (this._status === ContractStatus.COMPLETED) {
      throw new Error('Cannot cancel completed contract');
    }
    this._status = ContractStatus.CANCELLED;
  }

  toPlainObject() {
    return {
      id: this.id,
      code: this.code,
      customer: this.customer,
      startDate: this.startDate,
      endDate: this.endDate,
      value: this.value,
      status: this._status,
      description: this._description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
