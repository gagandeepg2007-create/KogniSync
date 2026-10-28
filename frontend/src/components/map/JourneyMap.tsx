import React, { useState } from 'react';
import { JourneySegment } from '../../types/journey';
import { ModeIcon } from '../common/ModeIcon';
import { getModeMeta } from '../../lib/utils';
import { MapPin, Compass } from 'lucide-react';

export interface JourneyMapProps {
  segments: JourneySegment[];
  selectedSegmentId?: string;
  onSegmentClick?: (segmentId: string) => void;
  className?: string;
}

export const JourneyMap: React.FC<JourneyMapProps> = ({
  segments,
  selectedSegmentId: _selectedSegmentId,
  onSegmentClick,
  className = '',
}) => {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [mapStyle, setMapStyle] = useState<'topology' | 'schematic'>('topology');

  // Extract all waypoints
  const waypoints = segments.reduce<{
    id: string;
    name: string;
    city: string;
    lat: number;
    lng: number;
    type: string;
  }[]>((acc, seg, idx) => {
    if (idx === 0) {
      acc.push({
        id: seg.origin.id,
        name: seg.origin.name,
        city: seg.origin.city,
        lat: seg.origin.coordinates.lat,
        lng: seg.origin.coordinates.lng,
        type: seg.origin.type,
      });
    }
    acc.push({
      id: seg.destination.id,
      name: seg.destination.name,
      city: seg.destination.city,
      lat: seg.destination.coordinates.lat,
      lng: seg.destination.coordinates.lng,
      type: seg.destination.type,
    });
    return acc;
  }, []);

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-sm relative ${className}`}
    >
      {/* Top Map Toolbar */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
            <Compass className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 font-display">
            Multi-Modal Route Spatial Topology
          </span>
        </div>

        {/* Style switch & provider badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-[11px] font-mono shadow-2xs">
            <button
              onClick={() => setMapStyle('topology')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                mapStyle === 'topology' ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Route View
            </button>
            <button
              onClick={() => setMapStyle('schematic')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                mapStyle === 'schematic' ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Waypoints
            </button>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-600 font-mono px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
            Google Maps Pluggable
          </span>
        </div>
      </div>

      {/* Map Canvas / Visualization Viewport */}
      <div className="relative h-72 sm:h-96 w-full bg-slate-50/70 bg-light-pattern flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Subtle ambient gradient */}
        <div className="absolute inset-0 bg-radial-subtle pointer-events-none" />

        {/* Multi-modal Vector Topology Route */}
        <div className="w-full max-w-2xl flex flex-col justify-center h-full relative z-10">
          <div className="relative flex items-center justify-between w-full">
            {/* Connecting multi-mode colored segment line */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-2 rounded-full overflow-hidden flex shadow-xs">
              {segments.map((seg, idx) => {
                const meta = getModeMeta(seg.mode);
                return (
                  <div
                    key={seg.segmentId}
                    style={{
                      flex: seg.durationMinutes,
                      backgroundColor: meta.accentColor,
                    }}
                    className={`h-full transition-opacity cursor-pointer ${
                      activeSegmentIndex === idx ? 'opacity-100 ring-2 ring-slate-900' : 'opacity-85 hover:opacity-100'
                    }`}
                    onClick={() => {
                      setActiveSegmentIndex(idx);
                      if (onSegmentClick) onSegmentClick(seg.segmentId);
                    }}
                    title={`${seg.provider} (${seg.mode}): ${seg.distanceKm} km`}
                  />
                );
              })}
            </div>

            {/* Waypoint Nodes along the route */}
            {waypoints.map((wp, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === waypoints.length - 1;

              return (
                <div
                  key={`${wp.id}-${idx}`}
                  className="flex flex-col items-center z-20 group relative cursor-pointer"
                >
                  {/* Waypoint circle pin */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-125 shadow-md ${
                      isFirst
                        ? 'bg-blue-600 ring-4 ring-blue-100 text-white'
                        : isLast
                        ? 'bg-emerald-600 ring-4 ring-emerald-100 text-white'
                        : 'bg-white ring-2 ring-slate-300 text-slate-700'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>

                  {/* Waypoint label pill */}
                  <div
                    className={`absolute top-8 flex flex-col items-center text-center w-32 -translate-x-1/2 left-1/2 pointer-events-none transition-all ${
                      isFirst || isLast ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-900 tracking-tight truncate w-full">
                      {wp.city}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate w-full">
                      {wp.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mode Badges along route */}
          <div className="flex justify-around items-center w-full mt-24 sm:mt-28">
            {segments.map((seg, idx) => {
              return (
                <button
                  key={seg.segmentId}
                  onClick={() => {
                    setActiveSegmentIndex(idx);
                    if (onSegmentClick) onSegmentClick(seg.segmentId);
                  }}
                  className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                    activeSegmentIndex === idx
                      ? 'bg-white border-blue-600 shadow-md scale-105'
                      : 'bg-white/90 hover:bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <ModeIcon mode={seg.mode} size={14} />
                    <span className="text-xs font-bold text-slate-800">
                      {seg.provider}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {seg.distanceKm} km · {Math.round(seg.durationMinutes / 60)}h{' '}
                    {seg.durationMinutes % 60}m
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Bottom Bar */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-600 font-mono pointer-events-none">
          <div className="bg-white/95 px-3 py-1 rounded-lg border border-slate-200 pointer-events-auto shadow-2xs">
            <span>
              Segment {activeSegmentIndex + 1}/{segments.length}:{' '}
              <strong className="text-slate-900">
                {segments[activeSegmentIndex]?.provider} ({segments[activeSegmentIndex]?.mode})
              </strong>
            </span>
          </div>

          <div className="bg-white/95 px-3 py-1 rounded-lg border border-slate-200 hidden sm:block shadow-2xs">
            <span>Geo coordinates synced from BookingInventory models</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyMap;
