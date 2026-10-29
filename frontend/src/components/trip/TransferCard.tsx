import React from 'react';
import { Footprints, ArrowDown } from 'lucide-react';

interface TransferCardProps {
  durationMinutes?: number;
  transferStation?: string;
  nextDepartureStation?: string;
  notes?: string;
}

export const TransferCard: React.FC<TransferCardProps> = ({
  durationMinutes = 15,
  transferStation = 'Chennai Central (MAS)',
  nextDepartureStation = 'Chennai Metro (CMRL)',
  notes = 'Concourse Level connection · Follow pedestrian signs for Metro Line 1',
}) => {
  return (
    <div className="relative flex items-center gap-3 py-1 px-4 my-0.5 rounded-xl bg-[#F8FAFC] border border-dashed border-[#CBD5E1] text-xs">
      <div className="w-8 h-8 rounded-full bg-slate-200/70 text-slate-600 flex items-center justify-center shrink-0">
        <Footprints className="w-4 h-4" />
      </div>

      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#071B49]">Transfer · {durationMinutes}m</span>
            <span className="text-[11px] text-slate-400 font-mono">buffer included</span>
          </div>
          <span className="text-[11px] text-[#64748B]">
            {transferStation} → {nextDepartureStation}
          </span>
        </div>

        <span className="text-[10px] text-slate-500 font-medium italic">
          {notes}
        </span>
      </div>

      <ArrowDown className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
    </div>
  );
};
