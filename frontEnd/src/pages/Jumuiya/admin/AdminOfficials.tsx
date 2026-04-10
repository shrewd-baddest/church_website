import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useJumuiyaOfficials } from '../../../hooks/useJumuiyaOfficials';
import { FaTrash, FaEdit, FaPlus, FaCamera, FaUserTie, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';
import { resizeImage } from '../../../utils/imageOptimization';

interface AdminOfficialsProps {
    selectedId?: string;
}

// ── Exact positions as requested ──────────────────────────────────────────────
const JUMUIYA_POSITIONS = [
    { value: 'Chairperson',           label: 'Chairperson',           description: 'Heads the Jumuiya & chairs all meetings' },
    { value: 'Vice Chairperson',      label: 'Vice Chairperson',      description: 'Deputises the Chairperson' },
    { value: 'Organizing Secretary',  label: 'Organizing Secretary',  description: 'Plans and organises Jumuiya activities' },
    { value: 'Secretary',             label: 'Secretary',             description: 'Manages records and communications' },
    { value: 'Vice Secretary',        label: 'Vice Secretary',        description: 'Supports the Secretary' },
    { value: 'Treasurer',             label: 'Treasurer',             description: 'Manages finances and contributions' },
    { value: 'Liturgist',             label: 'Liturgist',             description: 'Leads liturgical worship and prayer' },
    { value: 'Vice Liturgist',        label: 'Vice Liturgist',        description: 'Assists the Liturgist' },
];

// ── Patron saint image per Jumuiya name ───────────────────────────────────────
const SAINT_IMAGES: Record<string, string> = {
    'St. Anthony':      '/assets/images/Anthony.png',
    'St. Augustine':    '/assets/images/Augustine.png',
    'St. Catherine':    '/assets/images/Catherine.jpg',
    'St. Dominic':      '/assets/images/Dominic.png',
    'St. Elizabeth':    '/assets/images/Elizabeth.png',
    'St. Maria Goretti':'/assets/images/MariaGoretti.png',
    'St. Monica':       '/assets/images/Monica.png',
};

// ── Searchable Position Dropdown ─────────────────────────────────────────────
const PositionDropdown: React.FC<{
    value: string;
    onChange: (val: string) => void;
    themeColor: string;
}> = ({ value, onChange, themeColor }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = JUMUIYA_POSITIONS.filter(p =>
        p.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedLabel = JUMUIYA_POSITIONS.find(p => p.value === value)?.label || 'Select a position…';

    return (
        <div style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px',
                    border: `2px solid ${open ? themeColor : '#e2e8f0'}`,
                    borderRadius: '12px', background: 'white', cursor: 'pointer',
                    fontSize: '0.9rem', color: value ? '#1e293b' : '#94a3b8',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontWeight: value ? '600' : '400', transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                }}
            >
                <span>{selectedLabel}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {open && (
                <>
                    {/* Click-away overlay */}
                    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 299 }} />
                    <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.18)', zIndex: 300,
                        overflow: 'hidden',
                    }}>
                        {/* Search */}
                        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaSearch style={{ color: '#94a3b8' }} size={11} />
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search positions…"
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.84rem', color: '#475569', background: 'transparent' }}
                            />
                        </div>
                        {filtered.map(pos => (
                            <button key={pos.value} type="button"
                                onClick={() => { onChange(pos.value); setOpen(false); setSearch(''); }}
                                style={{
                                    width: '100%', textAlign: 'left', padding: '11px 16px',
                                    border: 'none', background: value === pos.value ? themeColor + '15' : 'transparent',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    borderLeft: value === pos.value ? `3px solid ${themeColor}` : '3px solid transparent',
                                    transition: 'background 0.12s',
                                }}
                                onMouseEnter={e => { if (value !== pos.value) (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
                                onMouseLeave={e => { if (value !== pos.value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                            >
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.87rem', color: '#1e293b' }}>{pos.label}</div>
                                    <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '1px' }}>{pos.description}</div>
                                </div>
                                {value === pos.value && <FaCheck style={{ color: themeColor, flexShrink: 0 }} size={11} />}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ padding: '18px', textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem' }}>No match</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// ── Reusable Field ────────────────────────────────────────────────────────────
const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
    <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.77rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}{required && <span style={{ color: '#f43f5e', marginLeft: '3px' }}>*</span>}
        </label>
        {children}
    </div>
);

const inp = (_tc: string): React.CSSProperties => ({
    width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0',
    borderRadius: '12px', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s', color: '#1e293b', fontFamily: 'inherit',
});

// ── Main Component ────────────────────────────────────────────────────────────
const AdminOfficials: React.FC<AdminOfficialsProps> = ({ selectedId }) => {
    const { jumuiyaList } = useData();
    const [selectedJumuiyaId, setSelectedJumuiyaId] = useState(selectedId || jumuiyaList[0]?.id || '');

    const selectedJumuiya = useMemo(() =>
        jumuiyaList.find((j: any) => j.id === selectedJumuiyaId),
        [jumuiyaList, selectedJumuiyaId]);

    const { officials, addOfficial, updateOfficial, deleteOfficial, isAdding, isUpdating, isDeleting } =
        useJumuiyaOfficials({ category: selectedJumuiya?.name });

    const [isEditing, setIsEditing]   = useState(false);
    const [current, setCurrent]       = useState<any>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const themeColor: string = (selectedJumuiya as any)?.color || '#6366f1';
    // Patron saint image for the selected Jumuiya (used as default avatar)
    const patronSaint: string = SAINT_IMAGES[selectedJumuiya?.name || ''] || '';

    const openAdd = () => {
        setCurrent({ category: selectedJumuiya?.name });
        setPreviewUrl(null); setSelectedFile(null); setSaveSuccess(false); setIsEditing(true);
    };
    const openEdit = (o: any) => {
        setCurrent({ ...o, phone: o.contact || o.phone || '' });
        const src = o.photo ? (o.photo.startsWith('http') ? o.photo : `/${o.photo}`) : null;
        setPreviewUrl(src);
        setSelectedFile(null); setSaveSuccess(false); setIsEditing(true);
    };
    const closeModal = () => { setIsEditing(false); setCurrent({}); setSelectedFile(null); setPreviewUrl(null); };

    const handleDelete = async (id: string) => {
        if (window.confirm('Remove this official from the Jumuiya?')) {
            await deleteOfficial(Number(id)).catch(console.error);
        }
    };
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return;
        setSelectedFile(f);
        const r = new FileReader();
        r.onloadend = () => setPreviewUrl(r.result as string);
        r.readAsDataURL(f);
    };
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJumuiya || !current.name) return;
        try {
            const fd = new FormData();
            fd.append('name', current.name);
            fd.append('category', selectedJumuiya.name);
            fd.append('position', current.position || '');
            if (current.phone) fd.append('contact', current.phone);
            if (current.email) fd.append('email', current.email);
            if (current.term_of_service) fd.append('term_of_service', current.term_of_service);
            if (selectedFile) {
                const blob = await resizeImage(selectedFile, 800, 800);
                fd.append('photo', blob, 'photo.jpg');
            }
            current.id
                ? await updateOfficial({ id: Number(current.id), formData: fd })
                : await addOfficial(fd);
            setSaveSuccess(true);
            setTimeout(closeModal, 900);
        } catch (err) { console.error('Save failed:', err); }
    };

    // Photo src for a card: personal photo → patron saint → generic icon
    const cardPhoto = (o: any) => {
        if (o.photo) return o.photo.startsWith('http') ? o.photo : `/${o.photo}`;
        return patronSaint || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(o.name)}`;
    };

    return (
        <div className="admin-page-container" style={{ '--admin-theme-color': themeColor } as React.CSSProperties}>
            <div className="admin-card">
                {/* ── Header ── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: themeColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaUserTie style={{ color: themeColor }} size={20} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>Officials Management</h2>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                                {officials?.length || 0} official{officials?.length !== 1 ? 's' : ''} · {selectedJumuiya?.name || '—'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {!selectedId && (
                            <select value={selectedJumuiyaId} onChange={e => setSelectedJumuiyaId(e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontWeight: '600', color: '#475569', background: '#f8fafc', cursor: 'pointer', outline: 'none' }}>
                                {jumuiyaList.map((j: any) => <option key={j.id} value={j.id}>{j.name}</option>)}
                            </select>
                        )}
                        <button onClick={openAdd} disabled={isAdding}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', borderRadius: '12px', background: themeColor, border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.875rem', boxShadow: `0 4px 14px ${themeColor}55` }}>
                            <FaPlus size={11} /> Add Official
                        </button>
                    </div>
                </div>

                {/* ── Cards ── */}
                {officials && officials.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: '16px' }}>
                        {officials.map(o => (
                            <div key={o.id}
                                style={{ background: 'white', borderRadius: '18px', border: '1px solid #f1f5f9', padding: '22px 16px 18px', textAlign: 'center', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.25s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 28px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                            >
                                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                                    <button onClick={() => openEdit(o)} title="Edit" disabled={isUpdating}
                                        style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: '#eef2ff', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FaEdit size={11} />
                                    </button>
                                    <button onClick={() => handleDelete(String(o.id))} title="Delete" disabled={isDeleting}
                                        style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: '#fff1f2', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FaTrash size={11} />
                                    </button>
                                </div>
                                <img src={cardPhoto(o)} alt={o.name}
                                    style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${themeColor}44`, marginBottom: '12px' }} />
                                <h4 style={{ margin: '0 0 6px', fontSize: '0.92rem', fontWeight: '700', color: '#1e293b' }}>{o.name}</h4>
                                <span style={{ display: 'inline-block', padding: '3px 10px', background: themeColor + '18', color: themeColor, borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700' }}>
                                    {o.position || '—'}
                                </span>
                                {o.contact && <p style={{ margin: '8px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>{o.contact}</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '18px', border: '2px dashed #e2e8f0' }}>
                        {patronSaint
                            ? <img src={patronSaint} alt={selectedJumuiya?.name} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', opacity: 0.35, marginBottom: '14px' }} />
                            : <FaUserTie size={36} style={{ color: '#cbd5e1', marginBottom: '14px' }} />}
                        <p style={{ margin: 0, fontWeight: '700', color: '#64748b' }}>No officials yet for {selectedJumuiya?.name}</p>
                        <p style={{ margin: '6px 0 0', fontSize: '0.83rem', color: '#94a3b8' }}>Tap "Add Official" above to get started.</p>
                    </div>
                )}
            </div>

            {/* ── Modal — rendered in a portal-style fixed overlay above everything ── */}
            {isEditing && (
                <div
                    onClick={closeModal}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(15,23,42,0.7)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 99999,   /* above all headers, sidebars, navbars */
                        padding: '16px',
                        overflowY: 'auto',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '510px', boxShadow: '0 40px 80px rgba(0,0,0,0.3)', margin: 'auto' }}
                    >
                        {/* Modal Header */}
                        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FaUserTie style={{ color: 'white' }} size={16} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1e293b' }}>
                                        {current.id ? 'Edit Official' : 'Add New Official'}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>{selectedJumuiya?.name}</p>
                                </div>
                            </div>
                            <button type="button" onClick={closeModal}
                                style={{ width: '34px', height: '34px', borderRadius: '10px', border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaTimes size={13} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ padding: '22px 28px 28px' }}>
                            {/* Photo Upload — default to patron saint image */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={previewUrl || patronSaint || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(current.name || 'new')}`}
                                        alt="Preview"
                                        style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: `4px solid ${themeColor}55` }}
                                    />
                                    <label title="Upload personal photo" style={{ position: 'absolute', bottom: 2, right: 2, background: themeColor, color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                                        <FaCamera size={11} />
                                        <input type="file" onChange={handleFile} style={{ display: 'none' }} accept="image/*" />
                                    </label>
                                </div>
                            </div>
                            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '-16px', marginBottom: '20px' }}>
                                Showing {selectedJumuiya?.name} patron saint image · tap 📷 to upload personal photo
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <Field label="Full Name" required>
                                    <input value={current.name || ''} required
                                        onChange={e => setCurrent({ ...current, name: e.target.value })}
                                        placeholder="e.g. Maria Wanjiku Kamau"
                                        style={inp(themeColor)}
                                        onFocus={e => e.target.style.borderColor = themeColor}
                                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </Field>

                                <Field label="Position" required>
                                    <PositionDropdown
                                        value={current.position || ''}
                                        onChange={val => setCurrent({ ...current, position: val })}
                                        themeColor={themeColor}
                                    />
                                </Field>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <Field label="Phone">
                                        <input value={current.phone || ''} type="tel"
                                            onChange={e => setCurrent({ ...current, phone: e.target.value })}
                                            placeholder="07XX XXX XXX"
                                            style={inp(themeColor)}
                                            onFocus={e => e.target.style.borderColor = themeColor}
                                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </Field>
                                    <Field label="Email">
                                        <input value={current.email || ''} type="email"
                                            onChange={e => setCurrent({ ...current, email: e.target.value })}
                                            placeholder="email@example.com"
                                            style={inp(themeColor)}
                                            onFocus={e => e.target.style.borderColor = themeColor}
                                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </Field>
                                </div>

                                <Field label="Term of Service">
                                    <input value={current.term_of_service || ''}
                                        onChange={e => setCurrent({ ...current, term_of_service: e.target.value })}
                                        placeholder="e.g. 2024–2026"
                                        style={inp(themeColor)}
                                        onFocus={e => e.target.style.borderColor = themeColor}
                                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </Field>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '26px' }}>
                                <button type="button" onClick={closeModal}
                                    style={{ flex: 1, padding: '13px', border: '2px solid #e2e8f0', background: 'white', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '0.875rem' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={isAdding || isUpdating || saveSuccess}
                                    style={{ flex: 2, padding: '13px', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', color: 'white', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: saveSuccess ? '#22c55e' : themeColor, transition: 'background 0.3s', opacity: (isAdding || isUpdating) ? 0.75 : 1 }}>
                                    {saveSuccess ? <><FaCheck size={13} /> Saved!</> : (isAdding || isUpdating) ? 'Saving…' : <><FaCheck size={13} /> Save Official</>}
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
