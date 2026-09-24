"use client";

import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  MapPin,
  TableProperties,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  backendStatus: 'healthy' | 'degraded' | 'offline';
  datasetName: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  backendStatus,
  datasetName,
}: SidebarProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'trends', label: 'Revenue Trends', icon: TrendingUp },
    { id: 'products', label: 'Top Products', icon: Package },
    { id: 'regions', label: 'Regional Impact', icon: MapPin },
    { id: 'transactions', label: 'Transactions', icon: TableProperties },
    { id: 'data', label: 'Data Management', icon: UploadCloud },
  ];

  return (
    <aside
      className={`glass-panel border-r border-[var(--border-subtle)] flex flex-col justify-between transition-all duration-300 z-30 shrink-0 sticky top-0 h-screen ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Logo and Brand */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Layers className="w-5 h-5 text-zinc-950 font-black" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <span className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">
                  SalesPulse
                </span>
                <p className="text-[10px] text-[var(--text-muted)] font-semibold tracking-wider uppercase">
                  Analytics Suite
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-emerald-400' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {isActive && (
                  <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[var(--border-subtle)]">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  backendStatus === 'healthy'
                    ? 'bg-emerald-400'
                    : backendStatus === 'degraded'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  backendStatus === 'healthy'
                    ? 'bg-emerald-500'
                    : backendStatus === 'degraded'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            </span>
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold capitalize text-[var(--text-primary)] leading-tight">
                  API: {backendStatus}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] truncate" title={datasetName}>
                  {datasetName || 'No Dataset'}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <Activity className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
          )}
        </div>
      </div>
    </aside>
  );
}
