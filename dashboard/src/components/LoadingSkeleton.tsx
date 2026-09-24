"use client";

import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel p-6 rounded-3xl h-36 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="w-20 h-3 rounded-lg skeleton-shimmer" />
                <div className="w-32 h-7 rounded-xl skeleton-shimmer" />
              </div>
              <div className="w-12 h-12 rounded-2xl skeleton-shimmer" />
            </div>
            <div className="w-24 h-3 rounded-lg skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Main Chart Skeleton */}
      <div className="glass-panel p-8 rounded-3xl h-[420px] flex flex-col justify-between">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <div className="w-48 h-6 rounded-xl skeleton-shimmer" />
            <div className="w-64 h-3 rounded-lg skeleton-shimmer" />
          </div>
          <div className="w-36 h-8 rounded-xl skeleton-shimmer" />
        </div>
        <div className="w-full flex-1 rounded-2xl skeleton-shimmer" />
      </div>

      {/* Dual Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-3xl h-[360px] flex flex-col justify-between">
          <div className="w-36 h-6 rounded-xl skeleton-shimmer mb-4" />
          <div className="w-full flex-1 rounded-2xl skeleton-shimmer" />
        </div>
        <div className="glass-panel p-8 rounded-3xl h-[360px] flex flex-col justify-between">
          <div className="w-36 h-6 rounded-xl skeleton-shimmer mb-4" />
          <div className="w-full flex-1 rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
