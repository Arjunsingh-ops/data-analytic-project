"use client";

import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  onResetFilters: () => void;
}

export default function EmptyState({ onResetFilters }: EmptyStateProps) {
  return (
    <div className="glass-panel p-12 rounded-3xl text-center max-w-lg mx-auto space-y-4 my-12 border-dashed">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
        <SearchX className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
        No Matching Sales Data
      </h3>
      <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
        No transactions were found for the chosen date range, region, or product. Try broadening your filter parameters.
      </p>
      <div>
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-md shadow-emerald-500/10"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      </div>
    </div>
  );
}
