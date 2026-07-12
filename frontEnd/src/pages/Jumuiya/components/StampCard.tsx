import React, { useMemo, useRef, useState } from 'react';
import { FaDownload, FaCheckCircle, FaStamp, FaUniversity, FaIdCard, FaEnvelope, FaSpinner, FaCheck } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { useJumuiyaMembers } from '../../../hooks/useJumuiyaMembers';
import PageLoader from '../../../assets/Layouts/PageLoader';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { memberService } from '../../../api/jumuiyaMemberService';

interface StampCardProps {
    jumuiyaId: string;
    jumuiyaName: string;
    jumuiyaColor: string;
    latestSemester?: number;
    onClose?: () => void;
}

const SEMESTER_LABELS = ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2"];

const StampCard: React.FC<StampCardProps> = ({ jumuiyaId, jumuiyaName, jumuiyaColor, latestSemester, onClose }) => {
    const { user } = useAuth();
    const { members, isLoading } = useJumuiyaMembers();
    const cardRef = useRef<HTMLDivElement>(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const memberRecord = members.find(m => m.id === user?.member_id && m.jumuiya_id === jumuiyaId);
    const displayRecord = memberRecord;

    const registeredCount = useMemo(() =>
        SEMESTER_LABELS.filter((_, i) =>
            (displayRecord as any)[`sem_${i + 1}_reg`]
        ).length,
    [displayRecord]);

    const getInitials = (name: string) =>
        name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const currentYearLabel = (() => {
        const completed = registeredCount;
        if (completed === 0) return "Not yet registered";
        if (completed <= 2) return "Year 1";
        if (completed <= 4) return "Year 2";
        if (completed <= 6) return "Year 3";
        return "Year 4";
    })();

    const generatePDF = async (): Promise<Blob | null> => {
        if (!cardRef.current) return null;
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 1.5,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ format: 'a4', unit: 'px' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 40;
            const usableWidth = pageWidth - margin * 2;
            const ratio = canvas.height / canvas.width;
            const imgWidth = usableWidth;
            const imgHeight = usableWidth * ratio;
            const x = margin;
            const y = (pageHeight - imgHeight) / 2;
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            return pdf.output('blob');
        } catch {
            return null;
        }
    };

    const handleDownloadPDF = async () => {
        const blob = await generatePDF();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Stamp_Card_${displayRecord.id || 'member'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSendEmail = async () => {
        const memberEmail = user?.email;
        if (!memberEmail) {
            alert('No email address found on your account.');
            return;
        }
        setSendingEmail(true);
        setEmailSent(false);
        try {
            const blob = await generatePDF();
            if (!blob) throw new Error('Could not generate PDF');

            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result as string;
                    resolve(dataUrl.split(',')[1]);
                };
                reader.onerror = () => reject(new Error('Failed to read PDF data'));
                reader.readAsDataURL(blob);
            });

            const res = await memberService.sendStampCard({
                email: memberEmail,
                pdfBase64: base64,
                memberName: displayRecord.name || '',
                jumuiyaName: displayRecord.jumuiya_name || jumuiyaName,
            });

            if (!res?.success) throw new Error(res?.error || 'Failed to send email');
            setEmailSent(true);
            setTimeout(() => setEmailSent(false), 4000);
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to send email';
            alert(msg);
        } finally {
            setSendingEmail(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: '64px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <PageLoader message="Loading your stamp card..." />
            </div>
        );
    }

    if (!displayRecord) {
        return (
            <div style={{ padding: '64px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ maxWidth: '420px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3.5rem', color: jumuiyaColor, opacity: 0.4, marginBottom: '16px' }}>
                        <FaStamp />
                    </div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Not Yet Registered</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                        You are not yet registered with {jumuiyaName}. Complete your registration to receive your semester stamp card.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '24px', flexWrap: 'wrap', gap: '12px'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                        <FaStamp style={{ marginRight: '8px', color: jumuiyaColor }} />
                        Semester Stamp Card
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                        Track your registration progress across 8 semesters
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={handleDownloadPDF}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                            borderRadius: '12px', background: jumuiyaColor, border: 'none',
                            color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
                            boxShadow: `0 4px 14px ${jumuiyaColor}55`
                        }}>
                        <FaDownload size={12} /> Download PDF
                    </button>
                    <button onClick={handleSendEmail} disabled={sendingEmail || emailSent}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                            borderRadius: '12px', border: '2px solid #e2e8f0',
                            background: emailSent ? '#dcfce7' : 'white',
                            cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                            color: emailSent ? '#16a34a' : '#475569',
                            opacity: sendingEmail ? 0.6 : 1,
                        }}>
                        {sendingEmail ? <FaSpinner className="animate-spin" size={12} /> : emailSent ? <FaCheck size={12} /> : <FaEnvelope size={12} />}
                        {sendingEmail ? 'Sending...' : emailSent ? 'Sent to Email!' : 'Send to Email'}
                    </button>
                    {onClose && (
                        <button onClick={onClose}
                            style={{
                                padding: '10px 16px', borderRadius: '12px',
                                border: '2px solid #e2e8f0', background: 'white',
                                cursor: 'pointer', fontWeight: 600, color: '#64748b', fontSize: '0.875rem'
                            }}>
                            Close
                        </button>
                    )}
                </div>
            </div>

            {/* Stamp Card */}
            <div ref={cardRef} style={{
                maxWidth: '580px',
                background: 'white',
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                border: `1px solid ${jumuiyaColor}20`,
                position: 'relative',
            }}>
                {/* Glossy overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
                    pointerEvents: 'none', zIndex: 1
                }} />

                {/* ── Header ── */}
                <div style={{
                    background: `linear-gradient(135deg, ${jumuiyaColor} 0%, ${jumuiyaColor}DD 100%)`,
                    padding: '24px 28px', color: 'white', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '8rem', opacity: 0.08 }}>
                        <FaUniversity />
                    </div>
                    <div style={{ position: 'absolute', left: '-15px', bottom: '-30px', fontSize: '6rem', opacity: 0.06 }}>
                        <FaStamp />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px',
                                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.4rem', fontWeight: 900,
                                border: '1px solid rgba(255,255,255,0.3)'
                            }}>
                                {getInitials(displayRecord.jumuiya_name || jumuiyaName)}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.85, letterSpacing: '1px' }}>
                                    SEMESTER STAMP CARD
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2px' }}>
                                    {displayRecord.jumuiya_name || jumuiyaName}
                                </div>
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)', padding: '5px 10px',
                            borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700,
                            letterSpacing: '0.5px', backdropFilter: 'blur(5px)'
                        }}>
                            {registeredCount}/8
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div style={{ padding: '24px 28px 28px' }}>
                    {/* Member Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '16px',
                            background: `linear-gradient(135deg, ${jumuiyaColor}15, ${jumuiyaColor}05)`,
                            border: `2px solid ${jumuiyaColor}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', color: jumuiyaColor
                        }}>
                            <FaIdCard />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {displayRecord.name ? "Member" : "Registration ID"}
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                {displayRecord.name || displayRecord.id}
                            </div>
                            {displayRecord.name && (
                                <div style={{
                                    fontSize: '0.75rem', fontWeight: 600, color: jumuiyaColor,
                                    fontFamily: 'monospace', marginTop: '2px'
                                }}>
                                    {displayRecord.id}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Semester Stamp Grid */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            fontSize: '0.65rem', fontWeight: 800, color: '#64748b',
                            marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <FaStamp size={10} /> Registration Stamps
                            <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.75rem', color: jumuiyaColor }}>
                                {currentYearLabel}
                            </span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '10px'
                        }}>
                            {SEMESTER_LABELS.map((label, i) => {
                                const semKey = `sem_${i + 1}_reg`;
                                const isStamped = (displayRecord as any)[semKey] === true;
                                const isLatest = latestSemester === i + 1;
                                return (
                                    <div key={i} style={{
                                        textAlign: 'center',
                                        padding: '14px 6px 12px',
                                        background: isStamped
                                            ? `linear-gradient(135deg, ${jumuiyaColor}12, ${jumuiyaColor}08)`
                                            : '#f8fafc',
                                        borderRadius: '14px',
                                        border: isStamped
                                            ? `1.5px solid ${jumuiyaColor}40`
                                            : '1.5px dashed #d1d5db',
                                        position: 'relative',
                                    }}>
                                        <div style={{
                                            fontSize: '0.6rem', fontWeight: 700,
                                            color: isStamped ? jumuiyaColor : '#94a3b8',
                                            textTransform: 'uppercase', marginBottom: '6px',
                                            letterSpacing: '0.3px'
                                        }}>
                                            Sem {label}
                                        </div>

                                        <div style={{
                                            width: '36px', height: '36px',
                                            margin: '0 auto 4px',
                                            borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: isStamped
                                                ? `linear-gradient(135deg, ${jumuiyaColor}, ${jumuiyaColor}BB)`
                                                : 'transparent',
                                            border: isStamped ? 'none' : '2px solid #d1d5db',
                                            boxShadow: isStamped ? `0 2px 8px ${jumuiyaColor}44` : 'none',
                                        }}>
                                            {isStamped ? (
                                                <FaCheckCircle style={{ color: 'white', fontSize: '0.9rem' }} />
                                            ) : (
                                                <span style={{ color: '#cbd5e1', fontSize: '0.55rem', fontWeight: 700 }}>
                                                    {i + 1}
                                                </span>
                                            )}
                                        </div>

                                        {isStamped && (
                                            <div style={{
                                                fontSize: '0.45rem', fontWeight: 800, color: jumuiyaColor,
                                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                                background: `${jumuiyaColor}15`,
                                                padding: '1px 4px', borderRadius: '4px',
                                                display: 'inline-block'
                                            }}>
                                                STAMPED
                                            </div>
                                        )}

                                        {isLatest && (
                                            <div style={{
                                                position: 'absolute', top: '-6px', right: '-6px',
                                                background: '#22c55e', color: 'white',
                                                fontSize: '0.45rem', fontWeight: 800,
                                                padding: '2px 6px', borderRadius: '8px',
                                                boxShadow: '0 2px 6px rgba(34,197,94,0.4)',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                JUST STAMPED!
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingTop: '16px', borderTop: `2px solid ${jumuiyaColor}12`
                    }}>
                        <div>
                            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                                Year of Study
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                                {displayRecord.year || currentYearLabel}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                                Completed
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: jumuiyaColor }}>
                                {registeredCount} / 8 semesters
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                                Issue Date
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                                {new Date(displayRecord.joined_at || new Date()).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security footer */}
                <div style={{
                    height: '4px',
                    background: `repeating-linear-gradient(45deg, ${jumuiyaColor}, ${jumuiyaColor} 15px, #1e293b 15px, #1e293b 30px)`,
                }} />
            </div>
        </div>
    );
};

export default StampCard;
