import { apiClient, USE_MOCK_FALLBACK } from './client';
import { Trip, TripSegmentTicket } from '../types/trip';
import { Booking, PaymentDetails } from '../types/booking';
import { MOCK_CONFIRMED_TRIP } from './mockData';

export async function getTripById(tripId: string): Promise<Trip | null> {
  try {
    if (!USE_MOCK_FALLBACK) {
      return await apiClient<Trip>(`/api/v1/trips/${tripId}`);
    }
  } catch (err) {
    console.warn('Backend trip fetch fallback:', err);
  }

  await new Promise((resolve) => setTimeout(resolve, 300));

  if (tripId === MOCK_CONFIRMED_TRIP.tripId || tripId.startsWith('trp-')) {
    return {
      ...MOCK_CONFIRMED_TRIP,
      tripId,
    };
  }

  return MOCK_CONFIRMED_TRIP;
}

export function buildTripFromBooking(booking: Booking, payment: PaymentDetails): Trip {
  const pnr = `KOGNI-${booking.journey.origin.city.slice(0, 3).toUpperCase()}${booking.journey.destination.city.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const tickets: TripSegmentTicket[] = booking.journey.segments.map((seg, idx) => ({
    segmentId: seg.segmentId,
    mode: seg.mode,
    provider: seg.provider,
    ticketNumber: `TKT-${seg.mode.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
    seatOrBerth: seg.seatClass ? `${seg.seatClass} · Seat ${12 + idx * 4}` : undefined,
    gateOrPlatform: seg.mode === 'flight' ? 'Gate 4B · Terminal 1' : seg.mode === 'train' ? 'Platform 1' : 'Bay 3',
    originName: seg.origin.name,
    destinationName: seg.destination.name,
    departureTime: seg.departureTime,
    arrivalTime: seg.arrivalTime,
    qrPayload: `${pnr}-SEG-${idx + 1}`,
    status: 'confirmed',
  }));

  return {
    tripId: `trp-${Math.random().toString(36).substring(2, 9)}`,
    bookingId: booking.bookingId,
    pnr,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pnr)}`,
    createdAt: new Date().toISOString(),
    journey: booking.journey,
    passengers: booking.passengers,
    tickets,
    payment,
    status: 'confirmed',
    supportHotline: '+91 1800-KOGNI-SYNC',
    calendarSyncUrl: '#calendar-sync',
  };
}
