import React, { useState } from 'react';
import { CreditCard, QrCode, Building, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface PaymentProcessorProps {
  amount: number;
  currency: string;
  onProcessPayment: (method: 'upi' | 'card' | 'netbanking') => Promise<void>;
  isProcessing: boolean;
}

export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  amount,
  currency,
  onProcessPayment,
  isProcessing,
}) => {
  const [method, setMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [vpa, setVpa] = useState('user@oksbi');
  const [cardNumber, setCardNumber] = useState('4532 8821 9912 3041');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('892');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProcessPayment(method);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-4"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
          Synchronized Payment Orchestration
        </h3>
        <span className="flex items-center gap-1 text-xs text-emerald-700 font-mono font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>256-Bit TLS Secured</span>
        </span>
      </div>

      {/* Payment Method Selector */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setMethod('upi')}
          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
            method === 'upi'
              ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs font-bold'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <QrCode className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold">Instant UPI</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('card')}
          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
            method === 'card'
              ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs font-bold'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold">Card</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('netbanking')}
          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
            method === 'netbanking'
              ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs font-bold'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold">NetBanking</span>
        </button>
      </div>

      {/* Method Input Details */}
      <div className="pt-2">
        {method === 'upi' && (
          <div className="flex flex-col gap-2">
            <label className="block text-[11px] font-semibold text-slate-700">
              Virtual Payment Address (UPI VPA)
            </label>
            <input
              type="text"
              required
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              placeholder="username@okhdfcbank"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-2xs"
            />
            <span className="text-[11px] text-slate-500">
              Supports Google Pay, PhonePe, Paytm, CRED & BHIM.
            </span>
          </div>
        )}

        {method === 'card' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Expiry (MM/YY)
                </label>
                <input
                  type="text"
                  required
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  CVV
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}

        {method === 'netbanking' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Select Bank
            </label>
            <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer shadow-2xs">
              <option>HDFC Bank</option>
              <option>State Bank of India</option>
              <option>ICICI Bank</option>
              <option>Axis Bank</option>
              <option>Kotak Mahindra Bank</option>
            </select>
          </div>
        )}
      </div>

      {/* Pay CTA Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className="mt-3 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-98"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Confirming Holds & Processing Payment...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>
              Pay & Confirm ({formatCurrency(amount, currency)})
            </span>
          </>
        )}
      </button>
    </form>
  );
};
