/**
 * Bar Chart Component for Analytics
 */

import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BarChart = ({ data, dataKeys = [], height = 300, colors = ['#3B82F6', '#10B981', '#F59E0B'] }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, index) => (
          <Bar key={key} dataKey={key} fill={colors[index % colors.length]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;

