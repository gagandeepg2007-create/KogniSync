import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, ShieldCheck, Sparkles, Leaf } from 'lucide-react';
import { Journey } from '../../types/journey';
import { ModeIcon } from '../common/ModeIcon';
import { OptimizationBadge } from '../common/OptimizationBadge';
import { formatCurrency, formatDuration, formatTime } from '../../lib/utils';

interface JourneyCardProps {
  journey: Journey;
  isFeatured?: boolean;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({ journey, isFeatured = false }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isFeatured
          ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500/20'
          : 'bg-white hover:bg-slate-50/50 border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Top Banner: Recommendation badge & AI match score */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <OptimizationBadge category={journey.recommendationCategory} size="sm" />
          <span className="text-xs font-bold text-slate-800 truncate">
            {journey.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-semibold">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Score: {journey.aiExplanation.score}/100</span>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Departure, timeline graphic & arrival */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Origin & Departure */}
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatTime(journey.departureTime)}
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {journey.origin.name}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {journey.origin.city}
            </span>
          </div>

          {/* Duration & Transfers Graphic */}
          <div className="flex-1 max-w-xs flex flex-col items-center px-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mb-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatDuration(journey.totalDurationMinutes)}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600">
                {journey.totalTransfers === 0
                  ? 'Direct'
                  : `${journey.totalTransfers} transfer${journey.totalTransfers > 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Segment route line */}
            <div className="w-full flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-600 relative flex items-center justify-center">
                {/* Mode icons along the line */}
                <div className="bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs flex items-center gap-2">
                  {journey.modes.map((mode, i) => (
                    <React.Fragment key={i}>
                      <ModeIcon mode={mode} size={12} />
                      {i < journey.modes.length - 1 && (
                        <span className="text-[10px] text-slate-400 font-bold">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
            </div>

            {/* Providers summary */}
            <span className="text-[10px] text-slate-500 font-medium mt-1 truncate max-w-full">
              {journey.segments.map((s) => s.provider).join(' → ')}
            </span>
          </div>

          {/* Destination & Arrival */}
          <div className="flex flex-col sm:items-end">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatTime(journey.arrivalTime)}
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {journey.destination.name}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {journey.destination.city}
            </span>
          </div>
        </div>

        {/* AI rationale snippet */}
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-slate-900">
              {journey.aiExplanation.rankReason}
            </span>
            <span className="text-slate-600">{journey.aiExplanation.summary}</span>
          </div>
        </div>

        {/* Bottom bar: Pricing, Carbon, Feasibility & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold font-display text-slate-900">
                {formatCurrency(journey.totalPrice, journey.currency)}
              </span>
              <span className="text-[11px] text-slate-500">
                Total fare · All segments
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            {/* Environmental & hold telemetry */}
            <div className="flex flex-col gap-0.5 text-xs text-slate-600 font-mono">
              <div className="flex items-center gap-1.5 text-teal-700 font-semibold">
                <Leaf className="w-3.5 h-3.5" />
                <span>{journey.carbonKg} kg CO₂</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Holdable (10m TTL)</span>
              </div>
            </div>
          </div>

          {/* Action buttons: View Journey and Select Journey */}
          <div className="flex items-center gap-2.5">
            <Link
              to={`/plan/${journey.id}`}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-xs border border-slate-200 transition-colors"
            >
              View Journey
            </Link>

            <button
              onClick={() => navigate(`/booking/${journey.id}`)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>Select Journey</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
