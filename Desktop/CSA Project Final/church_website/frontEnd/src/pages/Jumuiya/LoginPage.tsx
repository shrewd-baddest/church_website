import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="login-page">
            <div className="login-container">
                <h1 className="login-title">Admin Login Moved</h1>
                <p className="login-subtitle">Please use the main login page</p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                    <button onClick={() => navigate('/login')} className="login-btn">
                        Go to Main Login
                    </button>
                </div>

                <div className="login-footer">
                    <a href="/" className="back-link">← Back to Home</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
