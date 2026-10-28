import React from 'react';
import { useNavigate } from 'react-router-dom';
import { JourneyPlanner } from '../components/planner/JourneyPlanner';
import {
  Zap,
  ShieldCheck,
  Sparkles,
  MapPin,
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
              'linear-gradient(90deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.85) 28%, rgba(255,255,255,0.2) 55%, rgba(255,255,255,0.1) 80%, rgba(255,255,255,0.35) 100%)',
          }}
        />

        {/* Airplane in upper-right sky */}
        <div className="absolute right-8 sm:right-16 lg:right-24 top-6 sm:top-10 pointer-events-none z-10 select-none">
          <img
            src="/images/home/airplane.png"
            alt="Airplane flying toward Chennai"
            className="w-32 sm:w-40 lg:w-48 drop-shadow-sm transform -rotate-1 opacity-95"
          />
        </div>

        {/* Curved flight trail from Chennai toward Airplane */}
        <svg
          className="absolute right-12 lg:right-28 top-20 lg:top-24 w-40 lg:w-56 h-48 pointer-events-none z-10 opacity-60"
          viewBox="0 0 200 180"
          fill="none"
        >
          <path
            d="M 170 160 C 140 100, 110 50, 40 20"
            stroke="#9A3412"
            strokeWidth="1.8"
            strokeDasharray="4 5"
          />
        </svg>

        {/* Main Content Container (Hero grid: Left Text + Center/Right Planner Card) */}
        <div className="relative z-20 max-w-[1536px] w-full mx-auto px-6 lg:px-12 pt-8 sm:pt-10 pb-12 flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-10">
          {/* ── Left Column: Hero Text & Value Pillars ── */}
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-5 pt-1 lg:pt-3">
            {/* Small Eyebrow */}
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#52627A]">
              YOUR AI-POWERED TRAVEL COMPANION
            </span>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-[46px] lg:text-[48px] font-black leading-[1.08] tracking-tight font-display">
              <span className="text-[#071B49] block">Plan the journey.</span>
              <span className="text-[#1769FF] block">We'll synchronize</span>
              <span className="text-[#1769FF] block">the rest.</span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-[13.5px] leading-relaxed text-[#475569] max-w-[360px]">
              Tell us where you need to go, when you need to arrive, and what matters most.
              KogniSync compares complete multi-modal journeys — flights, trains, buses, cabs,
              metros and more. One request. The best options.
            </p>

            {/* Feature List (3 items) */}
            <div className="flex flex-col gap-3.5 pt-1">
              {/* Feature 1 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#1769FF] flex items-center justify-center shrink-0 shadow-2xs">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#071B49]">Multi-Modal Journeys</span>
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
                  <span className="text-xs font-bold text-[#071B49]">Reliable & Concurrent</span>
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
                  <span className="text-xs font-bold text-[#071B49]">AI-Powered Insights</span>
                  <span className="text-[11px] text-[#52627A]">Personalized recommendations</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right / Center Column: Main Planner Card ── */}
          <div className="w-full lg:flex-1 lg:max-w-[760px] xl:max-w-[800px]">
            <JourneyPlanner />
          </div>
        </div>

        {/* ── Geographic Labels Overlaid on the Travel Scene ── */}

        {/* Lower Left: Bangalore Label & Dotted Curve */}
        <div className="relative lg:absolute left-6 lg:left-14 bottom-4 lg:bottom-7 z-20 flex flex-col items-start select-none pb-4 lg:pb-0">
          <div className="flex items-center gap-1.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-xs">
              <MapPin className="w-3 h-3 text-[#071B49] fill-[#071B49]" />
            </div>
            <span className="font-bold text-sm tracking-wide">Bangalore</span>
          </div>
          <p className="font-script italic text-white text-base lg:text-lg leading-tight ml-5 mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
            A city that<br />keeps you moving
          </p>

          {/* Dotted path leading to bottom corner */}
          <svg
            className="w-16 h-8 -ml-2 -mt-1 opacity-70 pointer-events-none"
            viewBox="0 0 70 35"
            fill="none"
          >
            <path
              d="M 28 2 C 20 18, 10 26, 2 32"
              stroke="white"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </svg>
        </div>

        {/* Right Side: Chennai Label Over Temple/Bridge Landscape */}
        <div className="hidden lg:flex absolute right-10 xl:right-16 bottom-16 xl:bottom-20 z-20 flex-col items-start select-none">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-[#DC2626] fill-[#DC2626]" />
            </div>
            <span className="font-bold text-sm tracking-wide text-[#7F1D1D]">Chennai</span>
          </div>
          <p className="font-script italic text-[#7F1D1D] text-sm lg:text-base leading-snug ml-6 mt-0.5">
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
