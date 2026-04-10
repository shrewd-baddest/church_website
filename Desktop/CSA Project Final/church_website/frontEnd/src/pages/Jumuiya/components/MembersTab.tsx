import React, { useState } from 'react';
import { FaCheck, FaUsers } from "react-icons/fa";
import { membersList } from '../data/members';
import './TabsSystem.css';

interface MembersTabProps {
    jumuiyaName: string;
    jumuiyaColor?: string;
}

const MembersTab: React.FC<MembersTabProps> = ({ jumuiyaName, jumuiyaColor = 'var(--primary-color)' }) => {
    const [activeSubTab, setActiveSubTab] = useState<'all' | 'registered'>('all');

    const allMembers = membersList;

    const displayedMembers = activeSubTab === 'all'
        ? allMembers
        : allMembers.filter(m => m.isRegistered);

    return (
        <div className="tab-system-content" style={{ '--jumuiya-color': jumuiyaColor } as React.CSSProperties}>
            <div className="tab-header-wrap">
                <div className="header-text">
                    <h1 className="page-title">{jumuiyaName} Members</h1>
                    <p className="page-description">A vibrant community on a shared journey of faith and service.</p>
                </div>
            </div>

            {/* Registration Type Toggle */}
            <div className="toggle-wrapper animate-fade">
                <button
                    className={`toggle-item ${activeSubTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('all')}
                >
                    <FaUsers /> All Members
                </button>
                <button
                    className={`toggle-item ${activeSubTab === 'registered' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('registered')}
                >
                    <FaCheck /> Registered Only
                </button>
            </div>

            <div className="premium-table-wrap animate-fade">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>Member Name</th>
                            <th>Academic Year</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedMembers.map(member => (
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
                                        <span style={{ fontWeight: 600 }}>{member.name}</span>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{member.year}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MembersTab;
