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
  Loader2,
} from 'lucide-react';
import { OptimizationWeights, TransportMode } from '../../types/journey';
import { parseTravelIntent, TravelContext, TravelIntent } from '../../api/journey';

interface JourneyPlannerProps {
  onSearchExecuted?: () => void;
}

function formatDisplayDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatTime12h(time24: string): string {
  try {
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  } catch {
    return time24;
  }
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
  const [date, setDate] = useState('Oct 30, 2026');
  const [timeDeadlineText, setTimeDeadlineText] = useState('Arrive by 2:00 PM');
  const [passengers, setPassengers] = useState(1);
  const [isPassengersOpen, setIsPassengersOpen] = useState(false);

  // Preference Weights
  const [weights, setWeights] = useState<OptimizationWeights>({
    cost: 0.5,
    duration: 0.2, // Cost-focused / flexible default
    comfort: 0.15,
    carbon: 0.1,
  });

  // Budget Display State
  const [budgetMin] = useState(500);
  const [budgetMax, setBudgetMax] = useState(3000);

  // Transport Mode Selection
  const [selectedModes, setSelectedModes] = useState<Record<TransportMode, boolean>>({
    flight: true,
    train: true,
    bus: true,
    cab: true,
    metro: true,
    walk: false,
  });

  // AI Loading & Confirmation Feedback State
  const [isUnderstanding, setIsUnderstanding] = useState(false);
  const [understoodMessage, setUnderstoodMessage] = useState<string | null>(
    '✨ Understood: Bangalore → Chennai · Tomorrow · Arrive by 2:00 PM · ₹3,000 budget · Cost-focused'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Swap Origin and Destination
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Toggle Transport Mode
  const toggleMode = (mode: TransportMode) => {
    setSelectedModes((prev) => ({
      ...prev,
      [mode]: !prev[mode],
    }));
  };

  // Execute Navigation to Journey Results
  const handleExecuteSearch = (resolvedIntent?: TravelIntent) => {
    const params = new URLSearchParams({
      origin: resolvedIntent?.origin || origin || 'Bangalore',
      destination: resolvedIntent?.destination || destination || 'Chennai',
      date: resolvedIntent?.date || date || 'Tomorrow',
      passengers: (resolvedIntent?.passengers || passengers).toString(),
      costWeight: (resolvedIntent?.time_priority !== undefined ? 1 - resolvedIntent.time_priority : weights.cost).toString(),
      durationWeight: (resolvedIntent?.time_priority !== undefined ? resolvedIntent.time_priority : weights.duration).toString(),
      comfortWeight: (resolvedIntent?.comfort !== undefined ? resolvedIntent.comfort : weights.comfort).toString(),
      carbonWeight: (resolvedIntent?.sustainability !== undefined ? resolvedIntent.sustainability : weights.carbon).toString(),
    });

    if (nlQuery.trim()) {
      params.set('q', nlQuery.trim());
    }
    const targetBudget = resolvedIntent?.budget !== undefined ? resolvedIntent.budget : budgetMax;
    if (targetBudget) {
      params.set('budgetMax', targetBudget.toString());
    }
    if (resolvedIntent?.arrival_deadline) {
      params.set('arrivalBefore', resolvedIntent.arrival_deadline);
    }
    if (resolvedIntent?.departure_time) {
      params.set('departureAfter', resolvedIntent.departure_time);
    }

    navigate(`/plan?${params.toString()}`);
  };

  // Handle Live Natural Language Interpretation with Gemini
  const handleParseAndPlan = async (customQuery?: string) => {
    const textToParse = (customQuery !== undefined ? customQuery : nlQuery).trim();
    if (!textToParse) return;

    setIsUnderstanding(true);
    setErrorMessage(null);

    const currentContext: TravelContext = {
      origin: origin || null,
      destination: destination || null,
      date: date || null,
      departure_time: null,
      arrival_deadline: null,
      passengers,
      budget: budgetMax,
      time_priority: weights.duration,
      comfort: weights.comfort,
      sustainability: weights.carbon,
      preferred_modes: (Object.keys(selectedModes) as TransportMode[]).filter(
        (m) => selectedModes[m]
      ),
    };

    try {
      const intent = await parseTravelIntent(textToParse, currentContext);

      // 1. Update Origin & Destination
      if (intent.origin) setOrigin(intent.origin);
      if (intent.destination) setDestination(intent.destination);

      // 2. Update Date
      if (intent.date) {
        setDate(formatDisplayDate(intent.date));
      }

      // 3. Update Time / Deadline Control
      if (intent.arrival_deadline && intent.departure_time) {
        setTimeDeadlineText(
          `Depart ${formatTime12h(intent.departure_time)} · Arrive by ${formatTime12h(intent.arrival_deadline)}`
        );
      } else if (intent.arrival_deadline) {
        setTimeDeadlineText(`Arrive by ${formatTime12h(intent.arrival_deadline)}`);
      } else if (intent.departure_time) {
        setTimeDeadlineText(`Depart at ${formatTime12h(intent.departure_time)}`);
      }

      // 4. Update Passengers
      if (intent.passengers && intent.passengers >= 1) {
        setPassengers(intent.passengers);
      }

      // 5. Update Budget Slider
      if (intent.budget !== undefined && intent.budget !== null) {
        setBudgetMax(intent.budget);
      }

      // 6. Update Sliders: Time Priority, Comfort, Sustainability
      setWeights((prev) => ({
        ...prev,
        duration: intent.time_priority !== undefined ? intent.time_priority : prev.duration,
        comfort: intent.comfort !== undefined ? intent.comfort : prev.comfort,
        carbon: intent.sustainability !== undefined ? intent.sustainability : prev.carbon,
      }));

      // 7. Update Transport Modes if explicitly extracted
      if (intent.preferred_modes && intent.preferred_modes.length > 0) {
        const newModes: Record<TransportMode, boolean> = {
          flight: false,
          train: false,
          bus: false,
          cab: false,
          metro: false,
          walk: false,
        };
        for (const m of intent.preferred_modes) {
          if (m in newModes) {
            newModes[m as TransportMode] = true;
          }
        }
        setSelectedModes(newModes);
      }

      // 8. Visual confirmation message
      if (intent.intent_summary) {
        setUnderstoodMessage(`✨ Understood: ${intent.intent_summary}`);
      } else {
        setUnderstoodMessage('✨ Journey details understood');
      }

      // Proceed to search
      setTimeout(() => {
        handleExecuteSearch(intent);
      }, 700);
    } catch {
      setErrorMessage(
        "Couldn't understand the journey request. Please try again."
      );
    } finally {
      setIsUnderstanding(false);
    }
  };

  // Example pills handler
  const handleApplyExample = (queryText: string) => {
    setNlQuery(queryText);
    handleParseAndPlan(queryText);
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
      <div className="flex flex-col gap-2">
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
                    handleParseAndPlan();
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
                onClick={() => handleParseAndPlan()}
                disabled={isUnderstanding || !nlQuery.trim()}
                className="bg-[#071B49] hover:bg-[#0D2E77] text-white px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap cursor-pointer disabled:opacity-80"
              >
                {isUnderstanding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Understanding journey...</span>
                  </>
                ) : (
                  <>
                    <span>Plan Journey</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* AI Understood Feedback / Confirmation Pill */}
        {understoodMessage && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EBF2FF] border border-[#BFDBFE] text-xs text-[#071B49] animate-in fade-in duration-200">
            <Sparkles className="w-3.5 h-3.5 text-[#1769FF] shrink-0" />
            <span className="font-semibold">{understoodMessage}</span>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 animate-in fade-in duration-200">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Example Search Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-[#52627A] pt-0.5">
          <span className="font-medium text-[11px] text-[#64748B] shrink-0">Try examples:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() =>
                handleApplyExample(
                  'I need to reach Chennai from Bangalore tomorrow before 2 PM. My budget is ₹3000 and I prefer saving money over speed.'
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
                  'Fastest way from Bangalore to Goa this Saturday. Money isn\'t a problem.'
                )
              }
              className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#F5F8FC] border border-[#DCE5F2] hover:border-[#1769FF]/40 text-[11px] text-[#071B49] font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Bangalore to Goa
            </button>

            <button
              type="button"
              onClick={() =>
                handleApplyExample(
                  'I prefer trains and want to keep it under ₹2000.'
                )
              }
              className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#F5F8FC] border border-[#DCE5F2] hover:border-[#1769FF]/40 text-[11px] text-[#071B49] font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Trains under ₹2,000
            </button>

            <button
              type="button"
              onClick={() =>
                handleApplyExample(
                  'I want an eco-friendly trip.'
                )
              }
              className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#F5F8FC] border border-[#DCE5F2] hover:border-[#1769FF]/40 text-[11px] text-[#071B49] font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Eco-friendly trip
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="w-full h-px bg-slate-100 my-0.5" />

      {/* 3. Structured Fields: From, Swap, To, Date, Time/Deadline, Passengers */}
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

        {/* Time / Deadline Field */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium text-[#52627A]">Time / Deadline</span>
          <div className="flex items-center gap-2 border border-[#DCE5F2] rounded-xl px-3 py-2 bg-white shadow-2xs hover:border-[#1769FF]/50 transition-colors h-10">
            <Clock className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <input
              type="text"
              value={timeDeadlineText}
              onChange={(e) => setTimeDeadlineText(e.target.value)}
              placeholder="Anytime"
              className="w-full bg-transparent text-xs font-semibold text-[#071B49] focus:outline-none"
            />
            {timeDeadlineText && (
              <button
                type="button"
                onClick={() => setTimeDeadlineText('')}
                className="text-slate-300 hover:text-slate-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Passengers Field */}
        <div className="w-full sm:w-auto lg:w-28 flex flex-col gap-1 relative shrink-0">
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
                  <span className={weights.duration <= 0.3 ? 'font-bold text-[#1769FF]' : ''}>
                    Flexible
                  </span>
                  <span className={weights.duration >= 0.7 ? 'font-bold text-[#1769FF]' : ''}>
                    Fastest
                  </span>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={100}
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
                  <span className={weights.comfort <= 0.3 ? 'font-bold text-[#1769FF]' : ''}>
                    Basic
                  </span>
                  <span className={weights.comfort >= 0.7 ? 'font-bold text-[#1769FF]' : ''}>
                    Premium
                  </span>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={100}
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
                  <span className={weights.carbon <= 0.3 ? 'font-bold text-[#10A77A]' : ''}>
                    Any
                  </span>
                  <span className={weights.carbon >= 0.7 ? 'font-bold text-[#10A77A]' : ''}>
                    Eco-friendly
                  </span>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={100}
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
