import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NaturalLanguageInput } from './NaturalLanguageInput';
import { LocationInput } from './LocationInput';
import { DateTimeSelector } from './DateTimeSelector';
import { PreferenceControls } from './PreferenceControls';
import { OptimizationWeights, TransportMode } from '../../types/journey';
import { ExtractedIntent } from '../../api/journey';
import { ModeIcon } from '../common/ModeIcon';
import { SlidersHorizontal, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export const JourneyPlanner: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [nlQuery, setNlQuery] = useState(
    'I need to reach Chennai from Bangalore tomorrow before 2 PM. My budget is ₹3000 and I prefer saving money over speed.'
  );
  const [origin, setOrigin] = useState('Bangalore');
  const [destination, setDestination] = useState('Chennai');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [arrivalBefore, setArrivalBefore] = useState('14:00');
  const [passengers, setPassengers] = useState(1);
  const [budgetMax, setBudgetMax] = useState<number | undefined>(3000);
  const [weights, setWeights] = useState<OptimizationWeights>({
    cost: 0.5,
    duration: 0.25,
    comfort: 0.15,
    carbon: 0.1,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supportedModes: TransportMode[] = ['flight', 'train', 'bus', 'cab', 'metro', 'walk'];

  const handleIntentParsed = (intent: ExtractedIntent) => {
    if (intent.origin) setOrigin(intent.origin);
    if (intent.destination) setDestination(intent.destination);
    if (intent.budget) setBudgetMax(intent.budget);
    if (intent.arrivalBefore) setArrivalBefore(intent.arrivalBefore);
    if (intent.weights) setWeights(intent.weights);
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleExecuteSearch = () => {
    setIsSubmitting(true);
    const params = new URLSearchParams({
      origin,
      destination,
      date,
      passengers: passengers.toString(),
      costWeight: weights.cost.toString(),
      durationWeight: weights.duration.toString(),
      comfortWeight: weights.comfort.toString(),
      carbonWeight: weights.carbon.toString(),
    });

    if (nlQuery.trim()) {
      params.set('q', nlQuery.trim());
    }
    if (arrivalBefore) {
      params.set('arrivalBefore', arrivalBefore);
    }
    if (budgetMax) {
      params.set('budgetMax', budgetMax.toString());
    }

    navigate(`/plan?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
      {/* Hero Headline */}
      <div className="text-center flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Multi-Modal Orchestration Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 max-w-3xl leading-tight font-display">
          Plan the journey.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-600">
            We'll synchronize the rest.
          </span>
        </h1>

        <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
          Tell us where you need to go, when you need to arrive, and what matters most. KogniSync compares complete multi-modal journeys for you.
        </p>

        {/* Transport-mode indicators */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Modes Synchronized:
          </span>
          {supportedModes.map((mode) => (
            <ModeIcon key={mode} mode={mode} showBadge size={13} />
          ))}
        </div>
      </div>

      {/* Main Interactive Planner Card */}
      <div className="p-5 sm:p-7 rounded-3xl border border-slate-200 bg-white shadow-xl flex flex-col gap-5">
        {/* 1. Large Natural Language Input as Primary Interaction */}
        <NaturalLanguageInput
          value={nlQuery}
          onChange={setNlQuery}
          onSubmit={handleExecuteSearch}
          onIntentParsed={handleIntentParsed}
          isLoading={isSubmitting}
        />

        {/* Structured Controls for Fine-Tuning */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Structured Route & Preference Controls
            </span>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 font-semibold transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Weight Sliders' : 'Adjust Optimizer Weights'}</span>
              {showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <LocationInput
              origin={origin}
              destination={destination}
              onOriginChange={setOrigin}
              onDestinationChange={setDestination}
              onSwap={handleSwap}
            />

            <DateTimeSelector
              date={date}
              onDateChange={setDate}
              arrivalBefore={arrivalBefore}
              onArrivalBeforeChange={setArrivalBefore}
              passengers={passengers}
              onPassengersChange={setPassengers}
            />
          </div>

          {/* Optimizer Weights */}
          {showAdvanced && (
            <div className="animate-in fade-in duration-200">
              <PreferenceControls
                weights={weights}
                onChange={setWeights}
                budgetMax={budgetMax}
                onBudgetChange={setBudgetMax}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
