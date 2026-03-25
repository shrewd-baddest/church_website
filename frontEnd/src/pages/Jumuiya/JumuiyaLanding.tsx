import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from './context/DataContext';
import './JumuiyaLanding.css';

const JumuiyaLanding: React.FC = () => {
    const navigate = useNavigate();
    const { jumuiyaList } = useData();

    const handleCardClick = (jumuiyaId: string) => {
        navigate(`/jumuiya/${jumuiyaId}`);
    };

    return (
        <div className="landing-page">
            <div className="container">
                {/* Hero Section */}
                <header className="hero animate-fade-in">
                    <h1 className="hero-title">Jumuiya</h1>
                    <p className="hero-subtitle">Small Christian Communities</p>
                    <p className="hero-description">
                        Join one of our vibrant Jumuiya communities and grow in faith, fellowship, and service.
                        Each community is a family where we pray together, support one another, and live out the Gospel.
                    </p>
                </header>

                {/* Jumuiya Cards Grid */}
                <div className="jumuiya-grid">
                    {jumuiyaList.map((jumuiya, index) => (
                        <div
                            key={jumuiya.id}
                            className="jumuiya-card card card-clickable animate-fade-in"
                            style={{
                                animationDelay: `${index * 0.1}s`,
                                ['--jumuiya-color' as any]: jumuiya.color
                            }}
                            onClick={() => handleCardClick(jumuiya.id)}
                        >
                            {/* Background Image with Color Overlay */}
                            <div
                                className="card-background"
                                style={{ backgroundImage: `url(${jumuiya.saintImage})` }}
                            >
                                <div className="card-overlay"></div>
                            </div>

                            {/* Card Content */}
                            <div className="card-content">
                                <div className="card-header">
                                    <h2 className="card-title">{jumuiya.name}</h2>
                                </div>
                                <p className="card-description">{jumuiya.description}</p>
                                <div className="card-footer">
                                    {/* <span className="card-link">Learn More →</span> */}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="landing-footer">
                    <p>
                        Don't have a Jumuiya? Contact the Jumuiya Coordinator at <a href="mailto:info@jumuiya.co.ke">info@jumuiya.co.ke</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default JumuiyaLanding;
