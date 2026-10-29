import React from 'react';
import { Clock, Route, CheckCircle2 } from 'lucide-react';
import { Trip } from '../../types/trip';
import { formatCurrency, formatDuration } from '../../lib/utils';

interface TripSummaryProps {
  trip: Trip;
}

export const TripSummary: React.FC<TripSummaryProps> = ({ trip }) => {
  const { journey } = trip;

  const modeNames = journey.modes
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
    .join(' + ');

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5F2] shadow-sm p-5 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#1769FF] flex items-center justify-center">
          <Route className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-[#071B49] font-display">Journey Summary</h3>
      </div>

      {/* 2x2 Metric Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Metric 1: Total Duration */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#1769FF] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#64748B] font-medium">Total Duration</span>
            <span className="text-sm font-bold text-[#071B49]">
              {formatDuration(journey.totalDurationMinutes)}
            </span>
          </div>
        </div>

        {/* Metric 2: Total Fare */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 font-bold text-sm">
            ₹
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#64748B] font-medium">Total Fare</span>
            <span className="text-sm font-bold text-[#071B49]">
              {formatCurrency(journey.totalPrice, journey.currency)}
            </span>
          </div>
        </div>

        {/* Metric 3: Transport Modes */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#1769FF] flex items-center justify-center shrink-0">
            <Route className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#64748B] font-medium">Transport Modes</span>
            <span className="text-sm font-bold text-[#071B49]">
              {journey.segments.length} ({modeNames})
            </span>
          </div>
        </div>

        {/* Metric 4: Booking Status */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#64748B] font-medium">Booking Status</span>
            <span className="text-sm font-bold text-[#059669]">Confirmed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
