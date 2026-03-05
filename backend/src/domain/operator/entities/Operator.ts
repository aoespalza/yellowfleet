export interface OperatorProps {
  id?: string;
  name: string;
  licenseNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  hireDate?: Date | null;
  isActive?: boolean;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Operator {
  readonly id: string;
  readonly name: string;
  readonly licenseNumber?: string | null;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly hireDate?: Date | null;
  private _isActive: boolean;
  readonly notes?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: OperatorProps) {
    this.id = props.id || '';
    this.name = props.name;
    this.licenseNumber = props.licenseNumber ?? undefined;
    this.phone = props.phone ?? undefined;
    this.email = props.email ?? undefined;
    this.hireDate = props.hireDate ?? undefined;
    this._isActive = props.isActive ?? true;
    this.notes = props.notes ?? undefined;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  get isActive(): boolean {
    return this._isActive;
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }

  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      licenseNumber: this.licenseNumber,
      phone: this.phone,
      email: this.email,
      hireDate: this.hireDate,
      isActive: this._isActive,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
