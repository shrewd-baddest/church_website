import React, { useState } from 'react';
import { TshirtOrder } from '../data/jumuiyaData';
import { useData } from '../context/DataContext';
import { FaTshirt, FaShoppingCart, FaCheckCircle, FaUser, FaPhone, FaRuler, FaLayerGroup } from 'react-icons/fa';
import './TabsSystem.css';

interface TshirtsTabProps {
    jumuiyaId: string;
    orders: TshirtOrder[];
    jumuiyaColor: string;
}

const TshirtsTab: React.FC<TshirtsTabProps> = ({ jumuiyaId, orders, jumuiyaColor }) => {
    const { addTshirtOrder } = useData();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        holderName: '',
        payerName: '',
        phone: '',
        size: 'M' as TshirtOrder['size'],
        quantity: 1
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const sizes: TshirtOrder['size'][] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' ? parseInt(value) || 1 : value
        }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.holderName.trim()) newErrors.holderName = 'T-shirt holder name is required';
        if (!formData.payerName.trim()) newErrors.payerName = 'Payer name is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const newOrder: TshirtOrder = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData,
                submittedAt: new Date().toISOString()
            };
            addTshirtOrder(jumuiyaId, newOrder);
            setIsSubmitted(true);
        }
    };

    return (
        <div className="tab-system-content" style={{ '--jumuiya-color': jumuiyaColor } as React.CSSProperties}>
            <div className="tab-header-wrap">
                <div className="header-text">
                    <h1 className="page-title">Jumuiya T-Shirts</h1>
                    <p className="page-description">Get your official Jumuiya t-shirt and represent our community with pride.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-2xl)', alignItems: 'start' }}>
                {/* Order Form */}
                <div className="tab-card glass-card animate-fade" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', background: jumuiyaColor, color: 'white', textAlign: 'center' }}>
                        <FaTshirt style={{ fontSize: '3rem', marginBottom: '12px' }} />
                        <h3 style={{ margin: 0 }}>Place Your Order</h3>
                    </div>

                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                            <div className="form-field-group">
                                <label><FaUser style={{ marginRight: '8px' }} /> T-shirt Holder Name</label>
                                <input
                                    className="form-input-premium"
                                    name="holderName"
                                    value={formData.holderName}
                                    onChange={handleInputChange}
                                    placeholder="Enter user's name"
                                />
                                {errors.holderName && <small style={{ color: 'var(--urgent)', marginTop: '4px', display: 'block' }}>{errors.holderName}</small>}
                            </div>

                            <div className="form-field-group">
                                <label><FaShoppingCart style={{ marginRight: '8px' }} /> Payer Name</label>
                                <input
                                    className="form-input-premium"
                                    name="payerName"
                                    value={formData.payerName}
                                    onChange={handleInputChange}
                                    placeholder="Enter payer's name"
                                />
                                {errors.payerName && <small style={{ color: 'var(--urgent)', marginTop: '4px', display: 'block' }}>{errors.payerName}</small>}
                            </div>

                            <div className="form-field-group">
                                <label><FaPhone style={{ marginRight: '8px' }} /> Phone Number</label>
                                <input
                                    className="form-input-premium"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="For payment confirmation"
                                />
                                {errors.phone && <small style={{ color: 'var(--urgent)', marginTop: '4px', display: 'block' }}>{errors.phone}</small>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div className="form-field-group">
                                    <label><FaRuler style={{ marginRight: '8px' }} /> Size</label>
                                    <select className="form-input-premium" name="size" value={formData.size} onChange={handleInputChange}>
                                        {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label><FaLayerGroup style={{ marginRight: '8px' }} /> Qty</label>
                                    <input
                                        className="form-input-premium"
                                        type="number"
                                        name="quantity"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-premium primary" style={{ width: '100%', justifyContent: 'center' }}>
                                Submit Order
                            </button>
                        </form>
                    ) : (
                        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                            <FaCheckCircle style={{ fontSize: '4rem', color: 'var(--success)', marginBottom: '16px' }} />
                            <h3>Order Confirmed!</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Your T-shirt order has been recorded successfully.</p>
                            <button className="btn-premium primary" onClick={() => setIsSubmitted(false)}>
                                Order Another
                            </button>
                        </div>
                    )}
                </div>

                {/* Orders List */}
                <div className="animate-fade">
                    <h3 style={{ marginBottom: '16px' }}>Current Orders ({orders.length})</h3>
                    {orders.length === 0 ? (
                        <div className="empty-tab-state" style={{ padding: '48px' }}>
                            <FaTshirt className="empty-icon" />
                            <p>No orders placed for this Jumuiya yet. Be the first!</p>
                        </div>
                    ) : (
                        <div className="premium-table-wrap">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Holder</th>
                                        <th>Size</th>
                                        <th>Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td style={{ fontWeight: 600 }}>{order.holderName}</td>
                                            <td><span className="badge info">{order.size}</span></td>
                                            <td>{order.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TshirtsTab;
