import api from './api';

export const ticketService = {
  async getTickets(params = {}) {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  async getTicketById(id) {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  async createTicket(ticketData) {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  },

  async updateTicket(id, updateData) {
    const response = await api.put(`/tickets/${id}`, updateData);
    return response.data;
  },

  async assignTicket(id, assignedTo) {
    const response = await api.put(`/tickets/${id}/assign`, { assignedTo });
    return response.data;
  },

  async updateStatus(id, status, notes = '') {
    const response = await api.put(`/tickets/${id}/status`, { status, notes });
    return response.data;
  },

  async updatePriority(id, priority) {
    const response = await api.put(`/tickets/${id}/priority`, { priority });
    return response.data;
  },

  async resolveTicket(id, notes) {
    const response = await api.put(`/tickets/${id}/resolve`, { notes });
    return response.data;
  },

  async closeTicket(id, reason = '') {
    const response = await api.put(`/tickets/${id}/close`, { reason });
    return response.data;
  },

  async reopenTicket(id, reason) {
    const response = await api.put(`/tickets/${id}/reopen`, { reason });
    return response.data;
  },

  async getTicketSla(id) {
    const response = await api.get(`/tickets/${id}/sla`);
    return response.data;
  },

  async getTicketAuditLogs(id) {
    const response = await api.get(`/tickets/${id}/audit-logs`);
    return response.data;
  }
};

export default ticketService;
