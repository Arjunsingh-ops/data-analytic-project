"use client";

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SalesTrend, TopProducts, RegionAnalysis } from '@/lib/api';
import { TrendingUp, Layers, PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface ChartsProps {
  salesTrend: SalesTrend;
  topProducts: TopProducts;
  regionAnalysis: RegionAnalysis;
}

const REGION_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
const PRODUCT_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

interface TooltipPayloadItem {
  dataKey?: string;
  name?: string;
  value?: number | string;
  color?: string;
  payload?: {
    product?: string;
    region?: string;
    share_percentage?: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0];
    const isCurrency = dataPoint.dataKey === 'sales' || dataPoint.dataKey === 'total_sales';

    return (
      <div className="glass-panel p-3.5 rounded-2xl shadow-xl text-xs backdrop-blur-xl border border-[var(--border-highlight)] z-50">
        <p className="font-bold text-[var(--text-primary)] mb-1 pb-1 border-b border-[var(--border-subtle)]">
          {label || dataPoint.payload?.product || dataPoint.payload?.region}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dataPoint.color || '#10b981' }} />
          <span className="text-[var(--text-muted)] capitalize">{dataPoint.name || dataPoint.dataKey}:</span>
          <span className="font-bold text-[var(--text-primary)] text-sm">
            {isCurrency
              ? `$${Number(dataPoint.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : Number(dataPoint.value).toLocaleString()}
          </span>
        </div>
        {dataPoint.payload?.share_percentage && (
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            Share of Revenue: <span className="font-bold text-emerald-400">{dataPoint.payload.share_percentage}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
}

export default function Charts({ salesTrend, topProducts, regionAnalysis }: ChartsProps) {
  const [trendMetric, setTrendMetric] = useState<'sales' | 'quantity' | 'transactions'>('sales');
  const [regionChartType, setRegionChartType] = useState<'bar' | 'donut'>('bar');

  // Format trend data for Recharts
  const trendData = (salesTrend.series && salesTrend.series.length > 0)
    ? salesTrend.series
    : salesTrend.labels.map((label, idx) => ({
        period: label,
        sales: salesTrend.values[idx] || 0,
        quantity: salesTrend.quantities ? salesTrend.quantities[idx] : 0,
        transactions: salesTrend.transactions ? salesTrend.transactions[idx] : 0,
      }));

  // Format top products
  const productsData = (topProducts.items && topProducts.items.length > 0)
    ? topProducts.items
    : topProducts.labels.map((label, idx) => ({
        product: label,
        sales: topProducts.values[idx] || 0,
        quantity: topProducts.quantities ? topProducts.quantities[idx] : 0,
        share_percentage: topProducts.revenue_shares ? topProducts.revenue_shares[idx] : 0,
      }));

  // Format region data
  const regionsData = (regionAnalysis.items && regionAnalysis.items.length > 0)
    ? regionAnalysis.items
    : regionAnalysis.chart_data.labels.map((label, idx) => ({
        region: label,
        total_sales: regionAnalysis.chart_data.sales_values[idx] || 0,
        total_quantity: regionAnalysis.chart_data.quantity_values[idx] || 0,
        average_sale: 0,
        revenue_percentage: 0,
      }));

  return (
    <div className="space-y-8">
      {/* 1. SALES TIMELINE TREND */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Performance Timeline
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Historical sales velocity and trajectory aggregated over time
            </p>
          </div>

          {/* Metric Selector Toggle */}
          <div className="flex items-center rounded-xl bg-[var(--bg-input)] p-1 border border-[var(--border-subtle)] text-xs">
            <button
              onClick={() => setTrendMetric('sales')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                trendMetric === 'sales'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Revenue ($)
            </button>
            <button
              onClick={() => setTrendMetric('quantity')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                trendMetric === 'quantity'
                  ? 'bg-blue-500 text-zinc-950 shadow-md shadow-blue-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Units Sold
            </button>
            <button
              onClick={() => setTrendMetric('transactions')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                trendMetric === 'transactions'
                  ? 'bg-purple-500 text-zinc-950 shadow-md shadow-purple-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Orders
            </button>
          </div>
        </div>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={
                      trendMetric === 'sales' ? '#10b981' : trendMetric === 'quantity' ? '#3b82f6' : '#a855f7'
                    }
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      trendMetric === 'sales' ? '#10b981' : trendMetric === 'quantity' ? '#3b82f6' : '#a855f7'
                    }
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" vertical={false} />
              <XAxis
                dataKey="period"
                stroke="var(--text-muted)"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickFormatter={(val) =>
                  trendMetric === 'sales'
                    ? `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
                    : val
                }
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={trendMetric}
                name={trendMetric === 'sales' ? 'Revenue' : trendMetric === 'quantity' ? 'Volume' : 'Orders'}
                stroke={
                  trendMetric === 'sales' ? '#10b981' : trendMetric === 'quantity' ? '#3b82f6' : '#a855f7'
                }
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#trendGradient)"
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. DUAL COLUMN: TOP PRODUCTS & REGIONAL IMPACT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    Top Products
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Ranked by total sales revenue
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productsData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="product"
                    type="category"
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}
                    width={85}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="sales" name="Sales" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1200}>
                    {productsData.map((_, idx) => (
                      <Cell
                        key={`cell-prod-${idx}`}
                        fill={PRODUCT_COLORS[idx % PRODUCT_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Share Breakdown */}
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-2.5">
            {productsData.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PRODUCT_COLORS[idx] }}
                  />
                  <span className="font-semibold text-[var(--text-primary)]">{item.product}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[var(--text-muted)]">{item.quantity} units</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    ${item.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-emerald-400 font-semibold">{item.share_percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Performance */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    Regional Impact
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Geographic distribution and territory totals
                  </p>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center rounded-xl bg-[var(--bg-input)] p-1 border border-[var(--border-subtle)] text-xs">
                <button
                  onClick={() => setRegionChartType('bar')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    regionChartType === 'bar'
                      ? 'bg-purple-500 text-zinc-950 font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Bar view"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRegionChartType('donut')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    regionChartType === 'donut'
                      ? 'bg-purple-500 text-zinc-950 font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Donut view"
                >
                  <PieIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {regionChartType === 'bar' ? (
                  <BarChart data={regionsData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" vertical={false} />
                    <XAxis
                      dataKey="region"
                      stroke="var(--text-muted)"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="total_sales" name="Sales" radius={[6, 6, 0, 0]} barSize={36} animationDuration={1200}>
                      {regionsData.map((_, idx) => (
                        <Cell
                          key={`cell-reg-${idx}`}
                          fill={REGION_COLORS[idx % REGION_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={regionsData}
                      dataKey="total_sales"
                      nameKey="region"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      animationDuration={1200}
                    >
                      {regionsData.map((_, idx) => (
                        <Cell
                          key={`cell-pie-${idx}`}
                          fill={REGION_COLORS[idx % REGION_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(val) => <span className="text-xs text-[var(--text-secondary)]">{val}</span>}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regional Table Summary */}
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {regionsData.map((reg, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">{reg.region}</span>
                <p className="font-extrabold text-[var(--text-primary)] mt-0.5">
                  ${(reg.total_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-emerald-400">{reg.total_quantity} units</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
