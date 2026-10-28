import React, { useState, useEffect } from 'react';
import { Timer, ShieldAlert, ShieldCheck } from 'lucide-react';

interface HoldTimerProps {
  initialSeconds?: number;
  onExpire?: () => void;
}

export const HoldTimer: React.FC<HoldTimerProps> = ({
  initialSeconds = 600, // 10 minutes
  onExpire,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onExpire]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const isExpiringSoon = secondsRemaining < 120;
  const progressPercent = (secondsRemaining / initialSeconds) * 100;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all shadow-xs ${
        isExpiringSoon
          ? 'bg-amber-50 border-amber-300 text-amber-900'
          : 'bg-blue-50/70 border-blue-200 text-blue-900'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isExpiringSoon ? (
            <ShieldAlert className="w-5 h-5 text-amber-600 animate-pulse" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          )}
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Distributed Inventory Hold Active
            </span>
            <span className="text-[11px] text-slate-600">
              Capacity locked via Redis 7 hold coordinator (0 risk of double-booking)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-base font-bold bg-white px-3 py-1 rounded-xl border border-slate-300 shadow-2xs">
          <Timer className="w-4 h-4 text-blue-600" />
          <span className="text-slate-900">
            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
        <div
          className={`h-full transition-all duration-1000 ${
            isExpiringSoon ? 'bg-amber-500' : 'bg-blue-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
