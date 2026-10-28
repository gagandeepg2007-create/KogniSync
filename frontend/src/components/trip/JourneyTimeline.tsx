import React from 'react';
import { Trip } from '../../types/trip';
import { JourneySegmentCard } from './JourneySegmentCard';
import { TransferCard } from './TransferCard';
import { formatTime, formatDate } from '../../lib/utils';
import { Ticket } from 'lucide-react';

interface JourneyTimelineProps {
  trip: Trip;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ trip }) => {
  const { tickets, journey } = trip;

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5F2] shadow-sm p-5 sm:p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#071B49] flex items-center gap-2">
          <span>SYNCHRONIZED INTERMODAL TICKETS ({tickets.length})</span>
        </h3>
        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
          100% Guaranteed Seats
        </span>
      </div>

      {/* Synchronized Vertical Journey Timeline */}
      <div className="relative flex flex-col gap-3">
        {tickets.map((ticket, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === tickets.length - 1;

          return (
            <React.Fragment key={ticket.segmentId}>
              {/* Timeline item row */}
              <div className="flex items-start gap-4">
                {/* Left Timeline Rail (Visible on md+ screens) */}
                <div className="hidden md:flex flex-col items-center shrink-0 w-24 pt-2 text-right">
                  <span className="text-xs font-bold font-mono text-[#071B49]">
                    {formatTime(ticket.departureTime)}
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    {formatDate(ticket.departureTime)}
                  </span>
                  <span className="text-[11px] font-bold text-[#1769FF] truncate max-w-full">
                    {isFirst ? journey.origin.city : ticket.originName.split(' ')[0]}
                  </span>

                  {/* Vertical line indicator */}
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1769FF] ring-4 ring-blue-100 mt-2" />
                  <div className="w-0.5 h-16 bg-gradient-to-b from-blue-600 to-slate-300 my-1" />
                </div>

                {/* Right Segment Card */}
                <div className="flex-1 min-w-0">
                  <JourneySegmentCard ticket={ticket} index={idx} />
                </div>
              </div>

              {/* Inter-segment Transfer Card */}
              {!isLast && (
                <div className="flex items-center gap-4 pl-0 md:pl-28">
                  <div className="flex-1">
                    <TransferCard
                      durationMinutes={15}
                      transferStation={`${ticket.destinationName}`}
                      nextDepartureStation={`${tickets[idx + 1]?.originName}`}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom informational callout */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs text-[#52627A]">
        <Ticket className="w-4 h-4 text-[#1769FF] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          All tickets are confirmed and issued. You can view individual tickets, download PDFs, or access them via the QR code above.
        </p>
      </div>
    </div>
  );
};
