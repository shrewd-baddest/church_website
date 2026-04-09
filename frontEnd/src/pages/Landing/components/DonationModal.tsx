import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, CreditCard, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { initiateSTKPush, initiateGuestSTKPush, getSTKPushStatus } from '../../../api/axiosInstance';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !phone) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiCall = user ? initiateSTKPush : initiateGuestSTKPush;
      const response = await apiCall({
        amount: parseInt(amount),
        phoneNumber: phone
      });

      if (response.data.status === 'success' || response.data.checkoutId) {
        setCheckoutId(response.data.checkoutId);
        setSuccess(true);
      } else {
        setError(response.data.message || 'Payment initiation failed');
      }
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (success && checkoutId && paymentStatus === 'pending') {
      interval = setInterval(async () => {
        try {
          const response = await getSTKPushStatus(checkoutId);
          if (response.data.status === 'paid') {
            setPaymentStatus('paid');
            clearInterval(interval);
          } else if (response.data.status === 'failed') {
            setPaymentStatus('failed');
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [success, checkoutId, paymentStatus]);

  const resetModal = () => {
    setAmount('');
    setPhone('');
    setLoading(false);
    setError('');
    setSuccess(false);
    setCheckoutId(null);
    setPaymentStatus('pending');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative"
        >
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 -tranzlate-y-12 translate-x-12 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50" />
          
          {/* Simple Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-none">Support Us</h2>
              <p className="text-xs text-blue-600 font-bold mt-1 uppercase tracking-widest">Church Donation</p>
            </div>
            <button 
              onClick={resetModal} 
              className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 relative z-10">
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3 items-center"
                  >
                    <AlertCircle size={20} />
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Amount (KES)</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">KSh</div>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-xl font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider ml-1">M-Pesa Number</label>
                  <div className="relative group">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                      type="text"
                      placeholder="07XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-gray-900 font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !amount || !phone}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:shadow-blue-300 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={20} className="stroke-[3px]" />}
                  {loading ? 'Initiating Request...' : 'Donate via M-Pesa'}
                </button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-6">
                <div className="relative mx-auto w-24 h-24">
                  {paymentStatus === 'pending' && (
                     <div className="absolute inset-0 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  )}
                  <div className={`w-24 h-24 ${
                    paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : 
                    paymentStatus === 'failed' ? 'bg-red-100 text-red-600' : 
                    'bg-blue-50 text-blue-600'
                  } rounded-full flex items-center justify-center transition-colors duration-500`}>
                    {paymentStatus === 'paid' ? <CheckCircle2 size={48} /> : 
                     paymentStatus === 'failed' ? <AlertCircle size={48} /> :
                     <Smartphone size={40} />}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900">
                    {paymentStatus === 'paid' ? 'Thank You!' : 
                     paymentStatus === 'failed' ? 'Payment Failed' : 
                     'STK Push Sent'}
                  </h3>
                  <p className="text-gray-500 font-medium">
                    {paymentStatus === 'paid' ? `Your donation of KES ${amount} was received successfully. God bless you!` : 
                     paymentStatus === 'failed' ? 'The payment could not be completed. Please try again or check your account balance.' : 
                     `Please check your phone and enter your M-Pesa PIN to complete your donation of KES ${amount}.`}
                  </p>
                </div>

                <button
                  onClick={resetModal}
                  className={`w-full py-4 ${
                    paymentStatus === 'paid' ? 'bg-green-600 text-white shadow-green-200' :
                    paymentStatus === 'failed' ? 'bg-red-600 text-white shadow-red-200' :
                    'bg-gray-100 text-gray-700'
                  } rounded-2xl font-black hover:opacity-90 transition-all shadow-lg`}
                >
                  {paymentStatus === 'pending' ? 'Cancel' : 'Done'}
                </button>
              </div>
            )}
          </div>
          
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 italic text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
            Secure Payment Gateway • Powered by Daraja
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DonationModal;
