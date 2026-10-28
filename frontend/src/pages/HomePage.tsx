import React from 'react';
import { JourneyPlanner } from '../components/planner/JourneyPlanner';
import { ShieldCheck, Sparkles, Network } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-16 py-8 sm:py-14">
      {/* Hero with Journey Planner */}
      <section className="relative px-4 sm:px-6 lg:px-8">
        <JourneyPlanner />
      </section>

      {/* Feature Pillar Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center flex flex-col items-center gap-2 mb-10">
          <span className="text-xs uppercase font-mono tracking-wider text-blue-700 font-bold">
            How KogniSync Reinvents Travel Orchestration
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-display">
            Beyond Isolated Flight & Train Search
          </h2>
          <p className="text-sm text-slate-600 max-w-xl">
            Legacy engines search one transport silo at a time. KogniSync extracts your intent, chains intermodal legs, and guarantees seat availability across vendors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Multi-Modal Interline Synthesis
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chains cabs, high-speed rail, air shuttles, and metro rapid transit into single coherent journeys with calculated intermodal transfer buffers.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Concurrency-Safe Distributed Holds
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Backed by PostgreSQL strict inventory invariants (<code className="text-emerald-800 font-mono text-[11px] font-bold">booked + held &le; total</code>) and sub-second Redis locks to prevent race conditions.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Pareto Trade-Off Intelligence
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ranks journeys through dynamic multi-objective weights (cost, duration, comfort, carbon footprint), providing transparent explanations for every recommendation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
