import { apiClient, USE_MOCK_FALLBACK } from './client';
import { Booking, InventoryHold, Passenger, PaymentDetails } from '../types/booking';
import { MOCK_JOURNEYS } from './mockData';

export async function createHold(journeyId: string): Promise<InventoryHold> {
  try {
    if (!USE_MOCK_FALLBACK) {
      return await apiClient<InventoryHold>('/api/v1/holds', {
        method: 'POST',
        body: JSON.stringify({ journeyId }),
      });
    }
  } catch (err) {
    console.warn('Backend hold creation failed, using client hold simulation:', err);
  }

  // Simulated distributed hold creation
  await new Promise((resolve) => setTimeout(resolve, 500));

  const journey = MOCK_JOURNEYS.find((j) => j.id === journeyId) || MOCK_JOURNEYS[0];
  const expiresAt = new Date(Date.now() + 600 * 1000).toISOString(); // 10 minutes TTL

  return {
    holdId: `hld-${Math.random().toString(36).substring(2, 9)}`,
    journeyId: journey.id,
    expiresAt,
    ttlSecondsRemaining: 600,
    status: 'active',
    heldSegments: journey.segments.map((seg) => ({
      segmentId: seg.segmentId,
      mode: seg.mode,
      provider: seg.provider,
      unitsHeld: 1,
      inventoryId: seg.availability.inventoryId || 'inv-auto-hold',
    })),
  };
}

export async function confirmBooking(payload: {
  journeyId: string;
  holdId?: string;
  passengers: Passenger[];
  contactEmail: string;
  contactPhone: string;
}): Promise<Booking> {
  try {
    if (!USE_MOCK_FALLBACK) {
      return await apiClient<Booking>('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  } catch (err) {
    console.warn('Backend booking confirmation fallback:', err);
  }

  await new Promise((resolve) => setTimeout(resolve, 600));

  const journey = MOCK_JOURNEYS.find((j) => j.id === payload.journeyId) || MOCK_JOURNEYS[0];
  const bookingId = `bkg-${Math.random().toString(36).substring(2, 9)}`;

  return {
    bookingId,
    journeyId: journey.id,
    journey,
    passengers: payload.passengers,
    contactEmail: payload.contactEmail,
    contactPhone: payload.contactPhone,
    totalPrice: journey.totalPrice * (payload.passengers.length || 1),
    currency: journey.currency,
    status: 'held',
    createdAt: new Date().toISOString(),
  };
}

export async function processPayment(payload: {
  bookingId: string;
  method: 'upi' | 'card' | 'netbanking';
  amount: number;
}): Promise<PaymentDetails> {
  try {
    if (!USE_MOCK_FALLBACK) {
      return await apiClient<PaymentDetails>('/api/v1/payments/process', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  } catch (err) {
    console.warn('Backend payment processing fallback:', err);
  }

  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    paymentId: `pay_${Math.random().toString(36).substring(2, 10)}`,
    method: payload.method,
    amount: payload.amount,
    currency: 'INR',
    status: 'success',
    transactionRef: `TXN-KOGNI-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString(),
  };
}
