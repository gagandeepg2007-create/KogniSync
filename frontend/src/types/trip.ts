import { Journey, TransportMode } from './journey';
import { Passenger, PaymentDetails } from './booking';

export interface TripSegmentTicket {
  segmentId: string;
  mode: TransportMode;
  provider: string;
  ticketNumber: string;
  seatOrBerth?: string;
  gateOrPlatform?: string;
  originName: string;
  destinationName: string;
  departureTime: string;
  arrivalTime: string;
  qrPayload: string;
  status: 'confirmed' | 'checked_in' | 'boarding' | 'completed';
}

export interface Trip {
  tripId: string;
  bookingId: string;
  pnr: string;
  qrCodeUrl: string;
  createdAt: string;
  journey: Journey;
  passengers: Passenger[];
  tickets: TripSegmentTicket[];
  payment: PaymentDetails;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  calendarSyncUrl?: string;
  supportHotline: string;
}
