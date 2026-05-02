export interface OperatorProps {
  id?: string;
  name: string;
  licenseNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  hireDate?: Date | null;
  isActive?: boolean;
  notes?: string | null;
  photoUrl?: string | null;
  empresa?: string | null;
  arl?: string | null;
  eps?: string | null;
  grupoSanguineo?: string | null;
  jobId?: string | null;
  job?: { id: string; name: string; hourlyRate?: number | null } | null;
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
  readonly photoUrl?: string | null;
  readonly empresa?: string | null;
  readonly arl?: string | null;
  readonly eps?: string | null;
  readonly grupoSanguineo?: string | null;
  readonly jobId?: string | null;
  readonly job?: { id: string; name: string; hourlyRate?: number } | null;
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
    this.photoUrl = props.photoUrl ?? undefined;
    this.empresa = props.empresa ?? undefined;
    this.arl = props.arl ?? undefined;
    this.eps = props.eps ?? undefined;
    this.grupoSanguineo = props.grupoSanguineo ?? undefined;
    this.jobId = props.jobId ?? undefined;
    this.job = props.job ? { 
      id: props.job.id, 
      name: props.job.name, 
      hourlyRate: props.job.hourlyRate ?? undefined 
    } : undefined;
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
      photoUrl: this.photoUrl,
      empresa: this.empresa,
      arl: this.arl,
      eps: this.eps,
      grupoSanguineo: this.grupoSanguineo,
      jobId: this.jobId,
      job: this.job,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toPrisma() {
    return {
      name: this.name,
      licenseNumber: this.licenseNumber ?? null,
      phone: this.phone ?? null,
      email: this.email ?? null,
      hireDate: this.hireDate ?? null,
      isActive: this._isActive,
      notes: this.notes ?? null,
      photoUrl: this.photoUrl ?? null,
      empresa: this.empresa ?? null,
      arl: this.arl ?? null,
      eps: this.eps ?? null,
      grupoSanguineo: this.grupoSanguineo ?? null,
      jobId: this.jobId ?? null,
    };
  }
}
