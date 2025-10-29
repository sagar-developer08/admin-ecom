/**
 * Activity Service
 * Handles all activity-related API calls
 */

import { metricsApi } from '../apiClient';

export const activityService = {
  // Get recent marketplace activities
  getRecentActivities: async (params = {}) => {
    return await metricsApi.get('/activities/recent', params);
  },

  // Get activities by type
  getActivitiesByType: async (type, params = {}) => {
    return await metricsApi.get(`/activities/type/${type}`, params);
  },

  // Get activities by time range
  getActivitiesByTimeRange: async (startDate, endDate, params = {}) => {
    return await metricsApi.get('/activities/range', {
      ...params,
      startDate,
      endDate
    });
  },

  // Get activity statistics
  getActivityStatistics: async (params = {}) => {
    return await metricsApi.get('/activities/statistics', params);
  },

  // Get activity trends
  getActivityTrends: async (params = {}) => {
    return await metricsApi.get('/activities/trends', params);
  }
};

export default activityService;
