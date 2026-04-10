import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FaInfoCircle, FaUserTie, FaUsers, FaCalendarAlt, FaImages, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import './Admin.css';

import AdminTabs from './AdminTabs';

const AdminLayout: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin/about', label: 'About', icon: <FaInfoCircle /> },
        { path: '/admin/officials', label: 'Officials', icon: <FaUserTie /> },
        { path: '/admin/members', label: 'Members', icon: <FaUsers /> },
        { path: '/admin/activities', label: 'Activities', icon: <FaCalendarAlt /> },
        { path: '/admin/gallery', label: 'Gallery', icon: <FaImages /> },
    ];

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Admin Panel</h2>
                    <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
                        <FaTimes />
                    </button>
                </div>

                <div className="user-info">
                    <div className="user-avatar">
                        {user?.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="user-name">{user?.username}</p>
                        <p className="user-role">Administrator</p>
                    </div>
                </div>

                <nav className="admin-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
                        <FaBars />
                    </button>
                    <h1>Dashboard</h1>
                    <Link to="/" className="view-site-btn" target="_blank">
                        View Site
                    </Link>
                </header>

                <AdminTabs />

                <div className="admin-content">
                    <Outlet />
                </div>
            </main>

            {/* Overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}
        </div>
    );
};

export default AdminLayout;
