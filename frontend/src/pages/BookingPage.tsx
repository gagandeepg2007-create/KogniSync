import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getJourneyById } from '../api/journey';
import { createHold, confirmBooking, processPayment } from '../api/booking';
import { buildTripFromBooking } from '../api/trips';
import { Passenger, InventoryHold } from '../types/booking';
import { BookingSummary } from '../components/booking/BookingSummary';
import { HoldTimer } from '../components/booking/HoldTimer';
import { PassengerForm } from '../components/booking/PassengerForm';
import { PaymentProcessor } from '../components/booking/PaymentProcessor';
import { ArrowLeft, AlertCircle, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();

  // Fetch Journey
  const { data: journey, isLoading: journeyLoading } = useQuery({
    queryKey: ['journey', journeyId],
    queryFn: () => getJourneyById(journeyId || ''),
    enabled: !!journeyId,
  });

  // Hold State
  const [hold, setHold] = useState<InventoryHold | null>(null);
  const [isHolding, setIsHolding] = useState<boolean>(true);
  const [holdError, setHoldError] = useState<string | null>(null);

  // Booking Flow Steps: 'holding' | 'details' | 'payment'
  const [step, setStep] = useState<'details' | 'payment'>('details');

  // Passenger & Contact State
  const [contactEmail, setContactEmail] = useState('rahul.sharma@example.com');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      id: 'pax-1',
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+91 98765 43210',
      age: 29,
      gender: 'male',
    },
  ]);

  // Payment Processing State
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Automatically acquire hold on mount
  useEffect(() => {
    if (!journeyId) return;

    let mounted = true;
    const acquireHold = async () => {
      setIsHolding(true);
      setHoldError(null);
      try {
        const activeHold = await createHold(journeyId);
        if (mounted) {
          setHold(activeHold);
        }
      } catch {
        if (mounted) {
          setHoldError('Failed to lock inventory units across carriers. Please retry.');
        }
      } finally {
        if (mounted) setIsHolding(false);
      }
    };

    acquireHold();
    return () => {
      mounted = false;
    };
  }, [journeyId]);

  const handleHoldExpired = () => {
    setHold(null);
    setHoldError('Your 10-minute inventory hold has expired. Please re-select the journey.');
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    for (const p of passengers) {
      if (!p.fullName.trim()) {
        alert('Please provide full name for each traveler.');
        return;
      }
    }
    setStep('payment');
  };

  const handleProcessPayment = async (method: 'upi' | 'card' | 'netbanking') => {
    if (!journey) return;

    setIsProcessingPayment(true);
    try {
      // Step 1: Create Booking
      const booking = await confirmBooking({
        journeyId: journey.id,
        holdId: hold?.holdId,
        passengers,
        contactEmail,
        contactPhone,
      });

      // Step 2: Process Payment
      const payment = await processPayment({
        bookingId: booking.bookingId,
        method,
        amount: booking.totalPrice * 1.05, // includes GST
      });

      // Step 3: Build Unified Trip Pass
      const trip = buildTripFromBooking(booking, payment);

      // Step 4: Navigate to confirmation
      navigate(`/trips/${trip.tripId}`);
    } catch {
      alert('Payment processing failed. Your held seats remain preserved until TTL expiry.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (journeyLoading || isHolding) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <h3 className="text-base font-bold text-slate-900">
          Securing Multi-Vendor Inventory Holds...
        </h3>
        <p className="text-xs text-slate-500">
          Acquiring atomic locks in PostgreSQL and setting 10-minute distributed hold in Redis 7.
        </p>
      </div>
    );
  }

  if (holdError || !journey) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900">Inventory Hold Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          {holdError || 'Could not acquire hold for the requested segments.'}
        </p>
        <Link
          to="/plan"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
        >
          Return to Journey Alternatives
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-6">
      {/* Header & Flow Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-display">
              Orchestrate Booking
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              {journey.origin.city} → {journey.destination.city} · Hold ID:{' '}
              <code className="text-blue-700 font-semibold">{hold?.holdId}</code>
            </span>
          </div>
        </div>

        {/* Workflow Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> 1. Inventory Held
          </span>
          <span className="text-slate-300">→</span>
          <span
            className={`px-2.5 py-1 rounded-lg font-semibold ${
              step === 'details'
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'text-slate-500'
            }`}
          >
            2. Traveler Details
          </span>
          <span className="text-slate-300">→</span>
          <span
            className={`px-2.5 py-1 rounded-lg font-semibold ${
              step === 'payment'
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'text-slate-400'
            }`}
          >
            3. Payment
          </span>
        </div>
      </div>

      {/* Live Hold Countdown Timer */}
      <HoldTimer
        initialSeconds={hold?.ttlSecondsRemaining || 600}
        onExpire={handleHoldExpired}
      />

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Step Form */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {step === 'details' ? (
            <div className="flex flex-col gap-5">
              <PassengerForm
                passengers={passengers}
                onChange={setPassengers}
                contactEmail={contactEmail}
                onContactEmailChange={setContactEmail}
                contactPhone={contactPhone}
                onContactPhoneChange={setContactPhone}
              />

              {/* Terms and Confirm Booking CTA */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-3">
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    By confirming this booking, your inventory hold will be securely locked across all intermodal carriers until checkout completes.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>Confirm Booking & Proceed to Payment</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Payment Method
                </span>
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-xs text-blue-700 hover:underline font-semibold"
                >
                  ← Edit Traveler Details
                </button>
              </div>

              <PaymentProcessor
                amount={journey.totalPrice * Math.max(passengers.length, 1) * 1.05}
                currency={journey.currency}
                onProcessPayment={handleProcessPayment}
                isProcessing={isProcessingPayment}
              />
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Journey & Segment Breakdown */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <BookingSummary journey={journey} passengers={passengers} />
        </div>
      </div>
    </div>
  );
};
