import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaInfoCircle, FaUserTie, FaUsers, FaCalendarAlt, FaImages } from 'react-icons/fa';
import './Admin.css';

const tabs = [
    { path: '/admin/about', label: 'About', icon: <FaInfoCircle /> },
    { path: '/admin/officials', label: 'Officials', icon: <FaUserTie /> },
    { path: '/admin/members', label: 'Members', icon: <FaUsers /> },
    { path: '/admin/activities', label: 'Activities', icon: <FaCalendarAlt /> },
    { path: '/admin/gallery', label: 'Gallery', icon: <FaImages /> },
];

const AdminTabs: React.FC = () => {
    const location = useLocation();
    return (
        <nav className="admin-tabs-container">
            <div className="admin-tabs-scroll">
                {tabs.map((tab) => (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={`admin-tab-item ${location.pathname === tab.path ? 'active' : ''}`}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default AdminTabs;
