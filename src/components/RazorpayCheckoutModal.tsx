import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  ShieldCheck,
  CreditCard,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Smartphone,
  Building2,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  orderData: {
    orderId: string;
    key: string;
    amount: number;
    currency: string;
    mode: string;
  } | null;
  currentUser: User | null;
  onSuccess: (result: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => Promise<void>;
  onFailure: (errorMsg: string) => void;
  onCancel: () => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  orderData,
  currentUser,
  onSuccess,
  onFailure,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('user@upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'idle' | 'gateway' | 'verifying'>('idle');
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen || !orderData) return null;

  const displayAmount = (orderData.amount / 100).toFixed(2);

  const handlePayNow = async () => {
    setIsProcessing(true);
    setLocalError(null);
    setProcessingStep('gateway');

    try {
      // Step 1: Gateway processing delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setProcessingStep('verifying');

      // Step 2: Generate payment response with signature
      const paymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Compute mock test signature or pass payment payload
      const mockSignature = `sig_test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Step 3: Pass to parent handler which verifies on server /api/payment/verify-payment
      await onSuccess({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderData.orderId,
        razorpay_signature: mockSignature,
      });
    } catch (err: any) {
      console.error('Razorpay Checkout execution error:', err);
      setLocalError(err.message || 'Payment verification failed on server.');
      setIsProcessing(false);
      setProcessingStep('idle');
    }
  };

  const handleSimulateFailure = () => {
    onFailure('Payment was declined by the issuing bank or payment gateway.');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                R
              </div>
              <div>
                <span className="font-extrabold text-sm text-white block leading-tight">Razorpay Gateway</span>
                <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 inline-block mt-0.5">
                  {orderData.mode || 'TEST MODE / SANDBOX'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Order Summary Box */}
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Sahil Edits Lifetime Premium</span>
                <span className="text-xs font-mono text-slate-500">{orderData.orderId}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400">₹{displayAmount}</span>
                <span className="text-[10px] text-emerald-400 block font-semibold">One-time payment</span>
              </div>
            </div>

            {/* Account details */}
            <div className="text-xs text-slate-300 space-y-1 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Account:</span>
                <span className="font-semibold text-white">{currentUser?.email || 'Authenticated User'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant:</span>
                <span className="font-medium text-slate-200">Sahil Edits Inc.</span>
              </div>
            </div>

            {/* Error Message if any */}
            {localError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{localError}</span>
              </div>
            )}

            {/* Processing State Indicator */}
            {isProcessing ? (
              <div className="py-8 text-center space-y-4">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {processingStep === 'gateway' ? 'Processing Payment with Razorpay...' : 'Verifying Payment on Server...'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {processingStep === 'gateway'
                      ? 'Establishing secure SSL session with bank...'
                      : 'Checking cryptographic signature and activating Premium...'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Payment Methods */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Select Payment Method
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('upi')}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-2 cursor-pointer ${
                        selectedMethod === 'upi'
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold">UPI / GPay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('card')}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-2 cursor-pointer ${
                        selectedMethod === 'card'
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold">Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('netbanking')}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-2 cursor-pointer ${
                        selectedMethod === 'netbanking'
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold">Netbanking</span>
                    </button>
                  </div>

                  {selectedMethod === 'upi' && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="Enter UPI ID (e.g. mobile@upi)"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handlePayNow}
                    className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{displayAmount} &amp; Complete Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSimulateFailure}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Simulate Failure
                    </button>

                    <button
                      type="button"
                      onClick={onCancel}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Cancel Payment
                    </button>
                  </div>
                </div>

                {/* Secure footer notice */}
                <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>256-bit SSL Encrypted · Server Verified Payment</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
