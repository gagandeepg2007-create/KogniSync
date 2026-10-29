import React from 'react';
import { Link } from 'react-router-dom';
import { Trip } from '../../types/trip';
import { formatDate, formatDuration } from '../../lib/utils';
import {
  TripSuccessHero,
  TripSummary,
  JourneyTimeline,
  TripPass,
  AITripInsight,
  SystemVerification,
} from '../trip';
import { Download, Calendar, Headphones, ArrowRight } from 'lucide-react';

interface TripConfirmationProps {
  trip: Trip;
}

export const TripConfirmation: React.FC<TripConfirmationProps> = ({ trip }) => {
  const { journey, pnr, bookingId, qrCodeUrl } = trip;

  const handleDownloadPdf = () => {
    alert(`Downloading synchronized PDF travel pass for PNR ${pnr}...`);
  };

  const handleSyncCalendar = () => {
    alert(`All multi-modal legs synchronized with Google Calendar and Apple iCal.`);
  };

  return (
    <div className="w-full flex flex-col bg-[#F6F8FC] min-h-screen">
      {/* ──────────────────────────────────────────────────────────
          1. HERO SUCCESS BANNER WITH TRAVEL LANDSCAPE CONTEXT
         ────────────────────────────────────────────────────────── */}
      <TripSuccessHero pnr={pnr} />

      {/* ──────────────────────────────────────────────────────────
          2. MAIN TWO-COLUMN BODY CONTENT (MAX-W ~1150PX)
         ────────────────────────────────────────────────────────── */}
      <div className="max-w-[1150px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6">
        {/* ── LEFT COLUMN (65-70% width): Master Pass, Intermodal Tickets, AI Insight, Verification ── */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Master Booking Header Card */}
          <div className="bg-white rounded-2xl border border-[#DCE5F2] shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {/* Destination Thumbnail */}
              <div className="w-24 sm:w-28 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                <img
                  src="/images/home/bangalore-chennai.jpg"
                  alt={`${journey.origin.city} to ${journey.destination.city}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Booking Identifiers */}
              <div className="flex flex-col">
                <span className="text-[11px] font-mono font-bold tracking-wider text-[#64748B] uppercase">
                  BOOKING ID: {bookingId.toUpperCase()}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#071B49] font-display mt-0.5">
                  {journey.origin.city} → {journey.destination.city}
                </h2>
                <div className="flex items-center gap-2 text-xs text-[#52627A] font-medium mt-1">
                  <span>📅 {formatDate(journey.departureTime)}</span>
                  <span className="text-slate-300">·</span>
                  <span>⏱ {formatDuration(journey.totalDurationMinutes)} elapsed</span>
                </div>
              </div>
            </div>

            {/* QR Code and Quick Actions */}
            <div className="flex items-center gap-3.5 self-end sm:self-center shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-between sm:justify-start">
              {/* Scannable QR Code */}
              <div className="p-1.5 bg-white border border-[#DCE5F2] rounded-xl shadow-2xs shrink-0">
                <img
                  src={qrCodeUrl}
                  alt={`QR for ${pnr}`}
                  className="w-16 h-16 sm:w-18 sm:h-18 object-contain"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 text-xs text-[#071B49] hover:text-[#1769FF] px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-[#DCE5F2] transition-colors font-semibold shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncCalendar}
                  className="inline-flex items-center gap-1.5 text-xs text-[#1769FF] hover:text-[#1258DB] px-3 py-1.5 rounded-lg bg-[#EBF2FF] hover:bg-[#DDEBFF] border border-blue-200 transition-colors font-semibold cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Sync Cal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Synchronized Intermodal Tickets & Connected Timeline */}
          <div id="tickets-section">
            <JourneyTimeline trip={trip} />
          </div>

          {/* AI Trip Insight Card ("Why this journey?") */}
          <AITripInsight trip={trip} />

          {/* System Verification Panel (Hackathon technical proof) */}
          <SystemVerification />
        </div>

        {/* ── RIGHT COLUMN (30-35% width): Journey Summary, Trip Pass, Support, Actions ── */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-5">
          {/* Journey Summary 2x2 metrics */}
          <TripSummary trip={trip} />

          {/* Trip Pass Card with Actions */}
          <TripPass
            trip={trip}
            onDownloadPdf={handleDownloadPdf}
          />

          {/* Need Help? / Support Card */}
          <div className="bg-white rounded-2xl border border-[#DCE5F2] shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 shadow-2xs">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-bold text-[#071B49] font-display">Need help?</h4>
                <p className="text-xs text-[#52627A] leading-relaxed mt-0.5">
                  If you face any issues during your journey, our support team is here to help.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert(`Calling KogniSync 24x7 Priority Support: ${trip.supportHotline}`)}
              className="mt-1 self-start inline-flex items-center gap-1 text-xs font-semibold text-[#1769FF] hover:text-[#1258DB] transition-colors"
            >
              <span>Contact Support</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Plan Another Journey CTA */}
          <Link
            to="/"
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-[#DCE5F2] text-xs font-bold text-[#071B49] flex items-center justify-center gap-2 shadow-2xs transition-colors"
          >
            <span>Plan Another Journey</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TripConfirmation;
