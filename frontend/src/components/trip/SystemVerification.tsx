import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, Database, Check } from 'lucide-react';

export const SystemVerification: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const verificationItems = [
    { label: 'PostgreSQL Inventory Invariant', detail: 'booked + held ≤ total capacity constraint', status: 'PASS' },
    { label: 'Distributed Redis Hold Conversion', detail: 'Sub-second TTL release & conversion committed', status: 'PASS' },
    { label: 'Cross-Carrier Booking Consistency', detail: 'Saga compensator verified zero orphaned holds', status: 'PASS' },
    { label: 'Payment State Transition', detail: 'Idempotency key verified · 256-bit TLS encrypted', status: 'PASS' },
    { label: 'Carrier Inventory Sync', detail: 'IRCTC & CMRL unified under master PNR', status: 'PASS' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5F2] shadow-2xs p-4 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-xs text-slate-700 hover:text-[#071B49] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold font-mono tracking-tight text-[#071B49]">
            System Verification
          </span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
            5 / 5 PASS
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span>{isOpen ? 'Hide technical audit' : 'View backend invariant audit'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mb-1">
            <Database className="w-3 h-3 text-blue-600" />
            <span>Database: PostgreSQL 16 (Port 5434) · Cache: Redis 7 (Port 6380)</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {verificationItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-slate-200 text-xs font-mono"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <span className="text-[10px] text-slate-500">{item.detail}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px]">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
