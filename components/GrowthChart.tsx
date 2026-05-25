"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChartDataPoint {
  label: string;
  count: number;
}

interface GrowthChartProps {
  data: ChartDataPoint[];
}

export default function GrowthChart({ data }: GrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis 
          dataKey="label" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#9ca3af', fontSize: 12 }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#9ca3af', fontSize: 12 }} 
        />
        <Tooltip 
          cursor={{ fill: '#f9fafb' }}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Bar 
          dataKey="count" 
          fill="#1E3A8A" 
          radius={[4, 4, 0, 0]} 
          barSize={40} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
