import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useJumuiyaOfficials } from '../../../hooks/useJumuiyaOfficials';
import { FaTrash, FaEdit, FaPlus, FaCamera } from 'react-icons/fa';
import { resizeImage } from '../../../utils/imageOptimization';

interface AdminOfficialsProps {
    selectedId?: string;
}

const AdminOfficials: React.FC<AdminOfficialsProps> = ({ selectedId }) => {
    const { jumuiyaList } = useData();
    const [selectedJumuiyaId, setSelectedJumuiyaId] = useState(selectedId || jumuiyaList[0]?.id || '');

    const selectedJumuiya = useMemo(() =>
        jumuiyaList.find((j: any) => j.id === selectedJumuiyaId),
        [jumuiyaList, selectedJumuiyaId]);

    // Fetch dynamic officials from backend
    const { officials: dynamicOfficials, addOfficial, updateOfficial, deleteOfficial, isAdding, isUpdating, isDeleting } = useJumuiyaOfficials({
        category: selectedJumuiya?.name
    });

    // Edit Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [currentOfficial, setCurrentOfficial] = useState<any>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleEdit = (official: any) => {
        setCurrentOfficial({
            ...official,
            // Map backend 'contact' to frontend 'phone' for the form if needed, 
            // but let's just use what's consistent
            phone: official.contact || official.phone || ''
        });
        setPreviewUrl(official.photo ? (official.photo.startsWith('http') ? official.photo : `/${official.photo}`) : null);
        setSelectedFile(null);
        setIsEditing(true);
    };

    const handleAdd = () => {
        setCurrentOfficial({ category: selectedJumuiya?.name });
        setPreviewUrl(null);
        setSelectedFile(null);
        setIsEditing(true);
    };

    const handleDeleteClick = async (officialId: string) => {
        if (window.confirm('Are you sure you want to delete this official?')) {
            try {
                await deleteOfficial(Number(officialId));
            } catch (err) {
                console.error('Delete failed:', err);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJumuiya || !currentOfficial.name) return;

        try {
            const fd = new FormData();
            fd.append('name', currentOfficial.name);
            fd.append('category', selectedJumuiya.name);
            fd.append('position', currentOfficial.position);
            if (currentOfficial.phone) fd.append('contact', currentOfficial.phone);
            if (currentOfficial.email) fd.append('email', currentOfficial.email);
            if (currentOfficial.term_of_service) fd.append('term_of_service', currentOfficial.term_of_service);

            if (selectedFile) {
                const optimizedBlob = await resizeImage(selectedFile, 800, 800);
                fd.append('photo', optimizedBlob, 'photo.jpg');
            }

            if (currentOfficial.id) {
                await updateOfficial({ id: Number(currentOfficial.id), formData: fd });
            } else {
                await addOfficial(fd);
            }

            setIsEditing(false);
            setCurrentOfficial({});
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    return (
        <div className="admin-page-container" style={{ '--admin-theme-color': selectedJumuiya?.color } as React.CSSProperties}>
            <div className="admin-card">
                <div className="admin-header-actions">
                    <h2>Manage Officials</h2>
                    {!selectedId && (
                        <select
                            value={selectedJumuiyaId}
                            onChange={(e) => setSelectedJumuiyaId(e.target.value)}
                            className="jumuiya-select"
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
                                <th>Photo</th>
                                <th>Name</th>
                                <th>Position</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(dynamicOfficials || []).map(official => (
                                <tr key={official.id}>
                                    <td>
                                        <img
                                            src={official.photo ? (official.photo.startsWith('http') ? official.photo : `/${official.photo}`) : 'https://via.placeholder.com/40'}
                                            alt={official.name}
                                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                    </td>
                                    <td>{official.name}</td>
                                    <td>{official.position}</td>
                                    <td>{official.contact}</td>
                                    <td style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEdit(official)}
                                            className="action-btn edit-btn"
                                            title="Edit"
                                            disabled={isUpdating}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(String(official.id))}
                                            className="action-btn delete-btn-icon"
                                            title="Delete"
                                            disabled={isDeleting}
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!dynamicOfficials || dynamicOfficials.length === 0) && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                                        No officials found for this Jumuiya.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <button
                    className="btn-primary"
                    style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={handleAdd}
                    disabled={isAdding}
                >
                    <FaPlus /> {isAdding ? 'Adding...' : 'Add Official'}
                </button>
            </div>

            {/* Edit/Add Modal */}
            {isEditing && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content animate-slide-up" style={{ background: 'white', padding: '32px', borderRadius: '20px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                            {currentOfficial.id ? 'Edit Official' : 'Add Official'}
                        </h3>
                        <form onSubmit={handleSave}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={previewUrl || 'https://via.placeholder.com/100'}
                                        alt="Preview"
                                        style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--jumuiya-color)' }}
                                    />
                                    <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--jumuiya-color)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}>
                                        <FaCamera size={14} />
                                        <input type="file" onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    value={currentOfficial.name || ''}
                                    onChange={(e) => setCurrentOfficial({ ...currentOfficial, name: e.target.value })}
                                    required
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Position</label>
                                <input
                                    value={currentOfficial.position || ''}
                                    onChange={(e) => setCurrentOfficial({ ...currentOfficial, position: e.target.value })}
                                    required
                                    placeholder="e.g. Chairperson"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={currentOfficial.email || ''}
                                    onChange={(e) => setCurrentOfficial({ ...currentOfficial, email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    value={currentOfficial.phone || ''}
                                    onChange={(e) => setCurrentOfficial({ ...currentOfficial, phone: e.target.value })}
                                    placeholder="e.g. 0712345678"
                                />
                            </div>
                            <div className="form-group">
                                <label>Term of Service</label>
                                <input
                                    value={currentOfficial.term_of_service || ''}
                                    onChange={(e) => setCurrentOfficial({ ...currentOfficial, term_of_service: e.target.value })}
                                    placeholder="e.g. 2024-2026"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="btn-secondary"
                                    style={{ padding: '12px 24px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', color: '#64748b' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isAdding || isUpdating}
                                >
                                    {isAdding || isUpdating ? 'Saving...' : 'Save Official'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOfficials;
