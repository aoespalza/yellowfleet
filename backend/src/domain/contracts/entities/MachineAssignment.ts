export interface MachineAssignmentProps {
  id?: string;
  machineId: string;
  contractId: string;
  assignedAt?: Date;
  releasedAt?: Date;
}

export class MachineAssignment {
  readonly id: string;
  readonly machineId: string;
  readonly contractId: string;
  readonly assignedAt: Date;
  private _releasedAt?: Date;

  constructor(props: MachineAssignmentProps) {
    this.id = props.id || '';
    this.machineId = props.machineId;
    this.contractId = props.contractId;
    this.assignedAt = props.assignedAt || new Date();
    this._releasedAt = props.releasedAt;
  }

  get releasedAt(): Date | undefined {
    return this._releasedAt;
  }

  get isActive(): boolean {
    return !this._releasedAt;
  }

  release(): void {
    if (this._releasedAt) {
      throw new Error('Assignment already released');
    }
    this._releasedAt = new Date();
  }

  toPlainObject() {
    return {
      id: this.id,
      machineId: this.machineId,
      contractId: this.contractId,
      assignedAt: this.assignedAt,
      releasedAt: this._releasedAt,
    };
  }
}
