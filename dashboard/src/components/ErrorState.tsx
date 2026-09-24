"use client";

import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  loading: boolean;
}

export default function ErrorState({ message, onRetry, loading }: ErrorStateProps) {
  const isConnectionError = message.toLowerCase().includes('unable to reach') || message.toLowerCase().includes('fetch');

  return (
    <div className="glass-panel p-8 sm:p-12 rounded-3xl max-w-2xl mx-auto text-center space-y-6 border-rose-500/20 shadow-2xl mt-8">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {isConnectionError ? 'Backend Connection Required' : 'Analytics Computation Error'}
        </h2>
        <p className="text-xs text-rose-400 font-mono bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 inline-block max-w-lg break-words">
          {message}
        </p>
      </div>

      {isConnectionError && (
        <div className="text-left bg-[var(--bg-card-subtle)] p-5 rounded-2xl border border-[var(--border-subtle)] text-xs space-y-3">
          <p className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Quick Setup & Start Guide:
          </p>
          <div className="space-y-2 text-[var(--text-secondary)] font-mono">
            <p className="p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)]">
              1. Start backend: <span className="text-emerald-400">python backend/sales_analytics.py</span>
            </p>
            <p className="p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)]">
              2. Or verify backend port: default is <span className="text-emerald-400">http://localhost:5000</span>
            </p>
            <p className="p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)]">
              3. Check <span className="text-emerald-400">NEXT_PUBLIC_API_URL</span> in your <span className="text-emerald-400">.env.local</span>
            </p>
          </div>
        </div>
      )}

      <div>
        <button
          onClick={onRetry}
          disabled={loading}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Reconnecting...' : 'Retry Connection'}</span>
        </button>
      </div>
    </div>
  );
}
