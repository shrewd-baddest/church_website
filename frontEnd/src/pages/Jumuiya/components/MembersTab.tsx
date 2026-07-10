import React, { useState } from 'react';
import { FaCheck, FaUsers } from "react-icons/fa";
import { useJumuiyaMembers } from '../../../hooks/useJumuiyaMembers';
import PageLoader from '../../../assets/Layouts/PageLoader';
import './TabsSystem.css';

interface MembersTabProps {
    jumuiyaId: string;
    jumuiyaName: string;
    jumuiyaColor?: string;
}

const MembersTab: React.FC<MembersTabProps> = ({ jumuiyaId, jumuiyaName, jumuiyaColor = 'var(--primary-color)' }) => {
    const [activeSubTab, setActiveSubTab] = useState<'registered' | 'all'>('registered');
    const { members, isLoading, error } = useJumuiyaMembers({ 
        jumuiya_id: jumuiyaId,
        type: activeSubTab 
    });

    const displayedMembers = members;

    return (
        <div className="tab-system-content" style={{ '--jumuiya-color': jumuiyaColor } as React.CSSProperties}>
            <div className="tab-header-wrap">
                <div className="header-text">
                    <h1 className="page-title">{jumuiyaName} Membership</h1>
                    <p className="page-description">
                        {activeSubTab === 'registered' 
                            ? `Listing members explicitly found in the registration database for ${jumuiyaName}.`
                            : `A complete directory of all members assigned to ${jumuiyaName}.`}
                    </p>
                </div>
            </div>

            {/* Action Bar */}
            <div className="members-action-bar animate-fade" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'stretch',
                marginBottom: 'var(--space-xl)',
                gap: '12px',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row'
            }}>
                <div className="toggle-wrapper" style={{ margin: 0, width: '100%', flex: '1 1 auto' }}>
                    <button
                        className={`toggle-item ${activeSubTab === 'registered' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('registered')}
                    >
                        <FaCheck /> <span className="tab-label">Registered</span>
                    </button>
                    <button
                        className={`toggle-item ${activeSubTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('all')}
                    >
                        <FaUsers /> <span className="tab-label">All Members</span>
                    </button>
                </div>
            </div>

            <div className="premium-table-wrap animate-fade" style={{ minHeight: '300px', maxHeight: '500px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--rs)', position: 'relative' }}>
                {isLoading ? (
                    <div style={{ padding: '64px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <PageLoader message="Fetching Membership Data" />
                    </div>
                ) : (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Member Name</th>
                                <th>Academic Year</th>
                                <th>Jumuiya</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                        No members found in this category.
                                    </td>
                                </tr>
                            ) : displayedMembers.map(member => (
                                <tr key={member.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            background: jumuiyaColor,
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 700,
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        {member.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 600 }}>{member.name}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{member.year || 'N/A'}</span>
                                    </td>
                                    <td>
                                        {member.jumuiya_name ? (
                                            <span style={{
                                                padding: '3px 10px',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: `${jumuiyaColor}15`,
                                                color: jumuiyaColor,
                                                border: `1px solid ${jumuiyaColor}30`,
                                                display: 'inline-block'
                                            }}>
                                                {member.jumuiya_name}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>Unassigned</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MembersTab;
