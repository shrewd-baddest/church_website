import React, { useState, useMemo } from 'react';
import { membersList, currentUser } from '../data/members';
import { FaUserPlus, FaUsers, FaCheckCircle, FaPhoneAlt, FaMoneyBillWave, FaExclamationCircle } from 'react-icons/fa';
import './TabsSystem.css';

interface RegistrationTabProps {
    jumuiyaName: string;
    jumuiyaColor?: string;
}

type RegistrationType = 'self' | 'bulk';

const REGISTRATION_FEE = 50;

const RegistrationTab: React.FC<RegistrationTabProps> = ({ jumuiyaName, jumuiyaColor = 'var(--primary)' }) => {
    const [registrationType, setRegistrationType] = useState<RegistrationType>('self');
    const [selfPhone, setSelfPhone] = useState('');
    const [bulkPhone, setBulkPhone] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const unregisteredMembers = useMemo(() => {
        return membersList.filter(member => !member.isRegistered);
    }, []);

    const handleSelfSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
    };

    const handleBulkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
    };

    const toggleMemberSelection = (id: number) => {
        setSelectedMemberIds(prev =>
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    if (isSubmitted) {
        return (
            <div className="tab-system-content" style={{ '--jumuiya-color': jumuiyaColor } as React.CSSProperties}>
                <div className="tab-card glass-card animate-fade" style={{ padding: '64px 24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
                    <FaCheckCircle style={{ fontSize: '4rem', color: 'var(--jumuiya-color)', marginBottom: '24px' }} />
                    <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Payment Request Sent!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1.1rem' }}>
                        A prompt has been sent to the specified M-Pesa number. Please enter your PIN to complete the registration.
                    </p>
                    <button className="btn-premium primary" onClick={() => setIsSubmitted(false)}>
                        Back to Registration
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="tab-system-content" style={{ '--jumuiya-color': jumuiyaColor } as React.CSSProperties}>
            <div className="tab-header-wrap">
                <div className="header-text">
                    <h1 className="page-title">Join {jumuiyaName}</h1>
                    <p className="page-description">
                        Become a part of our thriving community. Registration is simple and helps us grow together.
                    </p>
                </div>
            </div>

            <div className="toggle-wrapper animate-fade">
                <button
                    className={`toggle-item ${registrationType === 'self' ? 'active' : ''}`}
                    onClick={() => setRegistrationType('self')}
                >
                    <FaUserPlus /> Self Registration
                </button>
                <button
                    className={`toggle-item ${registrationType === 'bulk' ? 'active' : ''}`}
                    onClick={() => setRegistrationType('bulk')}
                >
                    <FaUsers /> Bulk Registration
                </button>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {registrationType === 'self' ? (
                    <div className="tab-card glass-card animate-fade">
                        {currentUser.isRegistered ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <FaCheckCircle style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: '16px' }} />
                                <h3>You're all set!</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>You are already a registered member of {jumuiyaName}.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSelfSubmit}>
                                <div style={{ marginBottom: '32px' }}>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Individual Registration</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Confirm your details and provide an M-Pesa number for payment.</p>
                                </div>

                                <div className="form-field-group">
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>MEMBER NAME</label>
                                    <div className="form-input-premium" style={{ background: 'var(--bg-soft)', color: 'var(--text-muted)', border: 'none' }}>
                                        {currentUser.name} (Normalized Profile)
                                    </div>
                                </div>

                                <div className="form-field-group">
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>M-PESA PHONE NUMBER</label>
                                    <div style={{ position: 'relative' }}>
                                        <FaPhoneAlt style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            className="form-input-premium"
                                            style={{ paddingLeft: '44px' }}
                                            type="tel"
                                            value={selfPhone}
                                            onChange={(e) => setSelfPhone(e.target.value)}
                                            required
                                            placeholder="07XX XXX XXX"
                                        />
                                    </div>
                                </div>

                                <div style={{ background: 'var(--bg-soft)', padding: '20px', borderRadius: 'var(--rs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <FaMoneyBillWave style={{ color: 'var(--jumuiya-color)', fontSize: '1.25rem' }} />
                                        <span style={{ fontWeight: 600 }}>Registration Fee</span>
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--jumuiya-color)' }}>KES {REGISTRATION_FEE}</div>
                                </div>

                                <button type="submit" className="btn-premium primary" style={{ width: '100%', justifyContent: 'center' }}>
                                    Pay & Complete Registration
                                </button>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="tab-card glass-card animate-fade">
                        <form onSubmit={handleBulkSubmit}>
                            <div style={{ marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Register Multiple Members</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select unregistered members to sponsor their registration.</p>
                            </div>

                            <div className="form-field-group">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', display: 'block' }}>SELECT MEMBERS</label>
                                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--rs)', maxHeight: '300px', overflowY: 'auto', background: 'var(--bg-soft)' }}>
                                    {unregisteredMembers.length === 0 ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <FaCheckCircle style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.3 }} />
                                            <p>All members are registered!</p>
                                        </div>
                                    ) : (
                                        unregisteredMembers.map(member => (
                                            <div
                                                key={member.id}
                                                onClick={() => toggleMemberSelection(member.id)}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderBottom: '1px solid var(--border-light)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    cursor: 'pointer',
                                                    background: selectedMemberIds.includes(member.id) ? 'white' : 'transparent',
                                                    transition: 'var(--t-fast)'
                                                }}
                                            >
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    border: `2px solid ${selectedMemberIds.includes(member.id) ? 'var(--jumuiya-color)' : 'var(--border)'}`,
                                                    borderRadius: '4px',
                                                    background: selectedMemberIds.includes(member.id) ? 'var(--jumuiya-color)' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '0.7rem'
                                                }}>
                                                    {selectedMemberIds.includes(member.id) && <FaCheckCircle />}
                                                </div>
                                                <span style={{ flex: 1, fontWeight: 500 }}>{member.name}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="form-field-group" style={{ marginTop: '24px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>PAYER'S PHONE NUMBER</label>
                                <div style={{ position: 'relative' }}>
                                    <FaPhoneAlt style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        className="form-input-premium"
                                        style={{ paddingLeft: '44px' }}
                                        type="tel"
                                        value={bulkPhone}
                                        onChange={(e) => setBulkPhone(e.target.value)}
                                        required
                                        placeholder="07XX XXX XXX"
                                        disabled={selectedMemberIds.length === 0}
                                    />
                                </div>
                            </div>

                            <div style={{ background: 'var(--bg-soft)', padding: '20px', borderRadius: 'var(--rs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Total for {selectedMemberIds.length} members</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>KES {REGISTRATION_FEE} each</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--jumuiya-color)' }}>KES {selectedMemberIds.length * REGISTRATION_FEE}</div>
                            </div>

                            <button
                                type="submit"
                                className="btn-premium primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                                disabled={selectedMemberIds.length === 0}
                            >
                                Pay KES {selectedMemberIds.length * REGISTRATION_FEE} & Complete
                            </button>
                        </form>
                    </div>
                )}

                <div style={{
                    marginTop: '32px',
                    display: 'flex',
                    gap: '12px',
                    padding: '16px',
                    background: 'color-mix(in srgb, var(--jumuiya-color), white 90%)',
                    borderRadius: 'var(--rs)',
                    color: 'color-mix(in srgb, var(--jumuiya-color), black 20%)',
                    fontSize: '0.9rem',
                    border: '1px solid color-mix(in srgb, var(--jumuiya-color), white 80%)'
                }}>
                    <FaExclamationCircle style={{ flexShrink: 0, marginTop: '3px', color: 'var(--jumuiya-color)' }} />
                    <p>Registration fees are non-refundable and contribute towards community events, charity work, and administrative costs.</p>
                </div>
            </div>
        </div>
    );
};

export default RegistrationTab;
