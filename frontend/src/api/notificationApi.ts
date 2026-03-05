import axios from './axios';

export interface NotificationConfig {
  notificationEmail: string;
  contractsEnabled: boolean;
  leasingEnabled: boolean;
  documentsEnabled: boolean;
  workshopEnabled: boolean;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
  from?: string;
}

export interface NotificationResult {
  type: string;
  count: number;
  sent: number;
  errors: string[];
}

export interface NotificationSummary {
  contracts: NotificationResult;
  leasing: NotificationResult;
  documents: NotificationResult;
  workOrders: NotificationResult;
}

export const notificationApi = {
  getConfig: async () => {
    const response = await axios.get('/notifications/config');
    return response.data;
  },

  saveConfig: async (config: NotificationConfig) => {
    const response = await axios.post('/notifications/config', config);
    return response.data;
  },

  testConnection: async () => {
    const response = await axios.post('/notifications/test-connection');
    return response.data;
  },

  sendTestEmail: async (to: string) => {
    const response = await axios.post('/notifications/test-email', { to });
    return response.data;
  },

  runNotifications: async () => {
    const response = await axios.post('/notifications/run');
    return response.data;
  },

  checkContracts: async () => {
    const response = await axios.post('/notifications/check/contracts');
    return response.data;
  },

  checkLeasing: async () => {
    const response = await axios.post('/notifications/check/leasing');
    return response.data;
  },

  checkDocuments: async () => {
    const response = await axios.post('/notifications/check/documents');
    return response.data;
  },

  checkWorkOrders: async () => {
    const response = await axios.post('/notifications/check/workorders');
    return response.data;
  },
};
