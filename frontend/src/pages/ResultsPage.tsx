import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchJourneys } from '../api/journey';
import { TravelRequest } from '../types/journey';
import { JourneyResults } from '../components/results/JourneyResults';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const origin = searchParams.get('origin') || 'Bangalore';
  const destination = searchParams.get('destination') || 'Chennai';
  const query = searchParams.get('q') || '';
  const date = searchParams.get('date') || 'Tomorrow';
  const arrivalBefore = searchParams.get('arrivalBefore') || '2:00 PM';
  const budgetMax = searchParams.get('budgetMax')
    ? parseInt(searchParams.get('budgetMax')!, 10)
    : undefined;
  const passengers = searchParams.get('passengers')
    ? parseInt(searchParams.get('passengers')!, 10)
    : 1;

  const costWeight = searchParams.get('costWeight')
    ? parseFloat(searchParams.get('costWeight')!)
    : 0.5;
  const durationWeight = searchParams.get('durationWeight')
    ? parseFloat(searchParams.get('durationWeight')!)
    : 0.25;
  const comfortWeight = searchParams.get('comfortWeight')
    ? parseFloat(searchParams.get('comfortWeight')!)
    : 0.15;
  const carbonWeight = searchParams.get('carbonWeight')
    ? parseFloat(searchParams.get('carbonWeight')!)
    : 0.1;

  const request: TravelRequest = {
    naturalLanguageQuery: query,
    origin,
    destination,
    departureDate: date,
    preferredArrivalBefore: arrivalBefore,
    budgetMax,
    passengersCount: passengers,
    weights: {
      cost: costWeight,
      duration: durationWeight,
      comfort: comfortWeight,
      carbon: carbonWeight,
    },
  };

  const {
    data: journeys = [],
    isLoading,
  } = useQuery({
    queryKey: ['journeys', origin, destination, query, budgetMax, date, costWeight],
    queryFn: () => searchJourneys(request),
    staleTime: 60000,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-3.5">
          <Link
            to="/"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs"
            title="Back to Journey Planner"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-display">
                {origin} → {destination}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200">
                {date} · Arrive before {arrivalBefore}
              </span>
              {budgetMax && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-semibold">
                  Budget: ₹{budgetMax}
                </span>
              )}
            </div>
            {query && (
              <p className="text-xs text-slate-500 italic truncate max-w-xl mt-1">
                "{query}"
              </p>
            )}
          </div>
        </div>

        {/* Edit Search Button */}
        <Link
          to="/"
          className="self-end md:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 shadow-2xs"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span>Edit Travel Request</span>
        </Link>
      </div>

      {/* Main Results Container */}
      <JourneyResults
        journeys={journeys}
        isLoading={isLoading}
        onModifySearch={() => navigate('/')}
      />
    </div>
  );
};
