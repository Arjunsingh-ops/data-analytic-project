"use client";

import React from 'react';
import {
  RotateCw,
  Upload,
  Download,
  Sun,
  Moon,
  Filter,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { DatasetInfo, FilterParams } from '@/lib/api';

interface HeaderProps {
  activeTab: string;
  datasetInfo?: DatasetInfo;
  filters: FilterParams;
  setFilters: React.Dispatch<React.SetStateAction<FilterParams>>;
  onRefresh: () => void;
  onOpenUpload: () => void;
  onExport: () => void;
  loading: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function Header({
  activeTab,
  datasetInfo,
  filters,
  setFilters,
  onRefresh,
  onOpenUpload,
  onExport,
  loading,
  theme,
  toggleTheme,
}: HeaderProps) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'trends':
        return 'Revenue Trends & Timeline';
      case 'products':
        return 'Product Performance & Rankings';
      case 'regions':
        return 'Regional Revenue & Geography';
      case 'transactions':
        return 'Raw Transaction Records';
      case 'data':
        return 'Dataset Management & Ingestion';
      default:
        return 'Executive Overview';
    }
  };

  const handlePreset = (preset: string) => {
    if (!datasetInfo?.date_range.max) return;
    const maxDate = new Date(datasetInfo.date_range.max);

    if (preset === 'all') {
      setFilters((prev) => ({
        ...prev,
        startDate: datasetInfo.date_range.min,
        endDate: datasetInfo.date_range.max,
      }));
    } else if (preset === '30d') {
      const start = new Date(maxDate);
      start.setDate(start.getDate() - 30);
      setFilters((prev) => ({
        ...prev,
        startDate: start.toISOString().split('T')[0],
        endDate: datasetInfo.date_range.max,
      }));
    } else if (preset === '90d') {
      const start = new Date(maxDate);
      start.setDate(start.getDate() - 90);
      setFilters((prev) => ({
        ...prev,
        startDate: start.toISOString().split('T')[0],
        endDate: datasetInfo.date_range.max,
      }));
    } else if (preset === 'ytd') {
      const start = new Date(maxDate.getFullYear(), 0, 1);
      setFilters((prev) => ({
        ...prev,
        startDate: start.toISOString().split('T')[0],
        endDate: datasetInfo.date_range.max,
      }));
    }
  };

  const hasActiveFilters = Boolean(
    (filters.startDate && filters.startDate !== datasetInfo?.date_range.min) ||
    (filters.endDate && filters.endDate !== datasetInfo?.date_range.max) ||
    (filters.region && filters.region !== 'All') ||
    (filters.product && filters.product !== 'All')
  );

  const resetAllFilters = () => {
    setFilters({
      startDate: datasetInfo?.date_range.min || '',
      endDate: datasetInfo?.date_range.max || '',
      region: 'All',
      product: 'All',
    });
  };

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/80 backdrop-blur-md sticky top-0 z-20 transition-colors">
      {/* Top Bar */}
      <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {getTabTitle()}
            </h1>
            {datasetInfo && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-3 h-3" />
                {datasetInfo.source_name}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {datasetInfo
              ? `Showing ${datasetInfo.filtered_rows} of ${datasetInfo.total_rows} records (${datasetInfo.date_range.min} to ${datasetInfo.date_range.max})`
              : 'Connecting to Sales Analytics Engine...'}
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Data"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 font-bold" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={onExport}
            title="Export filtered transactions to CSV"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition-all shadow-sm active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Sub-Header) */}
      <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-1.5 font-bold text-[var(--text-secondary)]">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filters:</span>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center rounded-lg bg-[var(--bg-input)] p-0.5 border border-[var(--border-subtle)]">
            <button
              onClick={() => handlePreset('all')}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            >
              All Time
            </button>
            <button
              onClick={() => handlePreset('90d')}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            >
              90 Days
            </button>
            <button
              onClick={() => handlePreset('30d')}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            >
              30 Days
            </button>
            <button
              onClick={() => handlePreset('ytd')}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            >
              YTD
            </button>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-input)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
            <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="bg-transparent text-[var(--text-primary)] text-xs outline-none cursor-pointer"
            />
            <span className="text-[var(--text-muted)]">to</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className="bg-transparent text-[var(--text-primary)] text-xs outline-none cursor-pointer"
            />
          </div>

          {/* Region Select */}
          {datasetInfo?.available_regions && (
            <select
              value={filters.region || 'All'}
              onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value }))}
              className="bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer font-medium"
            >
              {datasetInfo.available_regions.map((r) => (
                <option key={r} value={r} className="bg-[var(--bg-card)]">
                  Region: {r}
                </option>
              ))}
            </select>
          )}

          {/* Product Select */}
          {datasetInfo?.available_products && (
            <select
              value={filters.product || 'All'}
              onChange={(e) => setFilters((prev) => ({ ...prev, product: e.target.value }))}
              className="bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer font-medium"
            >
              {datasetInfo.available_products.map((p) => (
                <option key={p} value={p} className="bg-[var(--bg-card)]">
                  Product: {p}
                </option>
              ))}
            </select>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors font-medium"
            >
              <X className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
