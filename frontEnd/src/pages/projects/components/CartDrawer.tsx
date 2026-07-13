import React from 'react';
import type { CartItem } from '../data';
import { X, Trash2, ShoppingBag, ShieldCheck, Plus, Minus, DollarSign, MapPin, Truck } from 'lucide-react';

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
    customerEmail: string;
    setCustomerEmail: (val: string) => void;
    deliveryAddress: string;
    setDeliveryAddress: (val: string) => void;
    collectionMethod: "pickup" | "delivery";
    setCollectionMethod: (val: "pickup" | "delivery") => void;
    proceedToCheckout: () => void;
    proceedWithCash: () => void;
    paymentPending?: boolean;
    confirmMpesaPayment?: (receipt: string) => void;
    dismissPaymentPending?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
    isOpen, onClose, cart, cartTotal, removeFromCart, updateCartQuantity,
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    customerEmail, setCustomerEmail, deliveryAddress, setDeliveryAddress,
    collectionMethod, setCollectionMethod,
    proceedToCheckout, proceedWithCash,
    paymentPending, confirmMpesaPayment, dismissPaymentPending
}) => {
    const [receiptInput, setReceiptInput] = React.useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex justify-end">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={paymentPending ? undefined : onClose} />
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-[1001] transition-transform duration-300 animate-in slide-in-from-right">

            {paymentPending ? (
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-amber-600" />
                            Confirm Payment
                        </h2>
                        <button onClick={() => { dismissPaymentPending?.(); onClose(); }} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-5">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                            <ShieldCheck size={30} />
                        </div>
                        <div>
                            <p className="text-base font-bold text-slate-800">Payment Initiated</p>
                            <p className="text-sm text-slate-500 mt-1 max-w-xs">
                                Check your phone for the M-Pesa prompt and enter your PIN. If you've already paid, enter the M-Pesa receipt number from the SMS below.
                            </p>
                        </div>
                        <div className="w-full max-w-xs space-y-3">
                            <input
                                type="text"
                                value={receiptInput}
                                onChange={e => setReceiptInput(e.target.value)}
                                placeholder="e.g. QLS1234567"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider"
                            />
                            <button
                                onClick={() => confirmMpesaPayment?.(receiptInput)}
                                disabled={!receiptInput.trim()}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                            >
                                Confirm Payment
                            </button>
                        </div>
                        <button
                            onClick={() => { dismissPaymentPending?.(); onClose(); }}
                            className="text-sm text-slate-400 hover:text-slate-600 underline"
                        >
                            Cancel & Close
                        </button>
                    </div>
                </div>
            ) : (<>
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <ShoppingBag size={20} className="text-blue-600" />
                            Your Cart ({cart.length})
                        </h2>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                            <X size={20} />
                        </button>
                    </div>

                {/* Items list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
                                <ShoppingBag size={28} />
                            </div>
                            <p className="text-slate-500 font-medium">Your cart is empty</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Browse items and add them to your cart.</p>
                            <button className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition-all" onClick={onClose}>
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        cart.map((item, index) => {
                            const product = item.item;
                            const image = product.image_url || product.img || item.img;
                            return (
                                <div key={index} className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                    {image ? (
                                        <img src={image} alt={product.name} className="w-16 h-16 object-cover rounded-xl border border-slate-200/60" />
                                    ) : (
                                        <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold">No Img</div>
                                    )}
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{product.name}</h4>
                                            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                {item.size && <><span>Size: {item.size}</span><span>•</span></>}
                                                <span>Purchase</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => updateCartQuantity(index, -1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors">
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-sm font-bold text-slate-700 min-w-[24px] text-center">{item.quantity || 1}</span>
                                                <button onClick={() => updateCartQuantity(index, 1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors">
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <span className="text-sm font-black text-blue-600">KES {Number(item.price * (item.quantity || 1)).toLocaleString()}</span>
                                            <button onClick={() => removeFromCart(index)} className="w-9 h-9 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer and Checkout Form */}
                {cart.length > 0 && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-5">
                            <span className="text-sm font-bold text-slate-500">Subtotal:</span>
                            <span className="text-xl font-black text-slate-900">KES {cartTotal.toLocaleString()}</span>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name <span className="text-rose-500">*</span></label>
                                <input type="text" required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800 placeholder:text-slate-400"
                                    placeholder="John Maina" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number <span className="text-rose-500">*</span></label>
                                <input type="tel" required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800 placeholder:text-slate-400"
                                    placeholder="0712 345 678" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email</label>
                                <input type="email" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800 placeholder:text-slate-400"
                                    placeholder="you@example.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                            </div>

                            {/* Collection Method */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Collection Method</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setCollectionMethod("pickup")}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                                            collectionMethod === "pickup"
                                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                        }`}
                                    >
                                        <MapPin size={16} /> Pick Up at Church
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCollectionMethod("delivery")}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                                            collectionMethod === "delivery"
                                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                        }`}
                                    >
                                        <Truck size={16} /> Delivery
                                    </button>
                                </div>
                            </div>

                            {/* Delivery Address (only when delivery selected) */}
                            {collectionMethod === "delivery" && (
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Delivery Address <span className="text-rose-500">*</span></label>
                                    <input type="text" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800 placeholder:text-slate-400"
                                        placeholder="Your delivery address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                                </div>
                            )}
                        </div>

                        {/* Payment Buttons */}
                        <div className="space-y-3">
                            <button
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                onClick={proceedToCheckout}
                                disabled={!customerName.trim() || !customerPhone.trim()}
                            >
                                <ShieldCheck size={16} /> Pay via M-Pesa (STK Push)
                            </button>
                            <button
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                onClick={proceedWithCash}
                                disabled={!customerName.trim() || !customerPhone.trim() || (collectionMethod === "delivery" && !deliveryAddress.trim())}
                            >
                                <DollarSign size={16} /> Place Order (Cash on Pickup)
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-slate-400 mt-3">
                            {collectionMethod === "delivery" ? "Delivery available within Kirinyaga County" : "Items available for pickup at CSA Church Bookshop"}
                        </p>
                    </div>
                )}
            </>
            )}
            </div>
        </div>
    );
};
