"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, RefreshCw, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import { DatasetInfo } from '@/lib/api';

interface DataManagementProps {
  datasetInfo?: DatasetInfo;
  onUpload: (file: File) => Promise<void>;
  onReset: () => Promise<void>;
  loading: boolean;
}

export default function DataManagement({
  datasetInfo,
  onUpload,
  onReset,
  loading,
}: DataManagementProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        setUploadMessage({ type: 'error', text: 'Only .csv files are supported.' });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProcessUpload = async () => {
    if (!selectedFile) return;
    setUploadMessage(null);
    try {
      await onUpload(selectedFile);
      setUploadMessage({
        type: 'success',
        text: `Successfully uploaded and processed '${selectedFile.name}'!`,
      });
      setSelectedFile(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload CSV dataset.';
      setUploadMessage({
        type: 'error',
        text: message,
      });
    }
  };

  const handleResetDefault = async () => {
    setUploadMessage(null);
    try {
      await onReset();
      setUploadMessage({
        type: 'success',
        text: 'Dataset successfully restored to default sample data.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset dataset.';
      setUploadMessage({
        type: 'error',
        text: message,
      });
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      'Date,Product,Region,Sales,Quantity\n' +
      '2025-01-05,Widget A,North,1500.00,30\n' +
      '2025-01-12,Widget B,South,2300.50,45\n' +
      '2025-01-20,Widget C,East,980.00,20\n' +
      '2025-02-03,Widget A,West,1750.25,35\n' +
      '2025-02-14,Widget D,North,3200.00,60\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_sales_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Current Dataset Overview Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Active Dataset Metadata
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-6">
          Information regarding the dataset currently driving your analytics reports.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Source File</span>
            <p className="text-sm font-black text-[var(--text-primary)] mt-1 truncate">
              {datasetInfo?.source_name || 'Loading...'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Total Clean Records</span>
            <p className="text-sm font-black text-emerald-400 mt-1">
              {datasetInfo?.total_rows || 0} rows
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Span of Dates</span>
            <p className="text-sm font-black text-[var(--text-primary)] mt-1">
              {datasetInfo?.date_range.min} to {datasetInfo?.date_range.max}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Ingest Custom Sales Dataset
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-6">
          Upload any CSV containing columns: <span className="text-emerald-400 font-semibold">Date, Product, Region, Sales, Quantity</span>.
          The backend pipeline will sanitize formatting, convert currencies, eliminate duplicates, and update all analytics.
        </p>

        {uploadMessage && (
          <div
            className={`p-4 rounded-2xl mb-6 text-xs flex items-center gap-3 border ${
              uploadMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {uploadMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{uploadMessage.text}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
              : 'border-[var(--border-subtle)] hover:border-emerald-500/50 bg-[var(--bg-card-subtle)]/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            {selectedFile ? selectedFile.name : 'Choose a file or drag & drop here'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm">
            Standard CSV file up to 16MB. UTF-8 encoded with headers.
          </p>

          {selectedFile && (
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
        </div>

        {/* Actions Button */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] transition-colors active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download CSV Template</span>
            </button>

            <button
              onClick={handleResetDefault}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-amber-400 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] transition-colors active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset to Sample Data</span>
            </button>
          </div>

          <button
            onClick={handleProcessUpload}
            disabled={!selectedFile || loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{loading ? 'Processing Pipeline...' : 'Process Dataset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
