"use client";

import React, { useRef, useState } from 'react';
import { UploadCloud, Download, AlertCircle, Layers } from 'lucide-react';

interface ProductionEmptyStateProps {
  onUpload: (file: File) => Promise<void>;
  loading: boolean;
}

export default function ProductionEmptyState({ onUpload, loading }: ProductionEmptyStateProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMsg(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.csv')) {
        try {
          await onUpload(file);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Upload failed';
          setErrorMsg(msg);
        }
      } else {
        setErrorMsg('Please upload a valid .csv file.');
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setErrorMsg(null);
      try {
        await onUpload(file);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setErrorMsg(msg);
      }
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'Date,Product,Region,Sales,Quantity\n' +
      '2025-01-05,Enterprise Plan,North,1500.00,30\n' +
      '2025-01-12,Professional Tier,South,2300.50,45\n' +
      '2025-01-20,Starter Pack,East,980.00,20\n' +
      '2025-02-03,Enterprise Plan,West,1750.25,35\n' +
      '2025-02-14,Addon Services,North,3200.00,60\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sales_data_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 my-6">
      {/* Hero Welcome Card */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl relative overflow-hidden border border-[var(--border-highlight)] shadow-2xl text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          PRODUCTION ANALYTICS PLATFORM ONLINE
        </div>

        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)] mb-4">
          Ready to Ingest Your Sales Data
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed mb-8">
          Upload your sales records to generate real-time KPI metrics, revenue trajectory models,
          product performance rankings, and regional impact distributions.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Drag & Drop Hero Box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
              : 'border-[var(--border-subtle)] hover:border-emerald-500/50 bg-[var(--bg-card-subtle)]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
            <UploadCloud className={`w-8 h-8 ${loading ? 'animate-bounce' : ''}`} />
          </div>

          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
            {loading ? 'Ingesting and Analyzing Sales Data...' : 'Drop your sales CSV file here'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md">
            Click to browse your device or drag and drop. Automatic validation, currency sanitization, and deduplication applied.
          </p>

          <button
            type="button"
            className="mt-6 px-6 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            Select CSV File
          </button>
        </div>

        {/* Quick Template Action */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-emerald-400 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template with Headers</span>
          </button>
        </div>
      </div>

      {/* Required CSV Schema Reference Cards */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl">
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Required CSV Schema
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          Ensure your dataset includes the following columns (case-insensitive headers):
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
            <span className="font-bold text-emerald-400">Date</span>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">YYYY-MM-DD or standard parseable dates</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
            <span className="font-bold text-blue-400">Product</span>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Item or SKU name</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
            <span className="font-bold text-purple-400">Region</span>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Territory or branch</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
            <span className="font-bold text-amber-400">Sales</span>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Monetary amount (e.g. 1500.00)</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
            <span className="font-bold text-teal-400">Quantity</span>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Positive integer units</p>
          </div>
        </div>
      </div>
    </div>
  );
}
