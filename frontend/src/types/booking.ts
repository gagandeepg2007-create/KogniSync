import { Journey } from './journey';

export interface Passenger {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  idNumber?: string;
}

export interface InventoryHold {
  holdId: string;
  journeyId: string;
  expiresAt: string; // ISO timestamp
  ttlSecondsRemaining: number;
  status: 'active' | 'expired' | 'released' | 'consumed';
  heldSegments: {
    segmentId: string;
    mode: string;
    provider: string;
    unitsHeld: number;
    inventoryId: string;
  }[];
}

export interface PaymentDetails {
  paymentId: string;
  method: 'upi' | 'card' | 'netbanking';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  transactionRef?: string;
  timestamp: string;
}

export interface Booking {
  bookingId: string;
  journeyId: string;
  journey: Journey;
  passengers: Passenger[];
  hold?: InventoryHold;
  payment?: PaymentDetails;
  status: 'pending_hold' | 'held' | 'confirmed' | 'payment_failed' | 'cancelled';
  createdAt: string;
  totalPrice: number;
  currency: string;
  contactEmail: string;
  contactPhone: string;
}
