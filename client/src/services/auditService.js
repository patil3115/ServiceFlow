import api from './api';

export const auditService = {
  async getSystemAuditLogs(params = {}) {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  }
};

export default auditService;
