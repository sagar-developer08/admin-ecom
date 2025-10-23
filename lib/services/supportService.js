/**
 * Support & Ticketing Service
 */

import { supportApi } from '../apiClient';

export const supportService = {
  // Get all tickets
  getAllTickets: async (params = {}) => {
    return await supportApi.get('/support/tickets', params);
  },

  // Get ticket by ID
  getTicketById: async (ticketId) => {
    return await supportApi.get(`/support/tickets/${ticketId}`);
  },

  // Create ticket
  createTicket: async (ticketData) => {
    return await supportApi.post('/support/tickets', ticketData);
  },

  // Update ticket status
  updateTicketStatus: async (ticketId, status) => {
    return await supportApi.put(`/support/tickets/${ticketId}/status`, { status });
  },

  // Reply to ticket
  replyToTicket: async (ticketId, message) => {
    return await supportApi.post(`/support/tickets/${ticketId}/reply`, { message });
  },

  // Get ticket statistics
  getTicketStatistics: async () => {
    return await supportApi.get('/support/tickets/statistics');
  },
};

export default supportService;

