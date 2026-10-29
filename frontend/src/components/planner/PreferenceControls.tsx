import React from 'react';
import { DollarSign, Zap, Award, Leaf, Sliders } from 'lucide-react';
import { OptimizationWeights } from '../../types/journey';

interface PreferenceControlsProps {
  weights: OptimizationWeights;
  onChange: (weights: OptimizationWeights) => void;
  budgetMax?: number;
  onBudgetChange: (val: number | undefined) => void;
}

export const PreferenceControls: React.FC<PreferenceControlsProps> = ({
  weights,
  onChange,
  budgetMax,
  onBudgetChange,
}) => {
  const handleSliderChange = (key: keyof OptimizationWeights, rawVal: number) => {
    const newWeights = { ...weights, [key]: rawVal / 100 };
    onChange(newWeights);
  };

  const handleApplyPreset = (presetName: 'economy' | 'speed' | 'balanced' | 'eco') => {
    switch (presetName) {
      case 'economy':
        onChange({ cost: 0.55, duration: 0.2, comfort: 0.15, carbon: 0.1 });
        break;
      case 'speed':
        onChange({ cost: 0.15, duration: 0.6, comfort: 0.2, carbon: 0.05 });
        break;
      case 'balanced':
        onChange({ cost: 0.35, duration: 0.35, comfort: 0.2, carbon: 0.1 });
        break;
      case 'eco':
        onChange({ cost: 0.2, duration: 0.2, comfort: 0.1, carbon: 0.5 });
        break;
    }
  };

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Multi-Objective Optimization Weights
          </span>
        </div>

        {/* Quick preset chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleApplyPreset('economy')}
            className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
          >
            Cheapest (Cost)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('speed')}
            className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
          >
            Fastest (Time)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('balanced')}
            className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
          >
            Best Value
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('eco')}
            className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
          >
            Greenest (CO₂)
          </button>
        </div>
      </div>

      {/* 4 Weight Dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost Weight */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Cost Priority
            </span>
            <span className="font-mono text-emerald-700 font-bold">
              {Math.round(weights.cost * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={80}
            value={Math.round(weights.cost * 100)}
            onChange={(e) => handleSliderChange('cost', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* Duration / Speed Weight */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Duration / Speed
            </span>
            <span className="font-mono text-amber-700 font-bold">
              {Math.round(weights.duration * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={80}
            value={Math.round(weights.duration * 100)}
            onChange={(e) => handleSliderChange('duration', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />
        </div>

        {/* Comfort Weight */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Award className="w-3.5 h-3.5 text-purple-600" />
              Comfort Priority
            </span>
            <span className="font-mono text-purple-700 font-bold">
              {Math.round(weights.comfort * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={80}
            value={Math.round(weights.comfort * 100)}
            onChange={(e) => handleSliderChange('comfort', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>

        {/* Sustainability Weight */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Leaf className="w-3.5 h-3.5 text-teal-600" />
              Sustainability (CO₂)
            </span>
            <span className="font-mono text-teal-700 font-bold">
              {Math.round(weights.carbon * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={80}
            value={Math.round(weights.carbon * 100)}
            onChange={(e) => handleSliderChange('carbon', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
        </div>
      </div>

      {/* Target Budget Ceiling input */}
      <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Target Budget Ceiling:
        </label>
        <div className="relative max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-semibold">
            ₹
          </span>
          <input
            type="number"
            value={budgetMax || ''}
            onChange={(e) =>
              onBudgetChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
            }
            placeholder="e.g. 3000"
            className="pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
};
