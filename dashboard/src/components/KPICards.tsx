"use client";

import React from 'react';
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Metrics } from '@/lib/api';

interface KPICardsProps {
  metrics: Metrics;
}

export default function KPICards({ metrics }: KPICardsProps) {
  const cards = [
    {
      title: 'Total Revenue',
      value: `$${(metrics.total_sales || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: `Avg $${(metrics.average_sale_per_transaction || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} / order`,
      icon: DollarSign,
      glow: 'from-emerald-500/20 to-teal-500/10',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      gradientText: 'from-emerald-400 via-teal-300 to-emerald-200',
    },
    {
      title: 'Volume Sold',
      value: (metrics.total_quantity || 0).toLocaleString(),
      subtitle: `Avg ${(metrics.average_quantity_per_transaction || 0).toFixed(1)} units / order`,
      icon: Package,
      glow: 'from-blue-500/20 to-indigo-500/10',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      gradientText: 'from-blue-400 via-indigo-300 to-blue-200',
    },
    {
      title: 'Total Orders',
      value: (metrics.total_transactions || 0).toLocaleString(),
      subtitle: `${metrics.unique_products || 0} Products across ${metrics.unique_regions || 0} Regions`,
      icon: ShoppingCart,
      glow: 'from-purple-500/20 to-pink-500/10',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      gradientText: 'from-purple-400 via-pink-300 to-purple-200',
    },
    {
      title: 'Peak Order Value',
      value: `$${(metrics.highest_sale || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: `Min recorded: $${(metrics.lowest_sale || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: Award,
      glow: 'from-amber-500/20 to-orange-500/10',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      gradientText: 'from-amber-400 via-orange-300 to-amber-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
          >
            {/* Ambient Background Glow */}
            <div
              className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-40 group-hover:opacity-80 transition-opacity bg-gradient-to-br ${card.glow}`}
            />

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {card.title}
                </p>
                <h3
                  className={`text-2xl lg:text-3xl font-black mt-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${card.gradientText}`}
                >
                  {card.value}
                </h3>
              </div>
              <div
                className={`p-3 rounded-2xl border transition-transform duration-300 group-hover:scale-110 ${card.iconBg}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>

            <div className="relative z-10 mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                {card.subtitle}
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400/80" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
