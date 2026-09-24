"use client";

import React, { useState, useMemo } from 'react';
import { Transaction } from '@/lib/api';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

interface TransactionsTableProps {
  transactions: Transaction[];
  onExport: () => void;
}

export default function TransactionsTable({ transactions, onExport }: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'sales' | 'quantity' | 'product' | 'region'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtered & Sorted items
  const filtered = useMemo(() => {
    const result = transactions.filter((t) => {
      const term = searchTerm.toLowerCase();
      return (
        t.product.toLowerCase().includes(term) ||
        t.region.toLowerCase().includes(term) ||
        t.date.includes(term)
      );
    });

    result.sort((a, b) => {
      let valA: string | number = a[sortField];
      let valB: string | number = b[sortField];

      if (sortField === 'sales' || sortField === 'quantity') {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [transactions, searchTerm, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
      {/* Table Header Bar */}
      <div className="p-6 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-emerald-500" />
            Transaction Ledger
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Displaying {filtered.length} matched transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search product or region..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[var(--bg-input)] text-[var(--text-primary)] pl-9 pr-3 py-2 rounded-xl text-xs border border-[var(--border-subtle)] focus:border-emerald-500 outline-none w-56 sm:w-64 transition-all"
            />
          </div>

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] transition-colors active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--bg-card-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-bold border-b border-[var(--border-subtle)]">
              <th
                onClick={() => toggleSort('date')}
                className="px-6 py-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('product')}
                className="px-6 py-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Product</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('region')}
                className="px-6 py-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Region</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('quantity')}
                className="px-6 py-4 text-right cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Quantity</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('sales')}
                className="px-6 py-4 text-right cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Sales Revenue</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {paginated.length > 0 ? (
              paginated.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[var(--bg-card-subtle)]/70 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                    {item.date}
                  </td>
                  <td className="px-6 py-4 font-bold text-[var(--text-primary)]">
                    {item.product}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {item.region}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[var(--text-secondary)] font-medium">
                    {item.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-emerald-400 text-sm">
                    ${item.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                  No transactions match the specified search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <div>
          Page <span className="font-bold text-[var(--text-primary)]">{currentPage}</span> of{' '}
          <span className="font-bold text-[var(--text-primary)]">{totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-card-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-card-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
