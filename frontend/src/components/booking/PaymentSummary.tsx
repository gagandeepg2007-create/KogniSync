import React from 'react';
import { PaymentProcessor } from './PaymentProcessor';

interface PaymentSummaryProps {
  amount: number;
  currency: string;
  onProcessPayment: (method: 'upi' | 'card' | 'netbanking') => Promise<void>;
  isProcessing: boolean;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = (props) => {
  return (
    <div className="flex flex-col gap-4">
      <PaymentProcessor {...props} />
    </div>
  );
};

export { PaymentProcessor };
export default PaymentSummary;
