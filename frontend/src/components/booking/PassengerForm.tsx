import React from 'react';
import { Passenger } from '../../types/booking';
import { User, Mail, Phone, Plus, Trash2 } from 'lucide-react';

interface PassengerFormProps {
  passengers: Passenger[];
  onChange: (passengers: Passenger[]) => void;
  contactEmail: string;
  onContactEmailChange: (val: string) => void;
  contactPhone: string;
  onContactPhoneChange: (val: string) => void;
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
  passengers,
  onChange,
  contactEmail,
  onContactEmailChange,
  contactPhone,
  onContactPhoneChange,
}) => {
  const handleUpdatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddPassenger = () => {
    onChange([
      ...passengers,
      {
        id: `pax-${passengers.length + 1}`,
        fullName: '',
        email: contactEmail,
        phone: contactPhone,
        age: 28,
        gender: 'male',
      },
    ]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    onChange(passengers.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Primary Contact Details */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
          Contact Details for Unified Pass
        </h3>
        <p className="text-xs text-slate-500">
          Where should we send your synchronized boarding passes, PNR codes, and live schedule telemetry?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto" />
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => onContactEmailChange(e.target.value)}
                placeholder="your.name@example.com"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Mobile Phone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto" />
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => onContactPhoneChange(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Passenger List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
            Traveler Details ({passengers.length})
          </h3>
          <button
            type="button"
            onClick={handleAddPassenger}
            className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 font-semibold px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Passenger</span>
          </button>
        </div>

        {passengers.map((pax, idx) => (
          <div
            key={pax.id}
            className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-3 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 font-mono">
                Passenger {idx + 1}
              </span>
              {passengers.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePassenger(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                  title="Remove passenger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name (as per Govt ID)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto" />
                  <input
                    type="text"
                    required
                    value={pax.fullName}
                    onChange={(e) => handleUpdatePassenger(idx, 'fullName', e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Age & Gender
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={pax.age || ''}
                    onChange={(e) =>
                      handleUpdatePassenger(idx, 'age', parseInt(e.target.value, 10))
                    }
                    placeholder="Age"
                    className="w-20 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                  />
                  <select
                    value={pax.gender || 'male'}
                    onChange={(e) => handleUpdatePassenger(idx, 'gender', e.target.value as any)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
