import React from 'react';
import { Trip } from '../../types/trip';
import { Download, Share2, Ticket, ArrowRight } from 'lucide-react';

interface TripPassProps {
  trip: Trip;
  onDownloadPdf?: () => void;
  onShare?: () => void;
}

export const TripPass: React.FC<TripPassProps> = ({ trip, onDownloadPdf, onShare }) => {
  const { pnr } = trip;

  const handleDownload = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
    } else {
      alert(`Generating unified PDF Travel Pass for PNR ${pnr}...`);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      navigator.share({
        title: `KogniSync Travel Pass: ${trip.journey.origin.city} to ${trip.journey.destination.city}`,
        text: `My synchronized journey from ${trip.journey.origin.city} to ${trip.journey.destination.city} is confirmed! Master PNR: ${pnr}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Trip URL copied to clipboard!');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5F2] shadow-sm p-5 flex flex-col gap-4">
      {/* Luggage Graphic / Ready Callout */}
      <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#F0F7FF] border border-[#DCE5F2]/80">
        <div className="w-12 h-12 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs flex items-center justify-center shrink-0 text-[#1769FF]">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="5" y="6" rx="2" fill="#EBF2FF" />
            <path d="M9 6V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
            <path d="M10 10v6" />
            <path d="M14 10v6" />
            <circle cx="8" cy="21" r="1" />
            <circle cx="16" cy="21" r="1" />
          </svg>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-bold text-[#071B49] font-display">
            Your travel pass is ready!
          </span>
          <span className="text-[11px] text-[#52627A] leading-snug mt-0.5">
            Show the QR code or booking ID at respective stations. All tickets are linked to this journey.
          </span>
        </div>
      </div>

      {/* Primary CTA: Download Travel Pass */}
      <button
        type="button"
        onClick={handleDownload}
        className="w-full py-2.5 px-4 rounded-xl bg-[#1769FF] hover:bg-[#1258DB] text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download Travel Pass</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Secondary Actions: View Individual Tickets + Share Trip */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('tickets-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="py-2 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#DCE5F2] text-xs font-semibold text-[#071B49] flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <Ticket className="w-3.5 h-3.5 text-slate-500" />
          <span>View Tickets</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="py-2 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#DCE5F2] text-xs font-semibold text-[#071B49] flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Share Trip</span>
        </button>
      </div>
    </div>
  );
};
