import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  SlidersHorizontal,
  Mic,
  ArrowRight,
  MapPin,
  Calendar,
  User,
  ArrowLeftRight,
  ChevronDown,
  X,
  Clock,
  Leaf,
  Plane,
  Train,
  Bus,
  Car,
  TrainFront,
  Footprints,
  Check,
} from 'lucide-react';
import { OptimizationWeights, TransportMode } from '../../types/journey';
import { extractTravelIntent } from '../../api/journey';

interface JourneyPlannerProps {
  onSearchExecuted?: () => void;
}

export const JourneyPlanner: React.FC<JourneyPlannerProps> = () => {
  const navigate = useNavigate();

  // Tab State: 'natural' | 'structured'
  const [activeTab, setActiveTab] = useState<'natural' | 'structured'>('natural');

  // Query & Intent State
  const [nlQuery, setNlQuery] = useState(
    'I need to reach Chennai from Bangalore tomorrow before 2 PM. My budget is ₹3000 and I prefer saving money over speed.'
  );
  const [origin, setOrigin] = useState('Bangalore');
  const [destination, setDestination] = useState('Chennai');
  const [date, setDate] = useState('Dec 15, 2024');
  const [passengers, setPassengers] = useState(1);
  const [isPassengersOpen, setIsPassengersOpen] = useState(false);

  // Preference Weights
  const [weights, setWeights] = useState<OptimizationWeights>({
    cost: 0.5,
    duration: 0.25,
    comfort: 0.15,
    carbon: 0.1,
  });

  // Budget Display State
  const [budgetMin] = useState(500);
  const [budgetMax, setBudgetMax] = useState(10000);

  // Transport Mode Selection (all checked except walk by default as in screenshot)
  const [selectedModes, setSelectedModes] = useState<Record<TransportMode, boolean>>({
    flight: true,
    train: true,
    bus: true,
    cab: true,
    metro: true,
    walk: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Handle Intent Extraction when NL Query changes or preset is clicked
  const handleApplyExample = async (queryText: string, orig: string, dest: string) => {
    setNlQuery(queryText);
    setOrigin(orig);
    setDestination(dest);
    try {
      const intent = await extractTravelIntent(queryText);
      if (intent.origin) setOrigin(intent.origin);
      if (intent.destination) setDestination(intent.destination);
      if (intent.weights) setWeights(intent.weights);
    } catch {
      // fallback to manual state
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const toggleMode = (mode: TransportMode) => {
    setSelectedModes((prev) => ({
      ...prev,
      [mode]: !prev[mode],
    }));
  };

  const handleExecuteSearch = () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      origin: origin || 'Bangalore',
      destination: destination || 'Chennai',
      date: date || 'Tomorrow',
      passengers: passengers.toString(),
      costWeight: weights.cost.toString(),
      durationWeight: weights.duration.toString(),
      comfortWeight: weights.comfort.toString(),
      carbonWeight: weights.carbon.toString(),
    });

    if (nlQuery.trim()) {
      params.set('q', nlQuery.trim());
    }
    if (budgetMax) {
      params.set('budgetMax', budgetMax.toString());
    }

    navigate(`/plan?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-[840px] bg-white/96 backdrop-blur-md rounded-2xl lg:rounded-[24px] border border-[#DCE5F2] shadow-[0_12px_40px_rgba(7,27,73,0.08)] p-5 sm:p-6 lg:p-6 flex flex-col gap-3.5 sm:gap-4 text-slate-800">
      {/* 1. Header Tabs: Natural Language vs Structured Search */}
      <div className="flex items-center gap-6 border-b border-[#E2E8F0] pb-2 -mt-1">
        <button
          type="button"
          onClick={() => setActiveTab('natural')}
          className={`flex items-center gap-2 pb-2 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === 'natural'
              ? 'text-[#1769FF] border-b-2 border-[#1769FF] -mb-[9px]'
              : 'text-[#52627A] hover:text-[#071B49]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#1769FF]" />
          <span>Natural Language</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('structured')}
          className={`flex items-center gap-2 pb-2 text-xs sm:text-sm font-medium transition-all relative cursor-pointer ${
            activeTab === 'structured'
              ? 'text-[#1769FF] border-b-2 border-[#1769FF] -mb-[9px]'
              : 'text-[#52627A] hover:text-[#071B49]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span>Structured Search</span>
        </button>
      </div>

      {/* 2. Natural Language Travel Intent Input Box */}
      <div className="flex flex-col gap-2.5">
        <div className="relative border border-[#DCE5F2] rounded-xl p-3 sm:p-3.5 bg-white shadow-2xs hover:border-[#1769FF]/50 transition-colors">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#4B4DED] mt-1 shrink-0" />
            <div className="flex-1 min-w-0">
              <textarea
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleExecuteSearch();
                  }
                }}
                rows={2}
                placeholder="I need to reach Chennai from Bangalore tomorrow before 2 PM. My budget is ₹3000 and I prefer saving money over speed."
                className="w-full bg-transparent text-[#071B49] placeholder:text-slate-400 text-xs sm:text-[13.5px] leading-relaxed font-medium resize-none focus:outline-none"
              />
            </div>

            {/* Right side: Mic + Plan Journey button */}
            <div className="flex items-center gap-2 shrink-0 self-center">
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50 cursor-pointer"
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleExecuteSearch}
                disabled={isLoading || !nlQuery.trim()}
                className="bg-[#071B49] hover:bg-[#0D2E77] text-white px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap cursor-pointer"
              >
                <span>Plan Journey</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Example Search Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-[#52627A]">
          <span className="font-medium text-[11px] text-[#64748B] shrink-0">Try examples:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() =>
                handleApplyExample(
                  'I need to reach Chennai from Bangalore tomorrow before 2 PM. My budget is ₹3000 and I prefer saving money over speed.',
                  'Bangalore',
                  'Chennai'
                )
              }
              className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#F5F8FC] border border-[#DCE5F2] hover:border-[#1769FF]/40 text-[11px] text-[#071B49] font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Bangalore to Chennai
            </button>

            <button
              type="button"
              onClick={() =>
                handleApplyExample(
                  'Fastest business trip from Delhi to Mumbai tomorrow arriving by 11 AM.',
                  'Delhi',
                  'Mumbai'
                )
              }
              className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#F5F8FC] border border-[#DCE5F2] hover:border-[#1769FF]/40 text-[11px] text-[#071B49] font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Delhi to Mumbai
            </button>

            <button
              type="button"
              onClick={() =>
                handleApplyExample(
                  'Weekend leisure getaway from Mumbai to Goa for 2 passengers with scenic travel.',
                  'Mumbai',
                  'Goa'
                )
              }
              className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#F5F8FC] border border-[#DCE5F2] hover:border-[#1769FF]/40 text-[11px] text-[#071B49] font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Weekend trip to Goa
            </button>

            <button
              type="button"
              onClick={() =>
                handleApplyExample(
                  'Executive express travel from Bangalore to Hyderabad tomorrow morning.',
                  'Bangalore',
                  'Hyderabad'
                )
              }
              className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#F5F8FC] border border-[#DCE5F2] hover:border-[#1769FF]/40 text-[11px] text-[#071B49] font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Business trip to Hyderabad
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="w-full h-px bg-slate-100 my-0.5" />

      {/* 3. Structured Fields: From, Swap, To, Date, Passengers */}
      <div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:items-end gap-2.5">
        {/* From Field */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium text-[#52627A]">From</span>
          <div className="flex items-center gap-2 border border-[#DCE5F2] rounded-xl px-3 py-2 bg-white shadow-2xs hover:border-[#1769FF]/50 transition-colors h-10">
            <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Origin city"
              className="w-full bg-transparent text-xs font-semibold text-[#071B49] focus:outline-none"
            />
            {origin && (
              <button
                type="button"
                onClick={() => setOrigin('')}
                className="text-slate-300 hover:text-slate-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Swap Button Centered between From & To */}
        <div className="hidden lg:flex items-center justify-center pb-1 px-0.5">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap From and To"
            className="w-7 h-7 rounded-full bg-white border border-[#DCE5F2] hover:border-[#1769FF] text-[#1769FF] hover:bg-blue-50 flex items-center justify-center shrink-0 shadow-2xs cursor-pointer transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* To Field */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium text-[#52627A]">To</span>
          <div className="flex items-center gap-2 border border-[#DCE5F2] rounded-xl px-3 py-2 bg-white shadow-2xs hover:border-[#1769FF]/50 transition-colors h-10">
            <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination city"
              className="w-full bg-transparent text-xs font-semibold text-[#071B49] focus:outline-none"
            />
            {destination && (
              <button
                type="button"
                onClick={() => setDestination('')}
                className="text-slate-300 hover:text-slate-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Date Field */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium text-[#52627A]">Date</span>
          <div className="flex items-center gap-2 border border-[#DCE5F2] rounded-xl px-3 py-2 bg-white shadow-2xs hover:border-[#1769FF]/50 transition-colors h-10">
            <Calendar className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Departure date"
              className="w-full bg-transparent text-xs font-semibold text-[#071B49] focus:outline-none"
            />
            {date && (
              <button
                type="button"
                onClick={() => setDate('')}
                className="text-slate-300 hover:text-slate-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Passengers Field */}
        <div className="w-full sm:w-auto lg:w-32 flex flex-col gap-1 relative shrink-0">
          <span className="text-[11px] font-medium text-[#52627A]">Passengers</span>
          <button
            type="button"
            onClick={() => setIsPassengersOpen(!isPassengersOpen)}
            className="flex items-center justify-between border border-[#DCE5F2] rounded-xl px-3 py-2 bg-white shadow-2xs hover:border-[#1769FF]/50 transition-colors text-left cursor-pointer h-10"
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span className="text-xs font-semibold text-[#071B49]">{passengers}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isPassengersOpen && (
            <div className="absolute top-full right-0 mt-1 w-36 bg-white border border-[#DCE5F2] rounded-lg shadow-lg z-30 p-1.5 flex flex-col gap-0.5 animate-in fade-in">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setPassengers(num);
                    setIsPassengersOpen(false);
                  }}
                  className={`text-left px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    passengers === num
                      ? 'bg-blue-50 font-bold text-[#1769FF]'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Journey Preferences (Optional) */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[#071B49]">Journey Preferences</span>
          <span className="text-[11px] text-[#64748B] font-normal">(Optional)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Card 1: Budget */}
          <div className="border border-[#DCE5F2] rounded-xl p-3 bg-[#F8FAFC] shadow-2xs flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold text-sm shrink-0">
                ₹
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#071B49]">Budget</span>
                <span className="text-[11px] text-[#52627A] truncate font-mono">
                  ₹{budgetMin} - ₹{budgetMax >= 10000 ? '10,000' : budgetMax.toLocaleString()}
                </span>
              </div>
            </div>
            <input
              type="range"
              min={500}
              max={10000}
              step={500}
              value={budgetMax}
              onChange={(e) => setBudgetMax(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1769FF]"
            />
          </div>

          {/* Card 2: Time Priority */}
          <div className="border border-[#DCE5F2] rounded-xl p-3 bg-[#F8FAFC] shadow-2xs flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#1769FF] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-[#071B49]">Time Priority</span>
                <div className="flex items-center justify-between text-[11px] text-[#52627A]">
                  <span>Flexible</span>
                  <span>Fastest</span>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              value={Math.round(weights.duration * 100)}
              onChange={(e) =>
                setWeights((prev) => ({ ...prev, duration: parseInt(e.target.value, 10) / 100 }))
              }
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1769FF]"
            />
          </div>

          {/* Card 3: Comfort */}
          <div className="border border-[#DCE5F2] rounded-xl p-3 bg-[#F8FAFC] shadow-2xs flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#1769FF] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-[#071B49]">Comfort</span>
                <div className="flex items-center justify-between text-[11px] text-[#52627A]">
                  <span>Basic</span>
                  <span>Premium</span>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              value={Math.round(weights.comfort * 100)}
              onChange={(e) =>
                setWeights((prev) => ({ ...prev, comfort: parseInt(e.target.value, 10) / 100 }))
              }
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1769FF]"
            />
          </div>

          {/* Card 4: Sustainability */}
          <div className="border border-[#DCE5F2] rounded-xl p-3 bg-[#F8FAFC] shadow-2xs flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#10A77A] flex items-center justify-center shrink-0">
                <Leaf className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-[#071B49]">Sustainability</span>
                <div className="flex items-center justify-between text-[11px] text-[#52627A]">
                  <span>Any</span>
                  <span>Eco-friendly</span>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              value={Math.round(weights.carbon * 100)}
              onChange={(e) =>
                setWeights((prev) => ({ ...prev, carbon: parseInt(e.target.value, 10) / 100 }))
              }
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10A77A]"
            />
          </div>
        </div>
      </div>

      {/* 5. Transport Modes Selectors */}
      <div className="flex flex-col gap-2 pt-1">
        <span className="text-xs font-bold text-[#071B49]">Transport Modes</span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {/* Flight */}
          <button
            type="button"
            onClick={() => toggleMode('flight')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer h-10 ${
              selectedModes.flight
                ? 'bg-[#F0F6FF] border-[#1769FF] text-[#1769FF]'
                : 'bg-white border-[#DCE5F2] text-[#52627A]'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Plane className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Flights</span>
            </div>
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ml-1 ${
                selectedModes.flight ? 'bg-[#1769FF] text-white' : 'border border-slate-300 bg-white'
              }`}
            >
              {selectedModes.flight && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>

          {/* Train */}
          <button
            type="button"
            onClick={() => toggleMode('train')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer h-10 ${
              selectedModes.train
                ? 'bg-[#F0F6FF] border-[#1769FF] text-[#1769FF]'
                : 'bg-white border-[#DCE5F2] text-[#52627A]'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Train className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Trains</span>
            </div>
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ml-1 ${
                selectedModes.train ? 'bg-[#1769FF] text-white' : 'border border-slate-300 bg-white'
              }`}
            >
              {selectedModes.train && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>

          {/* Bus */}
          <button
            type="button"
            onClick={() => toggleMode('bus')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer h-10 ${
              selectedModes.bus
                ? 'bg-[#F0F6FF] border-[#1769FF] text-[#1769FF]'
                : 'bg-white border-[#DCE5F2] text-[#52627A]'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Bus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Buses</span>
            </div>
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ml-1 ${
                selectedModes.bus ? 'bg-[#1769FF] text-white' : 'border border-slate-300 bg-white'
              }`}
            >
              {selectedModes.bus && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>

          {/* Cab */}
          <button
            type="button"
            onClick={() => toggleMode('cab')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer h-10 ${
              selectedModes.cab
                ? 'bg-[#F0F6FF] border-[#1769FF] text-[#1769FF]'
                : 'bg-white border-[#DCE5F2] text-[#52627A]'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Car className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Cabs</span>
            </div>
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ml-1 ${
                selectedModes.cab ? 'bg-[#1769FF] text-white' : 'border border-slate-300 bg-white'
              }`}
            >
              {selectedModes.cab && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>

          {/* Metro */}
          <button
            type="button"
            onClick={() => toggleMode('metro')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer h-10 ${
              selectedModes.metro
                ? 'bg-[#F0F6FF] border-[#1769FF] text-[#1769FF]'
                : 'bg-white border-[#DCE5F2] text-[#52627A]'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <TrainFront className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Metro</span>
            </div>
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ml-1 ${
                selectedModes.metro ? 'bg-[#1769FF] text-white' : 'border border-slate-300 bg-white'
              }`}
            >
              {selectedModes.metro && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>

          {/* Walk */}
          <button
            type="button"
            onClick={() => toggleMode('walk')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer h-10 ${
              selectedModes.walk
                ? 'bg-[#F0F6FF] border-[#1769FF] text-[#1769FF]'
                : 'bg-white border-[#DCE5F2] text-[#52627A]'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Footprints className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Walk</span>
            </div>
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ml-1 ${
                selectedModes.walk ? 'bg-[#1769FF] text-white' : 'border border-slate-300 bg-white'
              }`}
            >
              {selectedModes.walk && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default JourneyPlanner;
