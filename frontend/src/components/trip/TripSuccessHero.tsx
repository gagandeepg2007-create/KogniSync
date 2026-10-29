import React, { useState } from 'react';
import { Check, Copy, CheckCheck, MapPin } from 'lucide-react';

interface TripSuccessHeroProps {
  pnr: string;
}

export const TripSuccessHero: React.FC<TripSuccessHeroProps> = ({ pnr }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPnr = () => {
    navigator.clipboard.writeText(pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full overflow-hidden bg-slate-100 min-h-[380px] sm:min-h-[420px] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Full-width Scenic Background Composite */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-no-repeat bg-[center_top] pointer-events-none"
        style={{
          backgroundImage: "url('/images/home/hero-composite.jpg')",
        }}
      />

      {/* Soft light overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.7) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.7) 80%, rgba(255,255,255,0.92) 100%)',
        }}
      />

      {/* Airplane in upper-right sky */}
      <div className="hidden lg:block absolute right-16 top-8 pointer-events-none z-10 select-none">
        <img
          src="/images/home/airplane.png"
          alt="Airplane flying toward Chennai"
          className="w-32 lg:w-40 drop-shadow-sm transform -rotate-1 opacity-90"
        />
      </div>

      {/* Dotted flight trajectory curve */}
      <svg
        className="hidden lg:block absolute right-20 top-20 w-36 h-36 pointer-events-none z-10 opacity-50"
        viewBox="0 0 160 140"
        fill="none"
      >
        <path
          d="M 130 120 C 100 80, 80 40, 20 15"
          stroke="#9A3412"
          strokeWidth="1.6"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Bangalore Label on Left */}
      <div className="hidden md:flex absolute left-8 lg:left-14 bottom-8 lg:bottom-12 z-20 flex-col items-start select-none">
        <div className="flex items-center gap-1.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-xs">
            <MapPin className="w-3 h-3 text-[#071B49] fill-[#071B49]" />
          </div>
          <span className="font-bold text-sm tracking-wide">Bangalore</span>
        </div>
        <p className="font-script italic text-white text-base lg:text-lg leading-tight ml-5 mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
          A city that<br />keeps you moving
        </p>
      </div>

      {/* Chennai Label on Right */}
      <div className="hidden md:flex absolute right-8 lg:right-16 bottom-8 lg:bottom-12 z-20 flex-col items-start select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shadow-xs">
            <MapPin className="w-3 h-3 text-[#DC2626] fill-[#DC2626]" />
          </div>
          <span className="font-bold text-sm tracking-wide text-[#7F1D1D]">Chennai</span>
        </div>
        <p className="font-script italic text-[#7F1D1D] text-sm lg:text-base leading-snug ml-5 mt-0.5">
          Temples,<br />Beaches,<br />More to Explore
        </p>
      </div>

      {/* Center Floating Card */}
      <div className="relative z-20 w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#DCE5F2] shadow-[0_12px_40px_rgba(7,27,73,0.08)] p-6 sm:p-8 text-center flex flex-col items-center">
        {/* Celebration Checkmark Icon with Radiating Sunburst Rays */}
        <div className="relative mb-3 flex items-center justify-center">
          {/* Celebratory golden/yellow rays */}
          <div className="absolute -inset-2 flex items-center justify-center pointer-events-none">
            <svg className="w-20 h-20 text-amber-400 opacity-90 animate-pulse" viewBox="0 0 100 100" fill="none">
              <path d="M50 10 L50 22 M50 78 L50 90 M10 50 L22 50 M78 50 L90 50 M22 22 L30 30 M70 70 L78 78 M22 78 L30 70 M70 30 L78 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 relative z-10">
            <Check className="w-7 h-7 stroke-[3]" />
          </div>
        </div>

        {/* Status Eyebrow */}
        <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#059669] mb-1">
          ORCHESTRATION SUCCEEDED · INVARIANTS PRESERVED
        </span>

        {/* Main Heading */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#071B49] font-display tracking-tight">
          Your journey is synchronized.
        </h1>

        {/* Core Product Message Subtitle */}
        <p className="text-xs sm:text-sm text-[#475569] max-w-lg mt-2 leading-relaxed">
          All inventory holds across transit providers have been permanently converted into verified bookings.
        </p>

        {/* Master PNR Pill with 1-Click Clipboard Copy */}
        <div className="mt-4 inline-flex items-center gap-2.5 bg-[#F8FAFC] px-4 py-2 rounded-xl border border-[#DCE5F2] shadow-2xs">
          <span className="text-xs text-[#52627A] font-medium">Master PNR:</span>
          <strong className="text-sm font-bold font-mono tracking-wider text-[#071B49]">
            {pnr}
          </strong>
          <button
            type="button"
            onClick={handleCopyPnr}
            title="Copy Master PNR"
            className="text-slate-400 hover:text-[#1769FF] transition-colors p-1 rounded-md hover:bg-white"
          >
            {copied ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCheck className="w-3.5 h-3.5" />
                Copied
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
