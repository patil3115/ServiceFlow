import api from './api';

export const dashboardService = {
  async getDashboard() {
    const response = await api.get('/dashboard');
    return response.data;
  },

  async getAdminDashboard() {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },

  async getAgentDashboard() {
    const response = await api.get('/dashboard/agent');
    return response.data;
  }
};

export default dashboardService;
