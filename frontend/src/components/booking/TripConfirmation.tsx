import React from 'react';
import { Trip } from '../../types/trip';
import { ModeIcon } from '../common/ModeIcon';
import { formatCurrency, formatDuration, formatTime, formatDate } from '../../lib/utils';
import { CheckCircle2, Download, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TripConfirmationProps {
  trip: Trip;
}

export const TripConfirmation: React.FC<TripConfirmationProps> = ({ trip }) => {
  const { journey, passengers, tickets, payment, pnr } = trip;

  const handleDownloadPass = () => {
    alert(`Downloading Unified Travel Pass for PNR ${pnr}...`);
  };

  const handleCalendarSync = () => {
    alert(`Journey synchronized with Google Calendar and Apple iCal.`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Success Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200 bg-emerald-50/60 text-center flex flex-col items-center gap-3 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold">
            Orchestration Succeeded · Invariants Preserved
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 font-display">
            Your journey is synchronized.
          </h1>
          <p className="text-slate-600 text-sm max-w-lg">
            All inventory holds across transit providers have been permanently converted into verified bookings.
          </p>
        </div>

        {/* PNR Code Pill */}
        <div className="mt-2 flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 font-mono text-sm shadow-xs">
          <span className="text-slate-500">Master PNR:</span>
          <strong className="text-slate-900 text-base tracking-wider font-bold">{pnr}</strong>
        </div>
      </div>

      {/* Main Unified Boarding Pass Card */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col">
        {/* Pass Top Bar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Booking ID: {trip.bookingId}
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-display">
              {journey.origin.city} → {journey.destination.city}
            </span>
            <span className="text-xs text-slate-600 font-medium">
              {formatDate(journey.departureTime)} · {formatDuration(journey.totalDurationMinutes)} elapsed
            </span>
          </div>

          {/* QR Code and Quick actions */}
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0">
              <img
                src={trip.qrCodeUrl}
                alt={`QR for ${pnr}`}
                className="w-20 h-20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleDownloadPass}
                className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 transition-colors font-semibold shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PDF</span>
              </button>
              <button
                onClick={handleCalendarSync}
                className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors font-semibold"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Sync Cal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Individual Segment Tickets Roster */}
        <div className="p-6 flex flex-col gap-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            Synchronized Intermodal Tickets ({tickets.length})
          </h3>

          <div className="flex flex-col gap-3">
            {tickets.map((tkt) => (
              <div
                key={tkt.segmentId}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left info */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 mt-0.5 shadow-2xs">
                    <ModeIcon mode={tkt.mode} size={18} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {tkt.provider}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 font-semibold shadow-2xs">
                        {tkt.ticketNumber}
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 mt-0.5 font-medium">
                      {tkt.originName} → {tkt.destinationName}
                    </span>
                    <span className="text-[11px] font-mono text-blue-700 font-bold mt-1">
                      {formatTime(tkt.departureTime)} - {formatTime(tkt.arrivalTime)}
                    </span>
                  </div>
                </div>

                {/* Right seat & gate allocations */}
                <div className="flex flex-col md:items-end justify-center text-xs font-mono">
                  {tkt.seatOrBerth && (
                    <span className="text-emerald-700 font-bold">
                      {tkt.seatOrBerth}
                    </span>
                  )}
                  {tkt.gateOrPlatform && (
                    <span className="text-slate-600 font-medium">
                      {tkt.gateOrPlatform}
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5">
                    ● {tkt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Passenger Roster */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              Travelers
            </span>
            <div className="flex flex-wrap gap-2">
              {passengers.map((pax) => (
                <div
                  key={pax.id}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-center gap-2"
                >
                  <span className="font-semibold">{pax.fullName}</span>
                  {pax.age && (
                    <span className="text-slate-500 font-mono">({pax.age}y, {pax.gender})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment receipt footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 font-mono">
            <div>
              <span>Payment Ref: </span>
              <strong className="text-slate-900">{payment.transactionRef}</strong> (via {payment.method.toUpperCase()})
            </div>
            <div>
              <span>Amount Paid: </span>
              <strong className="text-emerald-700 text-sm font-bold">
                {formatCurrency(payment.amount, payment.currency)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Home */}
      <div className="flex items-center justify-between pt-2">
        <Link
          to="/"
          className="text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors"
        >
          ← Plan Another Journey
        </Link>
        <span className="text-xs font-mono text-slate-500">
          Support: {trip.supportHotline}
        </span>
      </div>
    </div>
  );
};
