import React from 'react';
import { Plane, Train, Bus, Car, TrainFront, Footprints } from 'lucide-react';
import { TransportMode } from '../../types/journey';
import { getModeMeta, cn } from '../../lib/utils';

interface ModeIconProps {
  mode: TransportMode;
  className?: string;
  size?: number;
  showBadge?: boolean;
}

export const ModeIcon: React.FC<ModeIconProps> = ({
  mode,
  className,
  size = 18,
  showBadge = false,
}) => {
  const meta = getModeMeta(mode);

  const renderIcon = () => {
    switch (mode) {
      case 'flight':
        return <Plane size={size} />;
      case 'train':
        return <Train size={size} />;
      case 'bus':
        return <Bus size={size} />;
      case 'cab':
        return <Car size={size} />;
      case 'metro':
        return <TrainFront size={size} />;
      case 'walk':
        return <Footprints size={size} />;
    }
  };

  if (showBadge) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
          meta.badgeBg,
          meta.badgeText,
          meta.borderColor,
          className
        )}
      >
        {renderIcon()}
        <span>{meta.label}</span>
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center justify-center', meta.badgeText, className)}>
      {renderIcon()}
    </span>
  );
};
