import React from 'react';
import { Sparkles, TrendingDown, Clock, CheckCircle2 } from 'lucide-react';
import { Journey } from '../../types/journey';
import { formatCurrency } from '../../lib/utils';

interface AIRecommendationExplanationProps {
  journey: Journey;
}

export const AIRecommendationExplanation: React.FC<AIRecommendationExplanationProps> = ({
  journey,
}) => {
  const { aiExplanation } = journey;

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-slate-50 p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-display">
              AI Recommendation Explanation
            </h4>
            <span className="text-[11px] text-slate-500">
              Evaluated against multi-objective Pareto trade-off criteria
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-xs font-mono font-bold text-blue-800">
          <span>Match Score: {aiExplanation.score}/100</span>
        </div>
      </div>

      {/* Primary rank reasoning headline */}
      <div className="text-sm font-bold text-blue-900 leading-snug">
        {aiExplanation.rankReason}
      </div>

      <p className="text-xs text-slate-700 leading-relaxed">
        {aiExplanation.summary}
      </p>

      {/* Trade-off Callouts */}
      {aiExplanation.costVsFastestSaving !== undefined && aiExplanation.costVsFastestSaving > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
          <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center gap-3 shadow-2xs">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium">Cost Savings</span>
              <span className="text-sm font-bold font-mono text-emerald-800">
                Saves {formatCurrency(aiExplanation.costVsFastestSaving, journey.currency)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-2xs">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium">Time Difference vs Air Transit</span>
              <span className="text-sm font-bold font-mono text-slate-800">
                +{Math.round((aiExplanation.durationDiffMinutes || 0) / 60)}h{' '}
                {(aiExplanation.durationDiffMinutes || 0) % 60}m
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bulleted trade-offs */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Trade-Off Invariants:
        </span>
        <div className="flex flex-col gap-1">
          {aiExplanation.tradeOffs.map((tradeOff, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>{tradeOff}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
