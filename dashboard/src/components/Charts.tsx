"use client";

import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartsProps {
  salesTrend: { date: string; sales: number }[];
  topProducts: { product: string; sales: number }[];
  regionSales: { region: string; sales: number }[];
}

export default function Charts({ salesTrend, topProducts, regionSales }: ChartsProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/90 border border-zinc-700 p-4 rounded-xl shadow-2xl text-white text-sm backdrop-blur-md">
          <p className="font-bold mb-2 text-zinc-300 pb-2 border-b border-zinc-700/50">{label}</p>
          <p className="text-emerald-400 font-bold text-lg">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-8">
      {/* Sales Trend Chart */}
      <div className="bg-white/10 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800/80 p-6 md:p-8 rounded-3xl shadow-2xl hover:shadow-emerald-500/5 transition-shadow duration-500">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 bg-clip-text">
            Revenue Timeline
          </h3>
          <div className="h-2 w-24 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full blur-[1px]"></div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrend} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} opacity={0.4} />
              <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickMargin={12} axisLine={false} tickLine={false} />
              <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} axisLine={false} tickLine={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)', stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line type="monotone" dataKey="sales" stroke="url(#colorSales)" strokeWidth={0} activeDot={false} fillOpacity={1} fill="url(#colorSales)" />
              <Line type="natural" dataKey="sales" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }} animationDuration={2000} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white/10 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800/80 p-6 md:p-8 rounded-3xl shadow-2xl hover:shadow-blue-500/5 transition-shadow duration-500">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Top Performers</h3>
            <div className="h-2 w-16 bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full blur-[1px]"></div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} opacity={0.4} />
                <XAxis type="number" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} axisLine={false} tickLine={false} />
                <YAxis dataKey="product" type="category" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 500 }} width={90} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                <Bar dataKey="sales" radius={[0, 6, 6, 0]} animationDuration={2000} barSize={24}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#60a5fa' : '#3b82f6'} className="hover:opacity-80 transition-opacity duration-300" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region Sales */}
        <div className="bg-white/10 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800/80 p-6 md:p-8 rounded-3xl shadow-2xl hover:shadow-purple-500/5 transition-shadow duration-500">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Regional Impact</h3>
            <div className="h-2 w-16 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full blur-[1px]"></div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionSales} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} opacity={0.4} />
                <XAxis dataKey="region" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 13, fontWeight: 500 }} tickMargin={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }} />
                <Bar dataKey="sales" radius={[6, 6, 0, 0]} barSize={40} animationDuration={2000}>
                  {regionSales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={'#a855f7'} className="hover:opacity-80 transition-opacity duration-300" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
