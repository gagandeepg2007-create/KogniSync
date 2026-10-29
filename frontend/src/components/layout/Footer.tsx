import React from 'react';
import { ShieldCheck, Database, Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="font-semibold text-slate-800">
            KogniSync · Multi-Modal Travel Orchestration Platform
          </p>
          <p className="text-slate-500">
            Plan the journey. We'll synchronize the rest.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>PostgreSQL 16 (Port 5434)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>Redis 7 Distributed Holds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict Invariant Guarantees</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
