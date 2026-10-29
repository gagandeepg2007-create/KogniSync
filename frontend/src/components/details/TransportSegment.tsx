import React from 'react';
import { JourneySegment } from '../../types/journey';
import { ModeIcon } from '../common/ModeIcon';
import { formatCurrency, formatDuration, formatTime } from '../../lib/utils';
import { Clock, ShieldCheck, AlertCircle, Info } from 'lucide-react';

interface TransportSegmentProps {
  segment: JourneySegment;
  index: number;
  totalSegments: number;
}

export const TransportSegment: React.FC<TransportSegmentProps> = ({
  segment,
  index,
  totalSegments,
}) => {
  return (
    <div className="relative flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs">
      {/* Segment Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <ModeIcon mode={segment.mode} showBadge size={14} />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">
              {segment.provider}
            </span>
            {segment.vehicleNumber && (
              <span className="text-[11px] font-mono text-slate-500">
                {segment.vehicleName} · {segment.vehicleNumber}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-base font-bold font-mono text-slate-900">
            {formatCurrency(segment.price, segment.currency)}
          </span>
          {segment.seatClass && (
            <span className="text-[11px] text-blue-700 font-semibold">
              {segment.seatClass}
            </span>
          )}
        </div>
      </div>

      {/* Transit endpoints: Origin -> Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
        {/* Departure */}
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0 ring-4 ring-blue-100" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">
              Departure · {formatTime(segment.departureTime)}
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {segment.origin.name}
            </span>
            <span className="text-xs text-slate-500">
              {segment.origin.city} ({segment.origin.type.replace('_', ' ')})
            </span>
          </div>
        </div>

        {/* Arrival */}
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1.5 shrink-0 ring-4 ring-emerald-100" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">
              Arrival · {formatTime(segment.arrivalTime)}
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {segment.destination.name}
            </span>
            <span className="text-xs text-slate-500">
              {segment.destination.city} ({segment.destination.type.replace('_', ' ')})
            </span>
          </div>
        </div>
      </div>

      {/* Segment Telemetry Bar: Distance, Duration, Carbon & Availability */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {formatDuration(segment.durationMinutes)}
          </span>
          <span>·</span>
          <span>{segment.distanceKm} km</span>
          <span>·</span>
          <span className="text-teal-700 font-semibold">{segment.carbonKg} kg CO₂</span>
        </div>

        {/* Availability tag */}
        <div className="flex items-center gap-1.5">
          {segment.availability.status === 'available' ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {segment.availability.remainingUnits
                ? `${segment.availability.remainingUnits} seats available`
                : 'Available'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Limited Units
            </span>
          )}
        </div>
      </div>

      {/* Notes or instructions */}
      {segment.notes && (
        <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{segment.notes}</span>
        </div>
      )}

      {/* Inter-segment transfer buffer notice */}
      {index < totalSegments - 1 && segment.transferBufferMinutes && (
        <div className="mt-1 flex items-center gap-2 text-xs text-amber-900 font-mono bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          <span>Transfer buffer: {segment.transferBufferMinutes} mins at {segment.destination.name}</span>
        </div>
      )}
    </div>
  );
};
