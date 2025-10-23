'use client';

import React from 'react';
import { Card, CardContent } from './ui/card';

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, loading = false }) => {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className={`text-3xl font-bold mb-1 ${
              loading ? 'text-gray-400' : 'text-gray-900'
            }`}>
              {loading ? '...' : value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
            {trend && trendValue && !loading && (
              <div className="flex items-center mt-2">
                <span className={`text-xs font-medium ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend === 'up' ? '↗' : '↘'} {trendValue}
                </span>
                <span className="text-xs text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              loading ? 'bg-gray-100' : 'bg-blue-50'
            }`}>
              <Icon className={`w-6 h-6 ${
                loading ? 'text-gray-400' : 'text-blue-600'
              }`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
