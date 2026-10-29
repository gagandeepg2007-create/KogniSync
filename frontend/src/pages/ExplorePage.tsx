import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Sparkles,
  Plane,
  Train,
  Bus,
  Car,
  Clock,
  Leaf,
  ChevronRight,
  Waves,
  Mountain,
  Landmark,
  Zap,
  Utensils,
} from 'lucide-react';
import {
  DISCOVERY_CHIPS,
  POPULAR_DESTINATIONS,
  CURATED_JOURNEYS,
  MOOD_CATEGORIES,
  SMART_TIPS,
  MoodCategory,
} from '../data/exploreData';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState<string>('all');
  const [aiPrompt, setAiPrompt] = useState('I have ₹5,000 and a free weekend. Find me somewhere peaceful.');

  // Filter popular destinations based on chip selection & search
  const filteredDestinations = POPULAR_DESTINATIONS.filter((dest) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.destination.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedChip === 'all') return true;
    if (selectedChip === 'budget2k') return dest.startingPrice <= 2000;
    if (selectedChip === 'budget5k') return dest.startingPrice <= 5000;
    return dest.tag === selectedChip;
  });

  // Handle Search Submission
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/plan?destination=${encodeURIComponent(query)}&q=${encodeURIComponent(query)}`);
    } else {
      navigate('/plan');
    }
  };

  // Handle direct navigation to plan
  const handlePlanRoute = (origin: string, destination: string, extraQuery?: string) => {
    const params = new URLSearchParams({
      origin: origin || 'Bangalore',
      destination: destination || 'Goa',
    });
    if (extraQuery) {
      params.set('q', extraQuery);
    }
    navigate(`/plan?${params.toString()}`);
  };

  // Render transport mode icon
  const renderModeIcon = (mode: 'flight' | 'train' | 'bus' | 'cab') => {
    switch (mode) {
      case 'flight':
        return <Plane key={mode} className="w-3.5 h-3.5" />;
      case 'train':
        return <Train key={mode} className="w-3.5 h-3.5" />;
      case 'bus':
        return <Bus key={mode} className="w-3.5 h-3.5" />;
      case 'cab':
        return <Car key={mode} className="w-3.5 h-3.5" />;
    }
  };

  // Render mood category icon
  const renderMoodIcon = (iconName: MoodCategory['iconName']) => {
    switch (iconName) {
      case 'waves':
        return <Waves className="w-4 h-4" />;
      case 'mountain':
        return <Mountain className="w-4 h-4" />;
      case 'landmark':
        return <Landmark className="w-4 h-4" />;
      case 'leaf':
        return <Leaf className="w-4 h-4" />;
      case 'zap':
        return <Zap className="w-4 h-4" />;
      case 'utensils':
        return <Utensils className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#F5F8FC] pb-16">
      {/* ──────────────────────────────────────────────────────────
          1. HERO SECTION WITH GOA COASTLINE PANORAMA
         ────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-slate-100 min-h-[460px] sm:min-h-[500px] lg:min-h-[530px] flex flex-col justify-between pt-8 sm:pt-12 pb-8">
        {/* Full-width Scenic Background */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-no-repeat bg-[center_top] pointer-events-none"
          style={{
            backgroundImage: "url('/images/explore/explore-hero.jpg')",
          }}
        />

        {/* Soft light gradient overlay for readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.88) 38%, rgba(255,255,255,0.2) 65%, rgba(255,255,255,0.05) 100%)',
          }}
        />

        {/* Top-Right Goa Location Annotation Over Coastline */}
        <div className="hidden lg:flex absolute right-12 xl:right-16 top-10 xl:top-14 z-20 flex-col items-start select-none">
          {/* Dotted path leading toward ocean */}
          <svg
            className="w-24 h-20 -ml-16 -mt-10 pointer-events-none opacity-70"
            viewBox="0 0 100 80"
            fill="none"
          >
            <path
              d="M 90 70 C 65 35, 40 18, 10 5"
              stroke="#B91C1C"
              strokeWidth="1.8"
              strokeDasharray="4 4"
            />
          </svg>

          <div className="flex items-center gap-1.5 -mt-6">
            <div className="w-5 h-5 rounded-full bg-[#DC2626] flex items-center justify-center shadow-xs">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <span className="font-bold text-sm tracking-wide text-[#071B49]">Goa</span>
          </div>
          <p className="font-script italic text-[#7F1D1D] text-sm leading-snug ml-6 mt-0.5 font-medium">
            Beaches,<br />Sunsets,<br />More to Explore
          </p>
        </div>

        {/* Main Content Container */}
        <div className="relative z-20 max-w-[1536px] w-full mx-auto px-6 lg:px-12 flex flex-col justify-center">
          <div className="max-w-[620px] flex flex-col gap-4">
            {/* Small Eyebrow */}
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#52627A]">
              EXPLORE WITH KOGNISYNC
            </span>

            {/* Headline */}
            <h1 className="text-4xl sm:text-[46px] lg:text-[52px] font-black leading-[1.04] tracking-tight font-display text-[#071B49]">
              Discover journeys<br />worth taking.
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-[14px] leading-relaxed text-[#475569] max-w-[520px]">
              Find inspiring destinations, popular routes, and intelligently curated journeys —
              then let KogniSync plan the rest.
            </p>

            {/* Intelligent Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[540px] mt-2">
              <div className="relative bg-white rounded-full shadow-[0_8px_30px_rgba(7,27,73,0.08)] border border-[#DCE5F2] flex items-center p-1.5 pl-4 hover:border-[#1769FF]/50 transition-all focus-within:border-[#1769FF] focus-within:ring-2 focus-within:ring-[#1769FF]/10">
                <Search className="w-4 h-4 text-[#1769FF] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Where do you want to go?"
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#071B49] placeholder:text-slate-400 px-3 focus:outline-none"
                />
                <button
                  type="submit"
                  title="Search destination"
                  className="w-9 h-9 rounded-full bg-[#1769FF] hover:bg-[#1258DB] text-white flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* AI Natural Language Hint Pill */}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('Goa');
                handlePlanRoute('Bangalore', 'Goa', 'Best weekend trip from Bangalore under ₹5,000');
              }}
              className="self-start inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm border border-white/90 text-[11px] sm:text-xs text-[#475569] hover:text-[#071B49] shadow-2xs transition-all cursor-pointer group mt-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1769FF] group-hover:rotate-12 transition-transform" />
              <span>
                Ask KogniSync naturally — <strong className="font-semibold text-[#071B49]">&quot;Best weekend trip from Bangalore under ₹5,000&quot;</strong>
              </span>
            </button>
          </div>
        </div>

        {/* Discovery Filter Chips (Row immediately below hero) */}
        <div className="relative z-20 max-w-[1536px] w-full mx-auto px-6 lg:px-12 mt-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {DISCOVERY_CHIPS.map((chip) => {
              const isActive = selectedChip === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedChip(chip.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-2xs ${
                    isActive
                      ? 'bg-[#1769FF] text-white shadow-sm'
                      : 'bg-white hover:bg-slate-50 border border-[#DCE5F2] text-[#475569] hover:text-[#071B49]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}

            {/* Right arrow scroll hint */}
            <button
              type="button"
              onClick={() => setSelectedChip('all')}
              title="More filters"
              className="w-8 h-8 rounded-full bg-white border border-[#DCE5F2] hover:border-[#1769FF] text-[#52627A] hover:text-[#1769FF] flex items-center justify-center shrink-0 shadow-2xs cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Sections Wrapper */}
      <div className="max-w-[1536px] w-full mx-auto px-6 lg:px-12 flex flex-col gap-12 sm:gap-14 mt-10">
        {/* ──────────────────────────────────────────────────────────
            2. "POPULAR RIGHT NOW" SECTION
           ────────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#071B49] font-display">
                Popular right now
              </h2>
              <p className="text-xs text-[#52627A] mt-0.5">
                Journeys travelers are exploring this week.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/plan?origin=Bangalore&destination=Goa')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769FF] hover:underline cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredDestinations.map((dest) => (
              <div
                key={dest.id}
                onClick={() => handlePlanRoute(dest.origin, dest.destination)}
                className="group bg-white rounded-2xl border border-[#DCE5F2] hover:border-[#1769FF]/50 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer shadow-2xs flex flex-col"
              >
                {/* Destination Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={dest.image}
                    alt={`${dest.origin} to ${dest.destination}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category Pill Tag Overlay */}
                  <div className="absolute left-3 bottom-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-bold text-[#071B49] shadow-xs border border-white/60">
                    {dest.category}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm sm:text-[15px] font-bold text-[#071B49] group-hover:text-[#1769FF] transition-colors truncate">
                      {dest.origin} → {dest.destination}
                    </h3>

                    {/* Transport icons & Duration */}
                    <div className="flex items-center gap-2 text-slate-500 py-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        {dest.modes.map((mode) => renderModeIcon(mode))}
                      </div>
                      <span className="text-[11px] font-medium text-[#52627A]">
                        {dest.duration}
                      </span>
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="text-xs text-[#52627A]">
                      From{' '}
                      <strong className="text-sm font-bold text-[#071B49]">
                        ₹{dest.startingPrice.toLocaleString()}
                      </strong>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-[#EBF2FF] text-[#1769FF] group-hover:bg-[#1769FF] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            3. "CURATED JOURNEYS, SYNCHRONIZED FOR YOU." SECTION
           ────────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#071B49] font-display">
                Curated journeys, synchronized for you.
              </h2>
              <p className="text-xs text-[#52627A] mt-0.5">
                Not just destinations. Complete ways to get there.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/plan?origin=Bangalore&destination=Coorg')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769FF] hover:underline cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Larger Journey Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {CURATED_JOURNEYS.map((journey) => (
              <div
                key={journey.id}
                onClick={() => handlePlanRoute(journey.origin, journey.destination, journey.title)}
                className="group bg-white rounded-2xl border border-[#DCE5F2] hover:border-[#1769FF]/50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer shadow-2xs flex flex-col"
              >
                {/* Hero Image with Badge */}
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={journey.image}
                    alt={journey.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Badge */}
                  <div className="absolute left-3.5 top-3.5">
                    {journey.badgeType === 'value' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-bold shadow-xs">
                        <Leaf className="w-3.5 h-3.5" />
                        <span>{journey.badge}</span>
                      </span>
                    )}
                    {journey.badgeType === 'fastest' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] text-xs font-bold shadow-xs">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{journey.badge}</span>
                      </span>
                    )}
                    {journey.badgeType === 'scenic' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] text-xs font-bold shadow-xs">
                        <Mountain className="w-3.5 h-3.5" />
                        <span>{journey.badge}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-[#071B49] group-hover:text-[#1769FF] transition-colors">
                        {journey.title}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-[#52627A]">
                      {journey.route}
                    </span>

                    {/* Multi-modal breakdown badge */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-[#F5F8FC] rounded-lg px-2.5 py-1.5 border border-[#E2E8F0]">
                      <span>{journey.modesText}</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1 text-[#52627A]">
                        <Clock className="w-3 h-3 text-[#1769FF]" />
                        <span>{journey.duration}</span>
                      </span>
                    </div>

                    <p className="text-xs text-[#52627A] leading-relaxed mt-1">
                      {journey.description}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                    <div className="text-xs text-[#52627A]">
                      From{' '}
                      <strong className="text-base font-bold text-[#071B49]">
                        ₹{journey.price.toLocaleString()}
                      </strong>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#1769FF] group-hover:bg-[#1769FF] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            4. "WHERE ARE YOU HEADED?" (EXPLORE BY MOOD)
           ────────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#071B49] font-display">
                Where are you headed?
              </h2>
              <p className="text-xs text-[#52627A] mt-0.5">
                Browse destinations tailored to your travel mood.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/plan?origin=Bangalore&destination=Goa')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769FF] hover:underline cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6 Mood Cards in a Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {MOOD_CATEGORIES.map((mood) => (
              <div
                key={mood.id}
                onClick={() => handlePlanRoute(mood.origin, mood.destination)}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-end p-3.5"
              >
                {/* Background Image */}
                <img
                  src={mood.image}
                  alt={mood.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 pointer-events-none"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 flex flex-col gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center shadow-xs border ${mood.accentBg}`}
                  >
                    {renderMoodIcon(mood.iconName)}
                  </div>

                  <div className="flex items-center justify-between text-white group-hover:text-blue-200 transition-colors">
                    <span className="text-xs sm:text-[13px] font-bold leading-tight">
                      {mood.name}
                    </span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            5. "TRAVEL SMARTER" (SMART TRAVEL IDEAS)
           ────────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl sm:text-2xl font-black text-[#071B49] font-display">
            Travel smarter
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {SMART_TIPS.map((tip) => (
              <div
                key={tip.id}
                className="bg-white border border-[#DCE5F2] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs hover:border-[#1769FF]/40 transition-colors"
              >
                {tip.type === 'save' && (
                  <div className="w-10 h-10 rounded-full bg-[#EBF2FF] text-[#1769FF] flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                    ₹
                  </div>
                )}
                {tip.type === 'time' && (
                  <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 shadow-2xs">
                    <Clock className="w-5 h-5" />
                  </div>
                )}
                {tip.type === 'green' && (
                  <div className="w-10 h-10 rounded-full bg-[#ECFDF5] text-[#10A77A] flex items-center justify-center shrink-0 shadow-2xs">
                    <Leaf className="w-5 h-5" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-[#071B49]">{tip.title}</h3>
                  <p className="text-xs text-[#52627A] leading-relaxed">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            6. FEATURED DESTINATION BANNER: "GOA, REIMAGINED."
           ────────────────────────────────────────────────────────── */}
        <section className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden min-h-[200px] sm:min-h-[220px] flex items-center justify-between p-6 sm:p-10 shadow-md">
          {/* Background image */}
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-no-repeat bg-[center_top] pointer-events-none"
            style={{
              backgroundImage: "url('/images/explore/featured-goa.jpg')",
            }}
          />

          {/* Dark Navy Gradient Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(7,27,73,0.92) 0%, rgba(7,27,73,0.78) 45%, rgba(7,27,73,0.3) 100%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 w-full">
            <div className="flex flex-col gap-2 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
                Goa, reimagined.
              </h2>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                From Bangalore to the coast — compare flights, buses, trains, cabs and combinations in one journey.
              </p>

              {/* Information Pills */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-medium border border-white/20">
                  Beach
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-medium border border-white/20">
                  Weekend
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-medium border border-white/20">
                  From ₹2,499
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-medium border border-white/20">
                  Multiple routes
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => handlePlanRoute('Bangalore', 'Goa')}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#071B49] font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>Explore Goa</span>
              <ArrowRight className="w-4 h-4 text-[#1769FF]" />
            </button>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            7. AI EXPLORATION CTA: "NOT SURE WHERE TO GO?"
           ────────────────────────────────────────────────────────── */}
        <section className="relative w-full rounded-2xl sm:rounded-3xl bg-[#EBF3FF] border border-[#DCE5F2] p-6 sm:p-8 lg:p-10 overflow-hidden shadow-2xs flex flex-col gap-4">
          {/* Airplane in Upper Right */}
          <div className="absolute right-4 sm:right-10 top-4 sm:top-6 pointer-events-none select-none opacity-90 hidden sm:block">
            <img
              src="/images/home/airplane.png"
              alt="Airplane"
              className="w-28 sm:w-36 lg:w-44 drop-shadow-sm transform -rotate-1"
            />
          </div>

          <div className="relative z-10 flex flex-col gap-1 max-w-xl">
            <h2 className="text-xl sm:text-2xl font-black text-[#071B49] font-display">
              Not sure where to go?
            </h2>
            <p className="text-xs sm:text-sm text-[#52627A]">
              Tell KogniSync what kind of trip you&apos;re looking for. We&apos;ll find the journeys that fit.
            </p>
          </div>

          {/* AI Plan Input Box */}
          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-[#DCE5F2] shadow-2xs hover:border-[#1769FF]/50 transition-colors">
            <div className="flex items-center gap-2 flex-1 pl-2">
              <Sparkles className="w-4 h-4 text-[#1769FF] shrink-0" />
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="I have ₹5,000 and a free weekend. Find me somewhere peaceful."
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-[#071B49] placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handlePlanRoute('Bangalore', 'Coorg', aiPrompt)}
              className="bg-[#1769FF] hover:bg-[#1258DB] text-white px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Plan with KogniSync</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExplorePage;

