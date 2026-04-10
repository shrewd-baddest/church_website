import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { GalleryImage } from '../data/jumuiyaData';
import { FaTrash, FaPlus } from 'react-icons/fa';

interface AdminGalleryProps {
    selectedId?: string;
}

const AdminGallery: React.FC<AdminGalleryProps> = ({ selectedId }) => {
    const { jumuiyaList, updateGallery } = useData();
    const [selectedJumuiyaId, setSelectedJumuiyaId] = useState(selectedId || jumuiyaList[0]?.id || '');

    // Simple state to control form
    const [isAdding, setIsAdding] = useState(false);
    const [newAlbum, setNewAlbum] = useState<Partial<GalleryImage>>({ images: [] });
    // State for temporary image URL input in the form
    const [tempImageUrl, setTempImageUrl] = useState('');

    const selectedJumuiya = jumuiyaList.find((j: any) => j.id === selectedJumuiyaId);

    const handleDelete = (albumId: string) => {
        if (window.confirm('Delete this album?')) {
            if (selectedJumuiya) {
                const updatedGallery = selectedJumuiya.gallery.filter(g => g.id !== albumId);
                updateGallery(selectedJumuiyaId, updatedGallery);
            }
        }
    };

    const handleAddImageToAlbum = () => {
        if (tempImageUrl) {
            setNewAlbum(prev => ({
                ...prev,
                images: [...(prev.images || []), tempImageUrl],
                url: prev.url || tempImageUrl // Set cover image if not set
            }));
            setTempImageUrl('');
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedJumuiya && newAlbum.caption && newAlbum.images?.length) {
            const album: GalleryImage = {
                id: Date.now().toString(),
                url: newAlbum.images[0], // Use first image as cover
                caption: newAlbum.caption || 'Untitled Album',
                images: newAlbum.images
            };

            updateGallery(selectedJumuiyaId, [...selectedJumuiya.gallery, album]);
            setIsAdding(false);
            setNewAlbum({ images: [] });
        } else {
            alert('Please add a caption and at least one image.');
        }
    };

    return (
        <div style={{ '--admin-theme-color': selectedJumuiya?.color } as React.CSSProperties}>
            <div className="admin-card">
                <div className="admin-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Manage Gallery</h2>
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

                <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                    {selectedJumuiya?.gallery.map(album => (
                        <div key={album.id} className="gallery-item admin-gallery-item" style={{ position: 'relative', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', background: 'white', transition: 'transform 0.2s', boxShadow: 'var(--shadow-sm)' }}>
                            <img src={album.url} alt={album.caption} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                            <div style={{ padding: '16px' }}>
                                <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>{album.caption}</p>
                                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{album.images?.length || 0} images</p>
                            </div>
                            <button
                                onClick={() => handleDelete(album.id)}
                                style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '8px', padding: '8px', color: '#ef4444', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backdropFilter: 'blur(4px)' }}
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}

                    <div
                        onClick={() => setIsAdding(true)}
                        style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: '16px',
                            height: '260px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            background: 'rgba(255, 255, 255, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary-500)';
                            e.currentTarget.style.color = 'var(--primary-500)';
                            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                        }}
                    >
                        <FaPlus style={{ fontSize: '2rem', marginBottom: '8px' }} />
                        <span>Add New Album</span>
                    </div>
                </div>
            </div>

            {/* Add Album Modal */}
            {isAdding && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'white', padding: '32px', borderRadius: '20px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}>
                        <h3>Add New Album</h3>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Album Caption</label>
                                <input
                                    value={newAlbum.caption || ''}
                                    onChange={(e) => setNewAlbum({ ...newAlbum, caption: e.target.value })}
                                    placeholder="e.g. Sunday Mass"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Add Image URLs</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        value={tempImageUrl}
                                        onChange={(e) => setTempImageUrl(e.target.value)}
                                        placeholder="https://..."
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddImageToAlbum}
                                        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 16px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                {newAlbum.images?.map((img: any, idx: number) => (
                                    <img key={idx} src={img} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    style={{ padding: '12px 24px', border: '1px solid var(--border-color)', background: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-secondary)' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">Create Album</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminGallery;
