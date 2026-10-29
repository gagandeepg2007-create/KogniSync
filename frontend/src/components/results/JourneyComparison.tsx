import React from 'react';
import { Journey } from '../../types/journey';
import { formatCurrency, formatDuration } from '../../lib/utils';
import { OptimizationBadge } from '../common/OptimizationBadge';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface JourneyComparisonProps {
  journeys: Journey[];
}

export const JourneyComparison: React.FC<JourneyComparisonProps> = ({ journeys }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 overflow-hidden flex flex-col gap-4 shadow-sm">
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
          Multi-Modal Trade-Off Matrix
        </h3>
        <p className="text-xs text-slate-500">
          Compare total cost, travel duration, and carbon footprint across alternative routes
        </p>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-mono">
              <th className="py-2.5 px-3">Option</th>
              <th className="py-2.5 px-3">Price</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Transfers</th>
              <th className="py-2.5 px-3">Emissions</th>
              <th className="py-2.5 px-3">Comfort</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {journeys.map((j) => (
              <tr
                key={j.id}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                onClick={() => navigate(`/plan/${j.id}`)}
              >
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <OptimizationBadge category={j.recommendationCategory} size="sm" />
                    <span className="font-semibold text-slate-800">{j.title}</span>
                  </div>
                </td>

                <td className="py-3 px-3 font-mono font-bold text-slate-900">
                  {formatCurrency(j.totalPrice, j.currency)}
                </td>

                <td className="py-3 px-3 font-mono font-medium text-slate-700">
                  {formatDuration(j.totalDurationMinutes)}
                </td>

                <td className="py-3 px-3 text-slate-600 font-mono">
                  {j.totalTransfers === 0 ? 'Direct (0)' : `${j.totalTransfers} transfer`}
                </td>

                <td className="py-3 px-3 font-mono text-teal-700 font-semibold">
                  {j.carbonKg} kg CO₂
                </td>

                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 font-mono text-purple-700 font-medium">
                    <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-purple-600 h-full rounded-full"
                        style={{ width: `${j.comfortScore * 10}%` }}
                      />
                    </div>
                    <span>{j.comfortScore}/10</span>
                  </div>
                </td>

                <td className="py-3 px-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/booking/${j.id}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all inline-flex items-center gap-1 shadow-2xs"
                  >
                    <span>Select</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
