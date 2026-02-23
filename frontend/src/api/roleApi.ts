import axios from './axios';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  canCreateMachine: boolean;
  canEditMachine: boolean;
  canDeleteMachine: boolean;
  canUpdateHourMeter: boolean;
  canCreateContract: boolean;
  canEditContract: boolean;
  canDeleteContract: boolean;
  canAssignMachine: boolean;
  canCreateWorkOrder: boolean;
  canEditWorkOrder: boolean;
  canDeleteWorkOrder: boolean;
  canCloseWorkOrder: boolean;
  canEditLegalDocuments: boolean;
  canCreateUser: boolean;
  canEditUser: boolean;
  canDeleteUser: boolean;
  canManageRoles: boolean;
}

export const roleApi = {
  getAll: async (): Promise<Role[]> => {
    const { data } = await axios.get('/roles');
    return data;
  },

  get: async (name: string): Promise<Role> => {
    const { data } = await axios.get(`/roles/${name}`);
    return data;
  },

  create: async (role: Partial<Role>): Promise<Role> => {
    const { data } = await axios.post('/roles', role);
    return data;
  },

  update: async (name: string, role: Partial<Role>): Promise<Role> => {
    const { data } = await axios.put(`/roles/${name}`, role);
    return data;
  },

  delete: async (name: string): Promise<void> => {
    await axios.delete(`/roles/${name}`);
  },
};
