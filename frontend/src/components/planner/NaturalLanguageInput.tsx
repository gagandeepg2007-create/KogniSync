import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { DEMO_PRESETS } from '../../api/mockData';
import { extractTravelIntent, ExtractedIntent } from '../../api/journey';

interface NaturalLanguageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onIntentParsed?: (intent: ExtractedIntent) => void;
  isLoading?: boolean;
}

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  value,
  onChange,
  onSubmit,
  onIntentParsed,
  isLoading = false,
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<ExtractedIntent | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleApplyPreset = async (presetText: string) => {
    onChange(presetText);
    setIsExtracting(true);
    try {
      const intent = await extractTravelIntent(presetText);
      setExtractedPreview(intent);
      if (onIntentParsed) onIntentParsed(intent);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleTriggerExtraction = async () => {
    if (!value.trim()) return;
    setIsExtracting(true);
    try {
      const intent = await extractTravelIntent(value);
      setExtractedPreview(intent);
      if (onIntentParsed) onIntentParsed(intent);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Large Natural Language Input Container */}
      <div className="relative rounded-2xl border border-slate-300/80 bg-white shadow-md hover:shadow-lg focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-600/10 transition-all">
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-blue-700">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Describe your travel intent in natural language</span>
            </div>
            {isExtracting && (
              <span className="flex items-center gap-1 text-[11px] text-blue-600 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" />
                Extracting intent...
              </span>
            )}
          </div>

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleTriggerExtraction}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="e.g. I need to reach Chennai from Bangalore tomorrow before 2 PM. My budget is ₹3000 and I prefer saving money over speed."
            className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm sm:text-base resize-none focus:outline-none leading-relaxed font-sans"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Extracted preview tags */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              {extractedPreview ? (
                <>
                  <span className="text-[11px] font-medium text-slate-400">Parsed:</span>
                  {extractedPreview.origin && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-mono text-[11px]">
                      From: {extractedPreview.origin}
                    </span>
                  )}
                  {extractedPreview.destination && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-mono text-[11px]">
                      To: {extractedPreview.destination}
                    </span>
                  )}
                  {extractedPreview.budget && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px]">
                      Budget: ₹{extractedPreview.budget}
                    </span>
                  )}
                  {extractedPreview.arrivalBefore && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[11px]">
                      Arrive &lt; {extractedPreview.arrivalBefore}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Include origin, destination, arrival deadline, or budget constraints.
                </span>
              )}
            </div>

            {/* Plan Journey Button */}
            <button
              onClick={onSubmit}
              disabled={isLoading || !value.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-98"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <span>Plan Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preset sample prompts */}
      <div className="flex flex-col gap-1.5 mt-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Demo Travel Scenarios:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DEMO_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset.query)}
              className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-400 transition-all group shadow-xs"
            >
              <div className="font-semibold text-xs text-slate-800 group-hover:text-blue-700 transition-colors">
                {preset.title}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {preset.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
