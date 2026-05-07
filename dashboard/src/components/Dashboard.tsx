"use client";

import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { UploadCloud, Filter } from 'lucide-react';
import KPICards from './KPICards';
import Charts from './Charts';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setError("File is empty.");
          setLoading(false);
          return;
        }

        const cols = Object.keys(results.data[0] as object);
        const colMap: Record<string, string> = {};
        cols.forEach(c => { colMap[c.toLowerCase().trim()] = c; });

        const requiredCols = ['date', 'sales', 'quantity', 'region', 'product'];
        const missing = requiredCols.filter(c => !colMap[c]);

        if (missing.length > 0) {
          setError(`Missing required columns: ${missing.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}`);
          setLoading(false);
          return;
        }

        const cleanedData = results.data.map((row: any) => ({
          date: new Date(row[colMap['date']]),
          sales: parseFloat(row[colMap['sales']]),
          quantity: parseInt(row[colMap['quantity']]),
          region: row[colMap['region']],
          product: row[colMap['product']]
        })).filter(r => !isNaN(r.sales) && !isNaN(r.quantity) && !isNaN(r.date.getTime()));

        setData(cleanedData);

        if (cleanedData.length > 0) {
          const dates = cleanedData.map(d => d.date.getTime());
          const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
          const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
          setDateRange({ start: minDate, end: maxDate });
        }

        setLoading(false);
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
      }
    });
  };

  const regions = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d.region)))], [data]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchRegion = regionFilter === 'All' || d.region === regionFilter;
      const dTime = d.date.getTime();
      const start = new Date(dateRange.start).getTime();
      const end = new Date(dateRange.end).getTime() + 86400000; 
      const matchDate = dTime >= start && dTime <= end;
      return matchRegion && matchDate;
    });
  }, [data, regionFilter, dateRange]);

  const kpis = useMemo(() => {
    return {
      totalSales: filteredData.reduce((acc, curr) => acc + curr.sales, 0),
      totalQuantity: filteredData.reduce((acc, curr) => acc + curr.quantity, 0),
      totalOrders: filteredData.length,
    };
  }, [filteredData]);

  const salesTrend = useMemo(() => {
    const agg: Record<string, number> = {};
    filteredData.forEach(d => {
      const dateStr = d.date.toISOString().split('T')[0];
      agg[dateStr] = (agg[dateStr] || 0) + d.sales;
    });
    return Object.entries(agg).map(([date, sales]) => ({ date, sales })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  const topProducts = useMemo(() => {
    const agg: Record<string, number> = {};
    filteredData.forEach(d => {
      agg[d.product] = (agg[d.product] || 0) + d.sales;
    });
    return Object.entries(agg)
      .map(([product, sales]) => ({ product, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  }, [filteredData]);

  const regionSales = useMemo(() => {
    const agg: Record<string, number> = {};
    filteredData.forEach(d => {
      agg[d.region] = (agg[d.region] || 0) + d.sales;
    });
    return Object.entries(agg)
      .map(([region, sales]) => ({ region, sales }))
      .sort((a, b) => b.sales - a.sales);
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 font-sans selection:bg-emerald-500/30">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[150px] opacity-50" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-white/5 pb-8 animate-in fade-in slide-in-from-top-8 duration-700">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold tracking-wide mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              LIVE ANALYTICS
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
              Sales Data Dashboard
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
              Upload your dataset to instantly generate beautiful, interactive insights and visualize your performance metrics in real-time.
            </p>
          </div>
          
          <div className="shrink-0 flex items-center">
            <label className="cursor-pointer group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative flex items-center gap-3 bg-zinc-900 border border-zinc-700/50 hover:border-emerald-500/50 px-6 py-4 rounded-xl transition-all duration-300 shadow-xl">
                <UploadCloud className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-bold text-zinc-200 group-hover:text-white">
                  {loading ? 'Processing...' : 'Upload CSV Dataset'}
                </span>
              </div>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 font-medium flex items-center gap-3 animate-in slide-in-from-top-4">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"></span>
            {error}
          </div>
        )}

        {data.length === 0 && !error && !loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 backdrop-blur-sm animate-in zoom-in-95 duration-500">
            <div className="w-28 h-28 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-full flex items-center justify-center mb-8 ring-1 ring-white/10 shadow-2xl">
              <UploadCloud className="w-12 h-12 text-zinc-500" />
            </div>
            <h3 className="text-3xl font-black text-zinc-200 mb-3 tracking-tight">Awaiting Data</h3>
            <p className="text-zinc-500 max-w-md text-lg">Upload a CSV file containing <span className="text-emerald-500/70 font-medium">Date, Sales, Quantity, Region,</span> and <span className="text-blue-500/70 font-medium">Product</span> columns to unlock insights.</p>
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row gap-6 bg-zinc-900/60 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-2xl items-center sticky top-6 z-50">
              <div className="flex items-center gap-3 text-zinc-300 font-bold pl-3 tracking-wide">
                <div className="p-2 bg-zinc-800 rounded-lg">
                  <Filter className="w-5 h-5 text-emerald-400" />
                </div>
                FILTERS
              </div>
              <div className="w-px h-10 bg-zinc-800 hidden md:block mx-2"></div>
              
              <div className="flex-1 w-full flex flex-col sm:flex-row gap-5">
                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1.5 px-1">Date Range</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-zinc-950/50 border border-zinc-800/80 text-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-inner"
                    />
                    <span className="text-zinc-600 font-medium">to</span>
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-zinc-950/50 border border-zinc-800/80 text-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex-1 sm:max-w-[280px] flex flex-col">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1.5 px-1">Region</label>
                  <select 
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-zinc-800/80 text-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all cursor-pointer appearance-none shadow-inner"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 16px center`, backgroundRepeat: `no-repeat`, backgroundSize: `16px 16px` }}
                  >
                    {regions.map(r => <option key={r} value={r} className="bg-zinc-900">{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <KPICards {...kpis} />
            
            <div className="pt-2">
              <Charts salesTrend={salesTrend} topProducts={topProducts} regionSales={regionSales} />
            </div>
            
            <div className="mt-12 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-8 py-6 border-b border-zinc-800/80 bg-zinc-900/80 flex items-center justify-between">
                <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
                  <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                  Recent Transactions
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-widest font-bold">
                      <th className="px-8 py-5 border-b border-zinc-800/50">Date</th>
                      <th className="px-8 py-5 border-b border-zinc-800/50">Product</th>
                      <th className="px-8 py-5 border-b border-zinc-800/50">Region</th>
                      <th className="px-8 py-5 border-b border-zinc-800/50 text-right">Quantity</th>
                      <th className="px-8 py-5 border-b border-zinc-800/50 text-right">Sales Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {filteredData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-800/40 transition-colors group">
                        <td className="px-8 py-5 whitespace-nowrap text-zinc-400 group-hover:text-zinc-300">{row.date.toISOString().split('T')[0]}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-zinc-200 font-medium">{row.product}</td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className="px-3 py-1.5 bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 rounded-md text-xs font-semibold tracking-wide">
                            {row.region}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-zinc-400 text-right">{row.quantity}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-emerald-400 font-bold text-right text-lg">
                          ${row.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
