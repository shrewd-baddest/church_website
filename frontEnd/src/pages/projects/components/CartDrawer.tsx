import React from 'react';
import type { CartItem } from '../data';
import { X, Trash2, ShoppingBag, ShieldCheck, Plus, Minus, DollarSign, MapPin, Truck, CreditCard, Wallet, Package, User, Phone, MessageCircle } from 'lucide-react';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    cartTotal: number;
    removeFromCart: (index: number) => void;
    updateCartQuantity: (index: number, delta: number) => void;
    customerName: string;
    setCustomerName: (val: string) => void;
    customerPhone: string;
    setCustomerPhone: (val: string) => void;
    deliveryAddress: string;
    setDeliveryAddress: (val: string) => void;
    collectionMethod: "pickup" | "delivery";
    setCollectionMethod: (val: "pickup" | "delivery") => void;
    proceedToCheckout: () => void;
    proceedWithCash: () => void;
    paymentPending?: boolean;
    confirmMpesaPayment?: (receipt: string) => void;
    dismissPaymentPending?: () => void;
    cashPhone?: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
    isOpen, onClose, cart, cartTotal, removeFromCart, updateCartQuantity,
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    deliveryAddress, setDeliveryAddress,
    collectionMethod, setCollectionMethod,
    proceedToCheckout, proceedWithCash,
    paymentPending, confirmMpesaPayment, dismissPaymentPending,
    cashPhone
}) => {
    const [receiptInput, setReceiptInput] = React.useState('');
    if (!isOpen) return null;
    const displayPhone = cashPhone || '254112051739';
    const isValidPhone = /^\d{10}$/.test(customerPhone.replace(/\s/g, ''));
    const detailsFilled = customerName.trim().length > 0 && isValidPhone;
    const canProceed = detailsFilled && (collectionMethod !== "delivery" || deliveryAddress.trim().length > 0);
    const handlePhoneChange = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 10);
        setCustomerPhone(digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3').trim());
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={paymentPending ? undefined : onClose} />
            <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col z-[1001] overflow-hidden">

            {paymentPending ? (
                <div className="flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <ShieldCheck size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">Confirm Payment</h2>
                                <p className="text-xs text-slate-400">Enter your M-Pesa receipt</p>
                            </div>
                        </div>
                        <button onClick={() => { dismissPaymentPending?.(); onClose(); }} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex flex-col items-center px-8 py-8 text-center space-y-5">
                        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                            <ShieldCheck size={28} />
                        </div>
                        <p className="font-bold text-slate-800">Awaiting M-Pesa Confirmation</p>
                        <p className="text-sm text-slate-500 leading-relaxed">Check your phone, enter your PIN, then enter the receipt number below.</p>
                        <div className="w-full max-w-sm space-y-3">
                            <input type="text" value={receiptInput} onChange={e => setReceiptInput(e.target.value)} placeholder="e.g. QLS1234567"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-bold text-slate-800 tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            <button onClick={() => confirmMpesaPayment?.(receiptInput)} disabled={!receiptInput.trim()}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98]">
                                Confirm
                            </button>
                        </div>
                        <button onClick={() => { dismissPaymentPending?.(); onClose(); }} className="text-sm text-slate-400 hover:text-slate-600 underline transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (<>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <ShoppingBag size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Shopping Cart</h2>
                            <p className="text-xs text-slate-400">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                        <X size={18} />
                    </button>
                </div>

                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                            <Package size={26} />
                        </div>
                        <p className="font-bold text-slate-500">Your cart is empty</p>
                        <p className="text-sm text-slate-400 mt-1">Browse products and add items you'd like.</p>
                        <button className="mt-5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98]" onClick={onClose}>
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <div className="overflow-y-auto max-h-[35vh] px-6 py-3 space-y-2.5">
                        {cart.map((item, index) => {
                            const product = item.item;
                            const image = product.image_url || product.img || item.img;
                            return (
                                <div key={index} className="flex gap-3 p-2.5 bg-white border border-slate-100 rounded-xl">
                                    <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-50">
                                        {image ? (
                                            <img src={image} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={20} /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-bold text-sm text-slate-800 truncate">{product.name}</h4>
                                            <button onClick={() => removeFromCart(index)} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all shrink-0">
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.size && <span className="text-[10px] font-medium text-slate-400">Size: {item.size}</span>}
                                            <span className="text-[10px] font-medium text-slate-400">Purchase</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5">
                                                <button onClick={() => updateCartQuantity(index, -1)} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white transition-all">
                                                    <Minus size={10} />
                                                </button>
                                                <span className="text-xs font-bold text-slate-700 min-w-[20px] text-center">{item.quantity || 1}</span>
                                                <button onClick={() => updateCartQuantity(index, 1)} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white transition-all">
                                                    <Plus size={10} />
                                                </button>
                                            </div>
                                            <span className="text-xs font-black text-slate-900">KES {Number(item.price * (item.quantity || 1)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {cart.length > 0 && (
                    <div className="border-t border-slate-200 shrink-0">
                        <div className="px-6 py-2.5 flex items-center justify-between bg-slate-50">
                            <span className="text-xs font-semibold text-slate-500">Subtotal</span>
                            <span className="text-base font-black text-slate-900">KES {cartTotal.toLocaleString()}</span>
                        </div>

                        <div className="px-6 py-3 space-y-3">
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                                    <div className="relative">
                                        <User size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="John Maina" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone No.</label>
                                    <div className="relative">
                                        <Phone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="tel" className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="0712 345 678" value={customerPhone} onChange={(e) => handlePhoneChange(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2.5">
                                <button type="button" onClick={() => setCollectionMethod("pickup")}
                                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                        collectionMethod === "pickup" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                                    }`}>
                                    <MapPin size={12} /> Pick Up
                                </button>
                                <button type="button" onClick={() => setCollectionMethod("delivery")}
                                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                        collectionMethod === "delivery" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                                    }`}>
                                    <Truck size={12} /> Delivery
                                </button>
                            </div>

                            {collectionMethod === "delivery" && (
                                <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Delivery address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                            )}
                        </div>

                        <div className="px-6 pb-4 space-y-2">
                            <button onClick={proceedToCheckout} disabled={!canProceed}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                <CreditCard size={14} /> Pay via M-Pesa
                            </button>
                            <button onClick={proceedWithCash} disabled={!canProceed}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                <Wallet size={14} /> Cash on Pickup
                            </button>
                            {!detailsFilled && (
                                <p className="text-center text-[10px] text-amber-600 font-medium">
                                    {!customerName.trim() ? 'Enter your name' : 'Enter a valid 10-digit phone number'}
                                </p>
                            )}
                            {detailsFilled && !canProceed && collectionMethod === "delivery" && (
                                <p className="text-center text-[10px] text-amber-600 font-medium">Enter your delivery address</p>
                            )}
                            <a
                                href={`https://wa.me/${displayPhone.replace(/\D/g, '')}?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20an%20order.`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 hover:bg-emerald-100 transition-all group"
                            >
                                <MessageCircle size={18} className="text-emerald-500 shrink-0" />
                                <div className="text-xs">
                                    <p className="font-semibold text-emerald-800">Chat with us on WhatsApp</p>
                                    <p className="text-emerald-500 font-bold mt-0.5 group-hover:underline">{displayPhone}</p>
                                </div>
                            </a>
                        </div>
                    </div>
                )}
            </>
            )}
            </div>
        </div>
    );
};
