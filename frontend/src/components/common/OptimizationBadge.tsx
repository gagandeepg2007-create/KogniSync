import React from 'react';
import { Sparkles, Zap, DollarSign, Leaf, Award, ShieldCheck } from 'lucide-react';
import { RecommendationCategory } from '../../types/journey';
import { cn } from '../../lib/utils';

interface OptimizationBadgeProps {
  category: RecommendationCategory;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const OptimizationBadge: React.FC<OptimizationBadgeProps> = ({
  category,
  className,
  size = 'md',
}) => {
  const getBadgeConfig = () => {
    switch (category) {
      case 'cheapest':
        return {
          label: 'Cheapest',
          icon: <DollarSign className="w-3.5 h-3.5 text-emerald-600" />,
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm',
        };
      case 'fastest':
        return {
          label: 'Fastest',
          icon: <Zap className="w-3.5 h-3.5 text-amber-600" />,
          classes: 'bg-amber-50 text-amber-800 border-amber-200 shadow-sm',
        };
      case 'best_value':
        return {
          label: 'Best Value',
          icon: <Sparkles className="w-3.5 h-3.5 text-blue-600" />,
          classes: 'bg-blue-50 text-blue-800 border-blue-200 shadow-sm',
        };
      case 'greenest':
        return {
          label: 'Greenest',
          icon: <Leaf className="w-3.5 h-3.5 text-teal-600" />,
          classes: 'bg-teal-50 text-teal-800 border-teal-200 shadow-sm',
        };
      case 'comfortable':
        return {
          label: 'Most Comfortable',
          icon: <Award className="w-3.5 h-3.5 text-purple-600" />,
          classes: 'bg-purple-50 text-purple-800 border-purple-200 shadow-sm',
        };
      default:
        return {
          label: 'Alternative',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />,
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-3 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border tracking-wide uppercase',
        config.classes,
        sizeClasses,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
