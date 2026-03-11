import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from './firebase';

export default function MyReports({ user }) {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [fetchError, setFetchError] = useState('');

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                // No orderBy — avoids requiring a Firestore composite index
                // Sort client-side instead
                const q = query(
                    collection(db, 'reports'),
                    where('userId', '==', user.uid)
                );
                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                // Sort newest first client-side
                data.sort((a, b) => {
                    const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
                    const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
                    return bTime - aTime;
                });
                setReports(data);
            } catch (e) {
                console.error('Failed to load reports:', e);
                setFetchError('Could not load reports. Please refresh.');
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    async function handleDelete(id) {
        if (!window.confirm('Delete this report? This cannot be undone.')) return;
        setDeleting(id);
        try {
            await deleteDoc(doc(db, 'reports', id));
            setReports(r => r.filter(x => x.id !== id));
        } catch (e) { console.error(e); }
        setDeleting(null);
    }

    function statusBadge(status) {
        const map = {
            done: { label: '✓ Complete', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
            generating: { label: '⟳ Generating', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
            error: { label: '✕ Failed', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
        };
        const s = map[status] || map.error;
        return <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: '3px 10px', borderRadius: 100 }}>{s.label}</span>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
            {/* Navbar */}
            <nav style={{
                background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '0 24px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', height: 64
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
                    <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 17, color: '#F1F5F9' }}>People<span style={{ color: '#FF6B35' }}>Plex</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                        New Report
                    </button>
                    <button onClick={() => signOut(auth).then(() => navigate('/'))} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                        Sign Out
                    </button>
                </div>
            </nav>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
                {/* Header */}
                <div style={{ marginBottom: 40 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#FF6B35', textTransform: 'uppercase' }}>YOUR WORKSPACE</span>
                    <h1 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, color: '#F1F5F9', marginTop: 8, marginBottom: 8 }}>
                        My Intelligence Reports
                    </h1>
                    <p style={{ color: '#64748B', fontSize: 15 }}>
                        {user?.email} · {reports.length} report{reports.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ width: 36, height: 36, border: '3px solid rgba(255,107,53,0.2)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                        <p style={{ color: '#64748B', fontSize: 14 }}>Loading your reports...</p>
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : fetchError ? (
                    <div style={{ textAlign: 'center', padding: '60px 32px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 20 }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                        <p style={{ color: '#FCA5A5', fontSize: 15 }}>{fetchError}</p>
                        <button onClick={() => window.location.reload()} style={{ marginTop: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            Refresh
                        </button>
                    </div>
                ) : reports.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '80px 32px',
                        background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
                        borderRadius: 24
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                        <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 20, fontWeight: 700, color: '#F1F5F9', marginBottom: 10 }}>No reports yet</h2>
                        <p style={{ color: '#64748B', marginBottom: 28, fontSize: 15 }}>Generate your first AI intelligence report from the home page.</p>
                        <button onClick={() => navigate('/')} style={{
                            background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)', border: 'none', color: '#fff',
                            padding: '12px 28px', borderRadius: 12, cursor: 'pointer', fontSize: 14,
                            fontWeight: 700, fontFamily: 'Inter, sans-serif'
                        }}>
                            ⚡ Generate First Report
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {reports.map(r => (
                            <div key={r.id} style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 20, padding: '24px',
                                display: 'flex', gap: 20, alignItems: 'center',
                                flexWrap: 'wrap', transition: 'border-color 0.2s'
                            }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,107,53,0.2)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                                    background: 'rgba(255,107,53,0.12)', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: 24
                                }}>⚡</div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <h3 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 17, fontWeight: 700, color: '#F1F5F9' }}>
                                            {r.businessName || r.form?.businessName || 'Business Report'}
                                        </h3>
                                        {statusBadge(r.status)}
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 13, color: '#475569' }}>{r.industry || r.form?.industry || 'Industry'}</span>
                                        {r.form?.businessType && <span style={{ fontSize: 13, color: '#475569' }}>· {r.form.businessType.toUpperCase()}</span>}
                                        {r.createdAt?.toDate && <span style={{ fontSize: 13, color: '#475569' }}>· {r.createdAt.toDate().toLocaleDateString()}</span>}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {r.status === 'done' ? (
                                        <button onClick={() => navigate(`/report/${r.id}`)} style={{
                                            background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)', border: 'none', color: '#fff',
                                            padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
                                            fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif'
                                        }}>
                                            View Report →
                                        </button>
                                    ) : r.status === 'error' ? (
                                        <button onClick={() => navigate(`/report/${r.id}`)} style={{
                                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)',
                                            color: '#FCA5A5', padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
                                            fontSize: 13, fontFamily: 'Inter, sans-serif'
                                        }}>
                                            Retry
                                        </button>
                                    ) : (
                                        <button onClick={() => navigate(`/report/${r.id}`)} style={{
                                            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)',
                                            color: '#FCD34D', padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
                                            fontSize: 13, fontFamily: 'Inter, sans-serif'
                                        }}>
                                            View Progress →
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        disabled={deleting === r.id}
                                        style={{
                                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                                            color: '#EF4444', padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                                            fontSize: 13, fontFamily: 'Inter, sans-serif'
                                        }}
                                    >
                                        {deleting === r.id ? '...' : '🗑'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Generate Another CTA */}
                {reports.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: 40 }}>
                        <button onClick={() => navigate('/')} style={{
                            background: 'transparent', border: '1px solid rgba(255,107,53,0.3)', color: '#FF6B35',
                            padding: '12px 28px', borderRadius: 12, cursor: 'pointer', fontSize: 14,
                            fontWeight: 600, fontFamily: 'Inter, sans-serif'
                        }}>
                            + Generate New Report
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
