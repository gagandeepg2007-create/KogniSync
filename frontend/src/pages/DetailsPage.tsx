import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getJourneyById } from '../api/journey';
import { JourneyTimeline } from '../components/details/JourneyTimeline';
import { JourneyMap } from '../components/details/JourneyMap';
import { AIRecommendationExplanation } from '../components/details/AIRecommendationExplanation';
import { OptimizationBadge } from '../components/common/OptimizationBadge';
import { formatCurrency, formatDuration } from '../lib/utils';
import { ArrowLeft, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const DetailsPage: React.FC = () => {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();

  const {
    data: journey,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['journey', journeyId],
    queryFn: () => getJourneyById(journeyId || ''),
    enabled: !!journeyId,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-blue-600/20 border-t-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-700">
          Loading synchronized journey details...
        </p>
      </div>
    );
  }

  if (isError || !journey) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900">Journey Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested multi-modal itinerary does not exist or has expired.
        </p>
        <Link
          to="/plan"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
        >
          Back to Results
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-8">
      {/* Back button & Title summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <OptimizationBadge category={journey.recommendationCategory} size="sm" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 font-display">
                {journey.title}
              </h1>
            </div>
            <span className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
              {journey.origin.city} → {journey.destination.city} ·{' '}
              {formatDuration(journey.totalDurationMinutes)} total duration
            </span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="flex flex-col items-end">
            <span className="text-2xl sm:text-3xl font-black font-display text-slate-900">
              {formatCurrency(journey.totalPrice, journey.currency)}
            </span>
            <span className="text-[11px] text-slate-500">
              Complete journey fare
            </span>
          </div>

          <button
            onClick={() => navigate(`/booking/${journey.id}`)}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-98"
          >
            <span>Select Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Timeline & AI explanation; Right Map & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column (7 cols): AI Explanation & Timeline */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <AIRecommendationExplanation journey={journey} />
          <JourneyTimeline journey={journey} />
        </div>

        {/* Right column (5 cols): Map & Invariants metadata */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <JourneyMap segments={journey.segments} />

          {/* Concurrency Invariant Card */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                Hold Invariant Guarantee
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When you proceed, KogniSync atomically reserves capacity across all{' '}
              {journey.segments.length} carriers simultaneously. If any segment hold expires or rejects,
              the saga compensator rolls back previous holds without charging you.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Hold TTL: 600 seconds (10 mins)</span>
              <span>Backend: PostgreSQL + Redis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
