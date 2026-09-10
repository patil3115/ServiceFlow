import api from './api';

export const slaService = {
  async getSlaReport() {
    const response = await api.get('/sla/report');
    return response.data;
  },

  async syncBreachFlags() {
    const response = await api.post('/sla/sync');
    return response.data;
  }
};

export default slaService;
