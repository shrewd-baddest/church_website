import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Official } from '../data/jumuiyaData';
import { FaTrash, FaEdit, FaPlus } from 'react-icons/fa';

interface AdminOfficialsProps {
    selectedId?: string;
}

const AdminOfficials: React.FC<AdminOfficialsProps> = ({ selectedId }) => {
    const { jumuiyaList, updateOfficials } = useData();
    const [selectedJumuiyaId, setSelectedJumuiyaId] = useState(selectedId || jumuiyaList[0]?.id || '');

    // Edit Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [currentOfficial, setCurrentOfficial] = useState<Partial<Official>>({});

    const selectedJumuiya = jumuiyaList.find((j: any) => j.id === selectedJumuiyaId);

    const handleEdit = (official: Official) => {
        setCurrentOfficial(official);
        setIsEditing(true);
    };

    const handleAdd = () => {
        setCurrentOfficial({ id: Date.now().toString() }); // Simple ID gen
        setIsEditing(true);
    };

    const handleDelete = (officialId: string) => {
        if (window.confirm('Are you sure you want to delete this official?')) {
            if (selectedJumuiya) {
                const updatedOfficials = selectedJumuiya.officials.filter((o: any) => o.id !== officialId);
                updateOfficials(selectedJumuiyaId, updatedOfficials);
            }
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedJumuiya && currentOfficial.name) { // Basic validation
            let updatedOfficials = [...selectedJumuiya.officials];

            // Check if active editing implies updating existing or pushing new
            const existingIndex = updatedOfficials.findIndex((o: any) => o.id === currentOfficial.id);

            if (existingIndex >= 0) {
                updatedOfficials[existingIndex] = currentOfficial as Official;
            } else {
                updatedOfficials.push(currentOfficial as Official);
            }

            updateOfficials(selectedJumuiyaId, updatedOfficials);
            setIsEditing(false);
            setCurrentOfficial({});
        }
    };

    return (
        <div style={{ '--admin-theme-color': selectedJumuiya?.color } as React.CSSProperties}>
            <div className="admin-card">
                <div className="admin-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Manage Officials</h2>
                    {!selectedId && (
                        <select
                            value={selectedJumuiyaId}
                            onChange={(e) => setSelectedJumuiyaId(e.target.value)}
                            className="jumuiya-select"
                            style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '200px', background: 'white' }}
                        >
                            {jumuiyaList.map((j: any) => (
                                <option key={j.id} value={j.id}>{j.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Position</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedJumuiya?.officials.map(official => (
                                <tr key={official.id}>
                                    <td>{official.name}</td>
                                    <td>{official.position}</td>
                                    <td>{official.phone}</td>
                                    <td style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEdit(official)}
                                            className="action-btn edit-btn"
                                            title="Edit"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(official.id)}
                                            className="action-btn delete-btn-icon"
                                            title="Delete"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button
                    className="btn-primary"
                    style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={handleAdd}
                >
                    <FaPlus /> Add Official
                </button>
            </div>

            {/* Edit/Add Modal */}
            {isEditing && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'white', padding: '32px', borderRadius: '20px', width: '90%', maxWidth: '500px', boxShadow: 'var(--shadow-xl)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                            {currentOfficial.id ? 'Edit Official' : 'Add Official'}
                        </h3>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    value={currentOfficial.name || ''}
                                    onChange={(e) => setCurrentOfficial({ ...currentOfficial, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Position</label>
                                <input
                                    value={currentOfficial.position || ''}
                                    onChange={(e) => setCurrentOfficial({ ...currentOfficial, position: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    value={currentOfficial.email || ''}
                                    onChange={(e) => setCurrentOfficial({ ...currentOfficial, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    value={currentOfficial.phone || ''}
                                    onChange={(e) => setCurrentOfficial({ ...currentOfficial, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Image URL</label>
                                <input
                                    value={currentOfficial.image || ''}
                                    onChange={(e) => setCurrentOfficial({ ...currentOfficial, image: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    style={{ padding: '12px 24px', border: '1px solid var(--border-color)', background: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-secondary)' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOfficials;
