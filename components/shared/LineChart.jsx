/**
 * Line Chart Component for Analytics
 */

import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LineChart = ({ data, dataKeys = [], height = 300, colors = ['#3B82F6', '#10B981', '#F59E0B'] }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, index) => (
          <Line 
            key={key} 
            type="monotone" 
            dataKey={key} 
            stroke={colors[index % colors.length]} 
            activeDot={{ r: 8 }} 
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;

