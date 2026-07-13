import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../api/config';
import { SACRAMENTAL_CATEGORIES } from '../pages/projects/pages/data';
import type { CartItem, SacramentalCategory } from '../pages/projects/pages/data';

export interface HireItem {
  id: number;
  name: string;
  category?: string;
  price: number;
  quantity: number;
}
import apiService from '../pages/Landing/services/api';

interface ToastMessage {
    id: number;
    message: string;
}

interface AppContextType {
    // Products & Config
    products: any[];
    apiMessages: Record<string, string[]>;
    sliderImages: any[];
    isLoading: boolean;

    // Theme
    isDarkMode: boolean;
    toggleDarkMode: () => void;

    // Cart
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (index: number) => void;
    updateCartQuantity: (index: number, delta: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartItemsCount: number;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;

    // Checkout
    customerName: string;
    setCustomerName: (name: string) => void;
    customerPhone: string;
    setCustomerPhone: (phone: string) => void;
    customerEmail: string;
    setCustomerEmail: (email: string) => void;
    deliveryAddress: string;
    setDeliveryAddress: (address: string) => void;
    collectionMethod: "pickup" | "delivery";
    setCollectionMethod: (method: "pickup" | "delivery") => void;
    proceedToCheckout: () => Promise<void>;
    proceedWithCash: () => Promise<void>;

    // Toasts
    toasts: ToastMessage[];
    showToast: (message: string) => void;

    // Global Filters/States
    sacCategory: SacramentalCategory;
    setSacCategory: (cat: SacramentalCategory) => void;
    sectionBanners: Record<string, { img: string; title: string; subtitle: string }> | null;

    // Hire Cart
    hireItems: HireItem[];
    addToHire: (item: HireItem) => void;
    removeFromHire: (name: string) => void;
    updateHireQty: (name: string, delta: number) => void;
    clearHire: () => void;
    hireItemsCount: number;
    isHireModalOpen: boolean;
    setHireModalOpen: (open: boolean) => void;

    // Auth
    isAdmin: boolean;
    setIsAdmin: (isAdmin: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [apiMessages, setApiMessages] = useState<Record<string, string[]>>({});
    const [sliderImages, setSliderImages] = useState<any[]>([]);
    const [sectionBanners, setSectionBanners] = useState<Record<string, { img: string; title: string; subtitle: string }> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [sacCategory, setSacCategory] = useState<SacramentalCategory>('all');
    const [cart, setCart] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('csa_cart');
        return saved ? JSON.parse(saved) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [collectionMethod, setCollectionMethod] = useState<"pickup" | "delivery">("pickup");
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [hireItems, setHireItems] = useState<HireItem[]>([]);
    const [isHireModalOpen, setHireModalOpen] = useState(false);

    const addToHire = (item: HireItem) => {
        setHireItems(prev => {
            const existing = prev.find(i => i.name === item.name);
            if (existing) {
                return prev.map(i =>
                    i.name === item.name ? { ...i, quantity: i.quantity + item.quantity } : i
                );
            }
            return [...prev, item];
        });
    };

    const removeFromHire = (name: string) => {
        setHireItems(prev => prev.filter(i => i.name !== name));
    };

    const updateHireQty = (name: string, delta: number) => {
        setHireItems(prev => prev.map(i => {
            if (i.name !== name) return i;
            const newQty = i.quantity + delta;
            return newQty <= 0 ? i : { ...i, quantity: newQty };
        }));
    };

    const clearHire = () => setHireItems([]);

    const hireItemsCount = hireItems.reduce((sum, i) => sum + (i.quantity || 0), 0);

    const [isAdmin, setIsAdmin] = useState<boolean>(() => {
        return localStorage.getItem('csa_admin_auth') === 'true';
    });

    // Sync Dark Mode state to body class
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    // Persist Cart
    useEffect(() => {
        localStorage.setItem('csa_cart', JSON.stringify(cart));
    }, [cart]);

    // Persist Admin Auth
    useEffect(() => {
        if (isAdmin) {
            localStorage.setItem('csa_admin_auth', 'true');
        } else {
            localStorage.removeItem('csa_admin_auth');
        }
    }, [isAdmin]);

    useEffect(() => {
        const apiBase = BASE_URL || (import.meta.env.DEV ? "http://localhost:3001/api" : undefined);

        if (!apiBase) {
            console.warn('AppContext: No backend URL configured for products/config loading.');
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const [prodRes, configRes] = await Promise.all([
                    fetch(`${apiBase}/products`),
                    fetch(`${apiBase}/config`)
                ]);
                if (prodRes.ok) {
                    const prodData = await prodRes.json();
                    setProducts(prodData);
                }
                if (configRes.ok) {
                    const config = await configRes.json();
                    if (config.MESSAGES) setApiMessages(config.MESSAGES);
                    if (config.SLIDER_IMAGES) setSliderImages(config.SLIDER_IMAGES);
                    if (config.SECTION_BANNERS) setSectionBanners(config.SECTION_BANNERS);
                }
            } catch (err) {
                console.error('Failed to fetch data', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const showToast = (message: string) => {
        const newToast = { id: Date.now(), message };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 3000);
    };

    const updateCartQuantity = (indexToUpdate: number, delta: number) => {
        setCart(prev => prev.map((item, index) => {
            if (index !== indexToUpdate) return item;
            const newQty = (item.quantity || 1) + delta;
            if (newQty <= 0) return item;
            return { ...item, quantity: newQty };
        }));
    };

    const addToCart = (item: CartItem) => {
        setCart(prev => {
            // If same item exists, increment quantity
            const existingIdx = prev.findIndex(p =>
                p.item?.name === item.item?.name &&
                p.item?.price === item.price &&
                p.category === item.category
            );
            if (existingIdx >= 0) {
                return prev.map((p, i) =>
                    i === existingIdx
                        ? { ...p, quantity: (p.quantity || 1) + 1 }
                        : p
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        setIsCartOpen(true);
        showToast(`Added ${item.item?.name || 'item'} to cart`);
    };

    const removeFromCart = (indexToRemove: number) => {
        setCart(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((total, item) => {
        return total + (item.price * (item.quantity || item.rentalDays || 1));
    }, 0);

    const cartItemsCount = cart.reduce((count, item) => count + (item.quantity || 1), 0);

    const proceedToCheckout = async () => {
        if (cart.length === 0) return;
        if (!customerName.trim() || !customerPhone.trim()) {
            showToast("Please provide your name and phone number");
            return;
        }

        // Standardize phone number to 254 format for Safaricom
        let phone = customerPhone.trim();
        if (phone.startsWith('0')) phone = '254' + phone.slice(1);
        else if (phone.startsWith('+')) phone = phone.slice(1);

        let checkoutId: string | null = null;
        let orderCreated = false;

        try {
            showToast("Initiating M-Pesa payment... Please check your phone.");
            const response = await apiService.initiateStkPush(phone, cartTotal, cart);
            
            if (response && response.checkoutId) {
                checkoutId = response.checkoutId;

                // Create a pending order linked to this checkout
                try {
                    await apiService.createRecord('orders', {
                        amount: cartTotal,
                        phone,
                        customer_name: customerName.trim(),
                        customer_email: customerEmail.trim() || null,
                        payment_method: 'mpesa',
                        collection_method: collectionMethod,
                        delivery_address: collectionMethod === 'delivery' ? deliveryAddress.trim() : null,
                        checkout_id: checkoutId,
                        items: cart,
                        status: 'pending',
                    });
                    orderCreated = true;
                } catch (e) {
                    console.error("Failed to create pending order:", e);
                    showToast("Warning: Order record failed, but payment will proceed.");
                }
                
                // Poll for status - longer timeout (3 min) for M-Pesa callbacks
                let attempts = 0;
                const maxAttempts = 36; // 3 minutes (5s * 36)
                const pollInterval = setInterval(async () => {
                    attempts++;
                    try {
                        const statusRes = await apiService.checkStkStatus(checkoutId!);
                        
                        if (statusRes.status === 'paid') {
                            clearInterval(pollInterval);
                            showToast("Payment successful! Order confirmed.");
                            const orderId = statusRes.order_id || statusRes.orderId || checkoutId;
                            // Clear cart and customer info
                            setCart([]);
                            setIsCartOpen(false);
                            setCustomerName('');
                            setCustomerPhone('');
                            setCustomerEmail('');
                            setDeliveryAddress('');
                            // Navigate to confirmation
                            navigate(`/order-confirmation?order_id=${orderId}&method=mpesa`);
                        } else if (statusRes.status === 'failed') {
                            clearInterval(pollInterval);
                            showToast(`Payment failed: ${statusRes.result_desc || 'Cancelled'}`);
                        }
                    } catch (e) {
                        console.error("Error polling:", e);
                    }
                    
                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        if (checkoutId) {
                            showToast("Payment taking longer than expected. Check your phone for M-Pesa prompt. Order will update when payment completes.");
                        } else {
                            showToast("Payment timeout. Please try again.");
                        }
                    }
                }, 5000);
            } else {
                showToast("Failed to initiate payment. Please try again.");
            }
        } catch (err: any) {
            console.error("Checkout error:", err);
            showToast(err?.response?.data?.error || "An error occurred during checkout.");
        }
    };

    const proceedWithCash = async () => {
        if (cart.length === 0) return;
        if (!customerName.trim() || !customerPhone.trim()) {
            showToast("Please provide your name and phone number");
            return;
        }

        let phone = customerPhone.trim();

        try {
            const order = await apiService.createRecord('orders', {
                amount: cartTotal,
                phone,
                customer_name: customerName.trim(),
                customer_email: customerEmail.trim() || null,
                payment_method: 'cash',
                collection_method: collectionMethod,
                delivery_address: collectionMethod === 'delivery' ? deliveryAddress.trim() : null,
                items: cart,
                status: 'pending',
            });

            const orderRef = order?.order_reference || order?.id;
            setCart([]);
            setIsCartOpen(false);
            setCustomerName('');
            setCustomerPhone('');
            setCustomerEmail('');
            setDeliveryAddress('');
            setCollectionMethod('pickup');
            navigate(`/order-confirmation?order_id=${orderRef}&method=cash`);
        } catch (err: any) {
            console.error("Cash checkout error:", err);
            showToast(err?.response?.data?.error || "Failed to place order. Try again.");
        }
    };

    return (
        <AppContext.Provider value={{
            products, apiMessages, sliderImages, sectionBanners, isLoading,
            isDarkMode, toggleDarkMode,
            cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartItemsCount,
            isCartOpen, setIsCartOpen,
            customerName, setCustomerName, customerPhone, setCustomerPhone,
            customerEmail, setCustomerEmail, deliveryAddress, setDeliveryAddress,
            collectionMethod, setCollectionMethod,
            proceedToCheckout, proceedWithCash,
            toasts, showToast,
            sacCategory, setSacCategory,
            hireItems, addToHire, removeFromHire, updateHireQty, clearHire, hireItemsCount,
            isHireModalOpen, setHireModalOpen,
            isAdmin, setIsAdmin
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
