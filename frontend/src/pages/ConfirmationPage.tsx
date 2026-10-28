import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTripById } from '../api/trips';
import { TripConfirmation } from '../components/booking/TripConfirmation';
import { Loader2, AlertCircle } from 'lucide-react';

export const ConfirmationPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();

  const {
    data: trip,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => getTripById(tripId || ''),
    enabled: !!tripId,
  });

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <h3 className="text-base font-bold text-slate-900">
          Fetching Unified Trip Confirmation...
        </h3>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900">Trip Not Found</h2>
        <p className="text-xs text-slate-500">
          We could not locate this itinerary confirmation record.
        </p>
        <Link
          to="/"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
        >
          Return to Planner
        </Link>
      </div>
    );
  }

  return <TripConfirmation trip={trip} />;
};
