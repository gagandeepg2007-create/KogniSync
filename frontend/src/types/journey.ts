export type TransportMode =
  | 'flight'
  | 'train'
  | 'bus'
  | 'cab'
  | 'metro'
  | 'walk';

export interface Location {
  id: string;
  name: string;
  city: string;
  code?: string;
  type: 'airport' | 'railway_station' | 'bus_terminal' | 'metro_station' | 'landmark' | 'address';
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Money {
  amount: number;
  currency: string;
}

export interface OptimizationWeights {
  cost: number;        // e.g. 0.40
  duration: number;    // e.g. 0.30
  comfort: number;     // e.g. 0.20
  carbon: number;      // e.g. 0.10
}

export interface JourneySegment {
  segmentId: string;
  mode: TransportMode;
  provider: string;
  vehicleName?: string;
  vehicleNumber?: string;
  origin: Location;
  destination: Location;
  departureTime: string; // ISO string
  arrivalTime: string;   // ISO string
  durationMinutes: number;
  price: number;
  currency: string;
  availability: {
    status: 'available' | 'limited' | 'waitlist' | 'sold_out';
    remainingUnits?: number;
    inventoryId?: string;
  };
  distanceKm: number;
  carbonKg: number;
  comfortScore: number; // 1-10 scale
  seatClass?: string;
  notes?: string;
  transferBufferMinutes?: number;
}

export type RecommendationCategory =
  | 'cheapest'
  | 'fastest'
  | 'best_value'
  | 'greenest'
  | 'comfortable'
  | 'all';

export interface Journey {
  id: string;
  title: string;
  origin: Location;
  destination: Location;
  departureTime: string;
  arrivalTime: string;
  totalDurationMinutes: number;
  totalPrice: number;
  currency: string;
  totalTransfers: number;
  modes: TransportMode[];
  segments: JourneySegment[];
  carbonKg: number;
  comfortScore: number; // 1-10
  recommendationCategory: RecommendationCategory;
  aiExplanation: {
    summary: string;
    tradeOffs: string[];
    rankReason: string;
    score: number; // 0-100 composite score
    costVsFastestSaving?: number;
    durationDiffMinutes?: number;
  };
  bookingFeasibility: {
    holdSupported: boolean;
    concurrencySafe: boolean;
    holdTtlSeconds: number;
  };
}

export interface JourneyRecommendation {
  journeyId: string;
  rank: number;
  category: RecommendationCategory;
  score: number;
  explanation: string;
  weights: OptimizationWeights;
}

export interface TravelRequest {
  naturalLanguageQuery?: string;
  origin: string;
  destination: string;
  departureDate: string;
  preferredArrivalBefore?: string;
  preferredDepartureAfter?: string;
  budgetMax?: number;
  passengersCount: number;
  weights: OptimizationWeights;
}
