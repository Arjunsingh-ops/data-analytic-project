"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import KPICards from './KPICards';
import Charts from './Charts';
import TransactionsTable from './TransactionsTable';
import DataManagement from './DataManagement';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import ProductionEmptyState from './ProductionEmptyState';
import {
  fetchAnalytics,
  checkBackendHealth,
  uploadDataset,
  resetDataset,
  AnalyticsResponse,
  FilterParams,
} from '@/lib/api';

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'healthy' | 'degraded' | 'offline'>('offline');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [filters, setFilters] = useState<FilterParams>({
    startDate: '',
    endDate: '',
    region: 'All',
    product: 'All',
  });

  // Toggle Dark / Light Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof document !== 'undefined') {
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Check health and load analytics data
  const loadDashboardData = useCallback(async (currentFilters: FilterParams, isInitial = false) => {
    setLoading(true);
    setError(null);

    try {
      // Check health in parallel
      checkBackendHealth().then((h) => setBackendStatus(h.status));

      const response = await fetchAnalytics(currentFilters);
      setData(response);

      // If initial load, sync date bounds with dataset
      if (isInitial && response.dataset_info?.date_range) {
        setFilters((prev) => ({
          ...prev,
          startDate: response.dataset_info.date_range.min,
          endDate: response.dataset_info.date_range.max,
        }));
      }
    } catch (err: unknown) {
      console.error('Failed to fetch analytics:', err);
      const message = err instanceof Error ? err.message : 'Error fetching sales analytics data.';
      setError(message);
      setBackendStatus('offline');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboardData({}, true);
  }, [loadDashboardData]);

  // Refetch when filters change (debounced slightly for smooth input)
  useEffect(() => {
    // Only fetch when user has interacted with filters
    const timer = setTimeout(() => {
      loadDashboardData(filters, false);
    }, 250);

    return () => clearTimeout(timer);
  }, [filters, loadDashboardData]);

  // Handle CSV upload
  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const res = await uploadDataset(file);
      setData(res.data);
      if (res.data.dataset_info?.date_range) {
        setFilters({
          startDate: res.data.dataset_info.date_range.min,
          endDate: res.data.dataset_info.date_range.max,
          region: 'All',
          product: 'All',
        });
      }
      setActiveTab('overview');
    } finally {
      setLoading(false);
    }
  };

  // Handle Dataset Reset
  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await resetDataset();
      setData(res.data);
      if (res.data.dataset_info?.date_range) {
        setFilters({
          startDate: res.data.dataset_info.date_range.min,
          endDate: res.data.dataset_info.date_range.max,
          region: 'All',
          product: 'All',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV Export of current filtered records
  const handleExportCSV = () => {
    if (!data || !data.recent_transactions || data.recent_transactions.length === 0) return;

    const headers = ['Date', 'Product', 'Region', 'Quantity', 'Sales'];
    const rows = data.recent_transactions.map((t) => [
      t.date,
      `"${t.product.replace(/"/g, '""')}"`,
      `"${t.region.replace(/"/g, '""')}"`,
      t.quantity,
      t.sales.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors">
      {/* Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        backendStatus={backendStatus}
        datasetName={data?.dataset_info?.source_name || ''}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          datasetInfo={data?.dataset_info}
          filters={filters}
          setFilters={setFilters}
          onRefresh={() => loadDashboardData(filters, false)}
          onOpenUpload={() => setActiveTab('data')}
          onExport={handleExportCSV}
          loading={loading}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-[95rem] w-full mx-auto space-y-8">
          {error ? (
            <ErrorState
              message={error}
              onRetry={() => loadDashboardData(filters, false)}
              loading={loading}
            />
          ) : loading && !data ? (
            <LoadingSkeleton />
          ) : data ? (
            <>
              {/* Tab Navigation Content */}
              {activeTab === 'overview' && (
                <>
                  {data.dataset_info.total_rows === 0 ? (
                    <ProductionEmptyState onUpload={handleUpload} loading={loading} />
                  ) : data.metrics.total_transactions === 0 ? (
                    <EmptyState
                      onResetFilters={() =>
                        setFilters({
                          startDate: data.dataset_info?.date_range.min || '',
                          endDate: data.dataset_info?.date_range.max || '',
                          region: 'All',
                          product: 'All',
                        })
                      }
                    />
                  ) : (
                    <>
                      <KPICards metrics={data.metrics} />
                      <Charts
                        salesTrend={data.sales_trend}
                        topProducts={data.top_products}
                        regionAnalysis={data.region_analysis}
                      />
                      <TransactionsTable
                        transactions={data.recent_transactions}
                        onExport={handleExportCSV}
                      />
                    </>
                  )}
                </>
              )}

              {activeTab === 'trends' && (
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-3xl">
                    <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
                      Historical Revenue & Velocity Trends
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Explore monthly performance trajectories, transaction frequencies, and volume shifts.
                    </p>
                  </div>
                  <Charts
                    salesTrend={data.sales_trend}
                    topProducts={data.top_products}
                    regionAnalysis={data.region_analysis}
                  />
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-3xl">
                    <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
                      Product Portfolio Performance
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Identify revenue drivers, inventory volume distributions, and margin champions.
                    </p>
                  </div>
                  <Charts
                    salesTrend={data.sales_trend}
                    topProducts={data.top_products}
                    regionAnalysis={data.region_analysis}
                  />
                </div>
              )}

              {activeTab === 'regions' && (
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-3xl">
                    <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
                      Geographic & Regional Impact
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Analyze territory revenues, regional market share, and order concentration.
                    </p>
                  </div>
                  <Charts
                    salesTrend={data.sales_trend}
                    topProducts={data.top_products}
                    regionAnalysis={data.region_analysis}
                  />
                </div>
              )}

              {activeTab === 'transactions' && (
                <TransactionsTable
                  transactions={data.recent_transactions}
                  onExport={handleExportCSV}
                />
              )}

              {activeTab === 'data' && (
                <DataManagement
                  datasetInfo={data.dataset_info}
                  onUpload={handleUpload}
                  onReset={handleReset}
                  loading={loading}
                />
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
