import React from 'react';
import { DollarSign, Package, FileText } from 'lucide-react';

interface KPIProps {
  totalSales: number;
  totalQuantity: number;
  totalOrders: number;
}

export default function KPICards({ totalSales, totalQuantity, totalOrders }: KPIProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
      <div className="bg-white/10 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800/80 p-6 rounded-3xl shadow-2xl transition-all hover:-translate-y-1 hover:shadow-emerald-500/10 duration-500 group relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Sales</p>
            <h3 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400 mt-2">
              ${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="bg-white/10 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800/80 p-6 rounded-3xl shadow-2xl transition-all hover:-translate-y-1 hover:shadow-blue-500/10 duration-500 group relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Quantity</p>
            <h3 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-400 mt-2">
              {totalQuantity.toLocaleString()}
            </h3>
          </div>
          <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white/10 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800/80 p-6 rounded-3xl shadow-2xl transition-all hover:-translate-y-1 hover:shadow-purple-500/10 duration-500 group relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Orders</p>
            <h3 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-400 mt-2">
              {totalOrders.toLocaleString()}
            </h3>
          </div>
          <div className="p-4 bg-purple-500/10 rounded-2xl group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
