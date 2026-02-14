import React from 'react';
import type { KpiStats } from '@shared/schema';
import { Activity, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

interface KpiTilesProps {
  stats: KpiStats;
}

export function KpiTiles({ stats }: KpiTilesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Scanned */}
      <div className="card bg-gradient-teal p-6 text-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-[var(--shadow-strong)]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">Total Scanned</p>
            <h3 className="text-4xl font-bold font-display">{stats.total}</h3>
          </div>
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="mt-4 text-[10px] font-medium text-white/70 bg-black/10 inline-block px-2 py-1 rounded">
          Overall activity
        </div>
      </div>

      {/* Rejected */}
      <div className="card bg-gradient-pink p-6 text-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-[var(--shadow-strong)]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">Risk Detected</p>
            <h3 className="text-4xl font-bold font-display">{stats.rejected}</h3>
          </div>
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="mt-4 text-[10px] font-medium text-white/70 bg-black/10 inline-block px-2 py-1 rounded">
          Requires attention
        </div>
      </div>

      {/* Manual Review */}
      <div className="card bg-gradient-orange p-6 text-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-[var(--shadow-strong)]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">Manual Review</p>
            <h3 className="text-4xl font-bold font-display">{stats.manual}</h3>
          </div>
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <FileText className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="mt-4 text-[10px] font-medium text-white/70 bg-black/10 inline-block px-2 py-1 rounded">
          Pending analyst action
        </div>
      </div>

      {/* Approved */}
      <div className="card bg-gradient-green p-6 text-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-[var(--shadow-strong)]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">Verified Safe</p>
            <h3 className="text-4xl font-bold font-display">{stats.approved}</h3>
          </div>
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="mt-4 text-[10px] font-medium text-white/70 bg-black/10 inline-block px-2 py-1 rounded">
          98.5% accuracy rate
        </div>
      </div>
    </div>
  );
}
