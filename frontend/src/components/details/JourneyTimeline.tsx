import React from 'react';
import { Journey } from '../../types/journey';
import { TransportSegment } from './TransportSegment';
import { ArrowDown } from 'lucide-react';

interface JourneyTimelineProps {
  journey: Journey;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ journey }) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
          Synchronized Transit Timeline
        </h3>
        <span className="text-xs font-mono text-slate-500 font-medium">
          {journey.segments.length} Leg{journey.segments.length > 1 ? 's' : ''} ·{' '}
          {journey.totalTransfers} Transfer{journey.totalTransfers !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-4 relative">
        {journey.segments.map((segment, index) => (
          <React.Fragment key={segment.segmentId}>
            <TransportSegment
              segment={segment}
              index={index}
              totalSegments={journey.segments.length}
            />

            {/* Connection Node */}
            {index < journey.segments.length - 1 && (
              <div className="flex items-center justify-center my-0.5">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-blue-900 font-mono shadow-2xs">
                  <ArrowDown className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
                  <span>
                    Synchronized intermodal transfer at{' '}
                    <strong className="text-slate-900 font-bold">
                      {segment.destination.name}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
