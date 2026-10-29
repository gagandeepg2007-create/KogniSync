import React from 'react';
import { TripSegmentTicket } from '../../types/trip';
import { ModeIcon } from '../common/ModeIcon';
import { formatTime } from '../../lib/utils';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface JourneySegmentCardProps {
  ticket: TripSegmentTicket;
  index: number;
}

export const JourneySegmentCard: React.FC<JourneySegmentCardProps> = ({ ticket, index }) => {
  const segmentNumber = String(index + 1).padStart(2, '0');

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5F2] hover:border-[#1769FF]/40 shadow-xs p-4 sm:p-5 flex flex-col gap-3 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Mode Icon + Segment Index + Provider */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#DCE5F2] flex items-center justify-center shrink-0 text-[#1769FF]">
            <ModeIcon mode={ticket.mode} size={18} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {segmentNumber} · {ticket.mode.toUpperCase()}
              </span>
              <h4 className="text-sm font-bold text-[#071B49] truncate font-display">
                {ticket.provider}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F1F5F9] text-slate-600 border border-slate-200">
                {ticket.ticketNumber}
              </span>
            </div>

            {/* Route */}
            <span className="text-xs font-semibold text-[#071B49] mt-1">
              {ticket.originName} → {ticket.destinationName}
            </span>

            {/* Timings */}
            <span className="text-[11px] text-[#64748B] font-mono mt-0.5">
              {formatTime(ticket.departureTime)} → {formatTime(ticket.arrivalTime)}
            </span>
          </div>
        </div>

        {/* Right: Status + Platform & Seat */}
        <div className="flex items-center sm:items-end justify-between sm:justify-start gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="flex flex-col sm:items-end">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[11px] font-bold font-mono border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-[#059669]" />
              CONFIRMED
            </span>

            {ticket.seatOrBerth && (
              <span className="text-xs font-semibold text-[#071B49] mt-1">
                {ticket.seatOrBerth}
              </span>
            )}

            {ticket.gateOrPlatform && (
              <span className="text-[11px] text-[#64748B] font-medium">
                {ticket.gateOrPlatform}
              </span>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block" />
        </div>
      </div>
    </div>
  );
};
