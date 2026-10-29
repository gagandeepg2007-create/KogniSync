import React from 'react';
import { Sparkles, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { Trip } from '../../types/trip';
import { formatCurrency } from '../../lib/utils';

interface AITripInsightProps {
  trip: Trip;
}

export const AITripInsight: React.FC<AITripInsightProps> = ({ trip }) => {
  const { journey } = trip;
  const { aiExplanation } = journey;

  return (
    <div className="bg-gradient-to-br from-blue-50/70 via-white to-slate-50 rounded-2xl border border-blue-200 shadow-sm p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1769FF] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#071B49] font-display">
              Why this journey?
            </h4>
            <span className="text-[11px] text-[#64748B]">
              AI multi-objective Pareto optimization rationale
            </span>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-800 font-bold border border-blue-200">
          Match Score: {aiExplanation.score}/100
        </span>
      </div>

      {/* Rationale text */}
      <p className="text-xs text-[#071B49] leading-relaxed font-medium">
        {aiExplanation.summary ||
          'KogniSync selected this itinerary because it matched your preference for lower cost while still meeting your arrival deadline. The synchronized train + metro combination reduced the total fare while maintaining a practical transfer buffer.'}
      </p>

      {/* Trade-off Metrics Snippets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {aiExplanation.costVsFastestSaving !== undefined && aiExplanation.costVsFastestSaving > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-emerald-200 text-xs shadow-2xs">
            <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-600 text-[11px]">
              Fare Savings:{' '}
              <strong className="text-emerald-700 font-bold">
                {formatCurrency(aiExplanation.costVsFastestSaving, journey.currency)}
              </strong>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs">
          <Clock className="w-4 h-4 text-[#1769FF] shrink-0" />
          <span className="text-slate-600 text-[11px]">
            Connection Buffer:{' '}
            <strong className="text-slate-800 font-bold">15m Safe Transfer</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Pre-calculated intermodal buffers guarantee on-time arrival across carriers.</span>
      </div>
    </div>
  );
};
