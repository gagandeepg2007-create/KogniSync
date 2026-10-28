import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TransportMode } from '../types/journey';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export interface ModeMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentColor: string;
}

export function getModeMeta(mode: TransportMode): ModeMeta {
  switch (mode) {
    case 'flight':
      return {
        label: 'Flight',
        badgeBg: 'bg-sky-50',
        badgeText: 'text-sky-700',
        borderColor: 'border-sky-200',
        accentColor: '#0284c7',
      };
    case 'train':
      return {
        label: 'Train',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-800',
        borderColor: 'border-amber-200',
        accentColor: '#d97706',
      };
    case 'bus':
      return {
        label: 'Bus',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-800',
        borderColor: 'border-emerald-200',
        accentColor: '#059669',
      };
    case 'cab':
      return {
        label: 'Cab',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-800',
        borderColor: 'border-blue-200',
        accentColor: '#2563eb',
      };
    case 'metro':
      return {
        label: 'Metro',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-800',
        borderColor: 'border-purple-200',
        accentColor: '#7c3aed',
      };
    case 'walk':
      return {
        label: 'Walk',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-700',
        borderColor: 'border-slate-200',
        accentColor: '#64748b',
      };
  }
}
