import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

interface AdminAboutProps {
    selectedId?: string;
}

const AdminAbout: React.FC<AdminAboutProps> = ({ selectedId }) => {
    const { jumuiyaList, updateAbout, updateJumuiya } = useData();
    const [selectedJumuiyaId, setSelectedJumuiyaId] = useState(selectedId || jumuiyaList[0]?.id || '');

    // Form states
    const [description, setDescription] = useState('');
    const [about, setAbout] = useState('');

    useEffect(() => {
        if (selectedJumuiyaId) {
            const jumuiya = jumuiyaList.find((j: any) => j.id === selectedJumuiyaId);
            if (jumuiya) {
                setDescription(jumuiya.description);
                setAbout(jumuiya.about);
            }
        }
    }, [selectedJumuiyaId, jumuiyaList]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Update description (top level)
        updateJumuiya(selectedJumuiyaId, { description });

        // Update about section
        updateAbout(selectedJumuiyaId, about);

        alert('About section updated successfully!');
    };

    const selectedJumuiya = jumuiyaList.find((j: any) => j.id === selectedJumuiyaId);

    return (
        <div style={{ '--admin-theme-color': selectedJumuiya?.color } as React.CSSProperties}>
            <div className="admin-card">
                <h2>Manage About Section</h2>

                <div className="form-group">
                    {!selectedId && (
                        <>
                            <label>Select Jumuiya to Edit</label>
                            <select
                                value={selectedJumuiyaId}
                                onChange={(e) => setSelectedJumuiyaId(e.target.value)}
                            >
                                {jumuiyaList.map((j: any) => (
                                    <option key={j.id} value={j.id}>{j.name}</option>
                                ))}
                            </select>
                        </>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Short Description (Landing Page)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="form-group">
                        <label>Saint Story / Biography</label>
                        <textarea
                            value={about}
                            onChange={(e) => setAbout(e.target.value)}
                            rows={10}
                            placeholder="Enter the story or biography of the saint..."
                        />
                    </div>

                    <button type="submit" className="btn-primary">Save Changes</button>
                </form>
            </div>
        </div>
    );
};

export default AdminAbout;
