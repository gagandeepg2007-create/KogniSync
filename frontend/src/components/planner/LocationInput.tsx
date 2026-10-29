import React from 'react';
import { MapPin, ArrowRightLeft } from 'lucide-react';

interface LocationInputProps {
  origin: string;
  destination: string;
  onOriginChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
  onSwap?: () => void;
}

const COMMON_CITIES = [
  'Bangalore',
  'Chennai',
  'Mumbai',
  'Pune',
  'Delhi',
  'Jaipur',
  'Hyderabad',
  'Kochi',
];

export const LocationInput: React.FC<LocationInputProps> = ({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onSwap,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 w-full relative">
      {/* Origin */}
      <div className="w-full flex-1 relative">
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
          Origin
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
            <MapPin className="w-4 h-4" />
          </div>
          <input
            type="text"
            list="cities-origin"
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
            placeholder="e.g. Bangalore"
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors shadow-2xs"
          />
          <datalist id="cities-origin">
            {COMMON_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Swap Button */}
      {onSwap && (
        <button
          type="button"
          onClick={onSwap}
          className="mt-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-2xs"
          title="Swap origin and destination"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>
      )}

      {/* Destination */}
      <div className="w-full flex-1 relative">
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
          Destination
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-600">
            <MapPin className="w-4 h-4" />
          </div>
          <input
            type="text"
            list="cities-dest"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            placeholder="e.g. Chennai"
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors shadow-2xs"
          />
          <datalist id="cities-dest">
            {COMMON_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
};
