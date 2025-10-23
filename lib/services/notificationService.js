/**
 * Notification Service
 */

import { notificationApi } from '../apiClient';

export const notificationService = {
  // Get user notifications
  getUserNotifications: async (params = {}) => {
    return await notificationApi.get('/notifications/user', params);
  },

  // Create notification
  createNotification: async (notificationData) => {
    return await notificationApi.post('/notifications', notificationData);
  },

  // Mark as read
  markAsRead: async (notificationId) => {
    return await notificationApi.put(`/notifications/${notificationId}/read`);
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    return await notificationApi.delete(`/notifications/${notificationId}`);
  },

  // Broadcast notification
  broadcastNotification: async (notificationData) => {
    return await notificationApi.post('/notifications/broadcast', notificationData);
  },
};

export default notificationService;

