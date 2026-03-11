import React, { useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function getFriendlyError(err) {
    if (!err?.code) return err?.message || 'An error occurred.';
    const map = {
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/user-not-found': 'No account with this email.',
        'auth/wrong-password': 'Wrong password. Try again.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/invalid-email': 'Please enter a valid email.',
    };
    return map[err.code] || err.message;
}

export default function AuthModal({ mode, pendingFormData, onClose, onSuccess, onSwitchMode }) {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(mode === 'login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setIsLogin(mode === 'login');
        setError('');
    }, [mode]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email || !password) { setError('Please fill in all fields.'); return; }
        setLoading(true);
        setError('');
        try {
            let userCred;
            if (isLogin) {
                userCred = await signInWithEmailAndPassword(auth, email, password);
            } else {
                userCred = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCred.user);
                await setDoc(doc(db, 'users', userCred.user.uid), {
                    email: userCred.user.email,
                    name: name || '',
                    createdAt: serverTimestamp(),
                }, { merge: true });
            }

            const user = userCred.user;

            // If there's pending form data, generate report now
            if (pendingFormData) {
                await generateAndRedirect(user, pendingFormData);
            } else {
                onSuccess(user);
            }
        } catch (err) {
            setError(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const userCred = await signInWithPopup(auth, provider);
            const user = userCred.user;

            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                name: user.displayName || '',
                createdAt: serverTimestamp(),
            }, { merge: true });

            if (pendingFormData) {
                await generateAndRedirect(user, pendingFormData);
            } else {
                onSuccess(user);
            }
        } catch (err) {
            setError(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    }

    async function generateAndRedirect(user, formData) {
        const reportRef = await addDoc(collection(db, 'reports'), {
            userId: user.uid,
            userEmail: user.email,
            status: 'generating',
            form: formData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        onSuccess(user);
        navigate(`/report/${reportRef.id}`, { state: { form: formData, isNew: true } });
    }

    const inputStyle = {
        width: '100%', background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
        padding: '12px 14px', color: '#F1F5F9', fontSize: 15,
        fontFamily: 'Inter, sans-serif', outline: 'none',
        marginBottom: 12
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }} onClick={onClose}>
            <div style={{
                background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24, padding: '40px 32px', width: '100%', maxWidth: 440,
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                {/* Close btn */}
                <button onClick={onClose} style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94A3B8',
                    width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16
                }}>✕</button>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px', fontSize: 22
                    }}>⚡</div>
                    <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 22, fontWeight: 800, color: '#F1F5F9', marginBottom: 4 }}>
                        {isLogin ? 'Welcome Back' : 'Create Free Account'}
                    </h2>
                    <p style={{ fontSize: 14, color: '#64748B' }}>
                        {pendingFormData
                            ? 'Sign in or register to generate your report.'
                            : isLogin ? 'Sign in to access your reports.' : 'Join PeoplePlex for free.'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 8, padding: '10px 14px', color: '#FCA5A5', fontSize: 13, marginBottom: 16
                    }}>{error}</div>
                )}

                {/* Google btn */}
                <button onClick={handleGoogle} disabled={loading} style={{
                    width: '100%', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                    color: '#F1F5F9', padding: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ fontSize: 12, color: '#475569' }}>or</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input
                            style={inputStyle} placeholder="Full Name"
                            value={name} onChange={e => setName(e.target.value)}
                        />
                    )}
                    <input
                        style={inputStyle} placeholder="Email Address" type="email"
                        value={email} onChange={e => setEmail(e.target.value)}
                    />
                    <input
                        style={inputStyle} placeholder="Password" type="password"
                        value={password} onChange={e => setPassword(e.target.value)}
                    />

                    <button type="submit" disabled={loading} style={{
                        width: '100%',
                        background: loading ? 'rgba(255,107,53,0.4)' : 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                        border: 'none', color: '#fff', padding: '13px', borderRadius: 10,
                        cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15,
                        fontWeight: 700, fontFamily: 'Inter, sans-serif', marginTop: 4,
                        boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,53,0.35)'
                    }}>
                        {loading
                            ? (pendingFormData ? '⏳ Creating report...' : '⏳ Please wait...')
                            : (isLogin ? 'Sign In' : pendingFormData ? '⚡ Create Account & Generate Report' : 'Create Free Account')}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: 13, color: '#475569', marginTop: 20 }}>
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{
                        background: 'none', border: 'none', color: '#FF6B35', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600
                    }}>
                        {isLogin ? 'Create one free' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
