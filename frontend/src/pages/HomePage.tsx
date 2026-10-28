import React from 'react';
import { useNavigate } from 'react-router-dom';
import { JourneyPlanner } from '../components/planner/JourneyPlanner';
import {
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Plane,
  Train,
  Bus,
  Car,
} from 'lucide-react';

interface PopularRoute {
  id: string;
  origin: string;
  destination: string;
  price: string;
  duration: string;
  image: string;
  modes: ('flight' | 'train' | 'bus' | 'cab')[];
}

const POPULAR_ROUTES: PopularRoute[] = [
  {
    id: 'blr-maa',
    origin: 'Bangalore',
    destination: 'Chennai',
    price: '₹850',
    duration: '6h 20m',
    image: '/images/home/bangalore-chennai.jpg',
    modes: ['flight', 'train', 'bus'],
  },
  {
    id: 'blr-hyd',
    origin: 'Bangalore',
    destination: 'Hyderabad',
    price: '₹1,200',
    duration: '9h 30m',
    image: '/images/home/bangalore-hyderabad.jpg',
    modes: ['flight', 'train', 'bus', 'cab'],
  },
  {
    id: 'del-bom',
    origin: 'Delhi',
    destination: 'Mumbai',
    price: '₹1,800',
    duration: '8h 15m',
    image: '/images/home/delhi-mumbai.jpg',
    modes: ['flight', 'train'],
  },
  {
    id: 'bom-goa',
    origin: 'Mumbai',
    destination: 'Goa',
    price: '₹1,100',
    duration: '7h 30m',
    image: '/images/home/mumbai-goa.jpg',
    modes: ['flight', 'train', 'cab'],
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleRouteClick = (origin: string, destination: string) => {
    navigate(`/plan?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
  };

  return (
    <div className="w-full flex flex-col bg-[#F5F8FC]">
      {/* ──────────────────────────────────────────────────────────
          1. HERO SECTION WITH CINEMATIC LANDSCAPE BACKGROUND
         ────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-slate-100 min-h-[720px] lg:min-h-[760px] flex flex-col justify-between">
        {/* Full-width Scenic Background Composite */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-no-repeat bg-[center_top] pointer-events-none"
          style={{
            backgroundImage: "url('/images/home/hero-composite.jpg')",
          }}
        />

        {/* Soft light overlay to ensure text contrast and match reference lighting */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 28%, rgba(255,255,255,0.18) 55%, rgba(255,255,255,0.06) 78%, rgba(255,255,255,0.2) 100%)',
          }}
        />

        {/* Main Content Container (Hero grid: Left Text + Center/Right Planner Card) */}
        <div className="relative z-20 max-w-[1536px] w-full mx-auto px-6 lg:px-12 pt-8 sm:pt-9 pb-12 flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-10">
          {/* ── Left Column: Hero Text & Value Pillars ── */}
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4 sm:gap-5 pt-1 lg:pt-2">
            {/* Small Eyebrow */}
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#52627A]">
              YOUR AI-POWERED TRAVEL COMPANION
            </span>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-[46px] lg:text-[52px] font-black leading-[1.02] tracking-tight font-display">
              <span className="text-[#071B49] block">Plan the journey.</span>
              <span className="text-[#1769FF] block">We'll synchronize</span>
              <span className="text-[#1769FF] block">the rest.</span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-[13.5px] leading-relaxed text-[#475569] max-w-[370px]">
              Tell us where you need to go, when you need to arrive, and what matters most.
              KogniSync compares complete multi-modal journeys — flights, trains, buses, cabs,
              metros and more. One request. The best options.
            </p>

            {/* Feature List (3 items) */}
            <div className="flex flex-col gap-3.5 pt-0.5">
              {/* Feature 1 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#1769FF] flex items-center justify-center shrink-0 shadow-2xs">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-[13px] font-bold text-[#071B49]">Multi-Modal Journeys</span>
                  <span className="text-[11px] text-[#52627A]">
                    All transport options in one place
                  </span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#1769FF] flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 fill-[#1769FF] text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-[13px] font-bold text-[#071B49]">Reliable & Concurrent</span>
                  <span className="text-[11px] text-[#52627A]">
                    Real-time inventory and safe booking
                  </span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#1769FF] flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#1769FF]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-[13px] font-bold text-[#071B49]">AI-Powered Insights</span>
                  <span className="text-[11px] text-[#52627A]">Personalized recommendations</span>
                </div>
              </div>

              {/* Subtle flying birds silhouette */}
              <div className="hidden sm:flex items-center opacity-45 ml-14 mt-1">
                <svg className="w-20 h-5 text-slate-800 pointer-events-none" viewBox="0 0 70 20" fill="currentColor">
                  <path d="M5 12 C7 8, 11 8, 13 12 C15 8, 19 8, 21 12 C19 11, 15 11, 13 14 C11 11, 7 11, 5 12 Z" />
                  <path d="M28 7 C29.5 4, 32.5 4, 34 7 C35.5 4, 38.5 4, 40 7 C38.5 6.2, 35.5 6.2, 34 8.5 C32.5 6.2, 29.5 6.2, 28 7 Z" />
                  <path d="M48 13 C49 10, 52 10, 53.5 13 C55 10, 58 10, 59 13 C58 12.2, 55 12.2, 53.5 14.5 C52 12.2, 49 12.2, 48 13 Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Right / Center Column: Main Planner Card ── */}
          <div className="w-full lg:flex-1 lg:max-w-[820px] xl:max-w-[840px]">
            <JourneyPlanner />
          </div>
        </div>

        {/* ── Geographic Labels Overlaid on the Travel Scene ── */}

        {/* Lower Left: Bangalore Label & Dotted Curve */}
        <div className="relative lg:absolute left-6 lg:left-14 bottom-4 lg:bottom-6 z-20 flex flex-col items-start select-none pb-4 lg:pb-0">
          <div className="flex items-center gap-1.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
              <div className="w-2 h-2 rounded-full bg-[#071B49]" />
            </div>
            <span className="font-bold text-sm tracking-wide">Bangalore</span>
          </div>
          <p className="font-script italic text-white text-base lg:text-lg leading-tight ml-6 mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            A city that<br />keeps you moving
          </p>

          {/* Dotted path leading to bottom corner */}
          <svg
            className="w-20 h-10 -ml-3 -mt-1 opacity-80 pointer-events-none"
            viewBox="0 0 80 40"
            fill="none"
          >
            <path
              d="M 35 2 C 22 18, 12 28, 2 36"
              stroke="white"
              strokeWidth="1.8"
              strokeDasharray="3 3"
            />
          </svg>
        </div>

        {/* Upper-Right Side: Chennai Label and Flight Trail to Airplane */}
        <div className="hidden lg:flex absolute right-6 xl:right-10 top-32 xl:top-36 z-20 flex-col items-start select-none">
          {/* Curved flight trail leading towards airplane in sky */}
          <svg
            className="w-32 h-24 -ml-20 -mt-16 pointer-events-none opacity-70"
            viewBox="0 0 120 90"
            fill="none"
          >
            <path
              d="M 100 80 C 70 45, 45 25, 10 5"
              stroke="#B91C1C"
              strokeWidth="1.8"
              strokeDasharray="4 4"
            />
          </svg>

          <div className="flex items-center gap-1.5 -mt-6">
            <div className="w-5 h-5 rounded-full bg-[#DC2626] flex items-center justify-center shadow-xs">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <span className="font-bold text-sm tracking-wide text-[#071B49]">Chennai</span>
          </div>
          <p className="font-script italic text-[#7F1D1D] text-sm lg:text-base leading-snug ml-6 mt-0.5 font-medium">
            Temples,<br />Beaches,<br />More to Explore
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          2. POPULAR ROUTES SECTION (IMMEDIATELY BELOW HERO)
         ────────────────────────────────────────────────────────── */}
      <section id="popular-routes" className="w-full bg-white border-t border-[#DCE5F2] py-8 lg:py-10">
        <div className="max-w-[1536px] mx-auto px-6 lg:px-12 flex flex-col gap-5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#071B49] font-display">
                Popular Routes
              </h2>
              <p className="text-xs text-[#52627A] mt-0.5">
                Explore popular journeys or start with your own plan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/plan?origin=Bangalore&destination=Chennai')}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE5F2] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1769FF] shadow-2xs transition-colors cursor-pointer"
            >
              <span>View All Routes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* 4 Route Cards in a Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POPULAR_ROUTES.map((route) => (
              <div
                key={route.id}
                onClick={() => handleRouteClick(route.origin, route.destination)}
                className="group flex items-center bg-white border border-[#DCE5F2] hover:border-[#1769FF]/50 hover:shadow-md rounded-xl overflow-hidden transition-all duration-200 cursor-pointer shadow-2xs"
              >
                {/* Thumbnail Image on the left */}
                <div className="w-24 sm:w-28 h-20 sm:h-22 shrink-0 overflow-hidden relative bg-slate-100">
                  <img
                    src={route.image}
                    alt={`${route.origin} to ${route.destination}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Card Content on the right */}
                <div className="flex-1 p-2.5 sm:p-3 flex flex-col justify-between min-w-0 h-full">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs sm:text-sm font-bold text-[#071B49] truncate group-hover:text-[#1769FF] transition-colors">
                      {route.origin} → {route.destination}
                    </h3>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1769FF] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* Transport mode icons */}
                  <div className="flex items-center gap-1.5 text-[#1769FF] py-0.5">
                    {route.modes.includes('flight') && <Plane className="w-3 h-3" />}
                    {route.modes.includes('train') && <Train className="w-3 h-3" />}
                    {route.modes.includes('bus') && <Bus className="w-3 h-3" />}
                    {route.modes.includes('cab') && <Car className="w-3 h-3" />}
                  </div>

                  {/* Price and Duration */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-semibold text-slate-500">
                      from <strong className="text-[#071B49] font-bold text-xs">{route.price}</strong>
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[#52627A] font-medium">{route.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
