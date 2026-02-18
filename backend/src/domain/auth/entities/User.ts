export interface UserProps {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  WORKSHOP_MANAGER = 'WORKSHOP_MANAGER',
  CONTRACT_SUPERVISOR = 'CONTRACT_SUPERVISOR',
  EXECUTIVE = 'EXECUTIVE',
}

export class User {
  readonly id: string;
  readonly email: string;
  private _password: string;
  readonly name: string;
  private _role: UserRole;
  private _active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id || '';
    this.email = props.email;
    this._password = props.password;
    this.name = props.name;
    this._role = props.role;
    this._active = props.active ?? true;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  get password(): string {
    return this._password;
  }

  get role(): UserRole {
    return this._role;
  }

  get active(): boolean {
    return this._active;
  }

  deactivate(): void {
    this._active = false;
  }

  activate(): void {
    this._active = true;
  }

  changeRole(role: UserRole): void {
    this._role = role;
  }

  toPlainObject() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this._role,
      active: this._active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
