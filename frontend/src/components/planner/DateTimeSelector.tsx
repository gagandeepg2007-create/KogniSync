import React from 'react';
import { Calendar, Clock, Users } from 'lucide-react';

interface DateTimeSelectorProps {
  date: string;
  onDateChange: (val: string) => void;
  arrivalBefore?: string;
  onArrivalBeforeChange: (val: string) => void;
  passengers: number;
  onPassengersChange: (val: number) => void;
}

export const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  date,
  onDateChange,
  arrivalBefore = '',
  onArrivalBeforeChange,
  passengers,
  onPassengersChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
      {/* Date */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
          Travel Date
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Calendar className="w-4 h-4" />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Arrival Before */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
          Arrive Before (Optional)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Clock className="w-4 h-4" />
          </div>
          <input
            type="time"
            value={arrivalBefore}
            onChange={(e) => onArrivalBeforeChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Passengers */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
          Travelers
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Users className="w-4 h-4" />
          </div>
          <select
            value={passengers}
            onChange={(e) => onPassengersChange(parseInt(e.target.value, 10))}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors cursor-pointer shadow-2xs"
          >
            <option value={1}>1 Traveler</option>
            <option value={2}>2 Travelers</option>
            <option value={3}>3 Travelers</option>
            <option value={4}>4 Travelers</option>
          </select>
        </div>
      </div>
    </div>
  );
};
