import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from './firebase';

const INDUSTRIES = [
    'SaaS / Software', 'E-Commerce / Retail', 'Healthcare / Wellness', 'Finance / Fintech',
    'Education / EdTech', 'Real Estate', 'Food & Beverage', 'Fashion / Apparel',
    'Travel & Hospitality', 'Marketing & Agency', 'Consulting / Professional Services',
    'Manufacturing', 'Media & Entertainment', 'Non-Profit', 'Other'
];

// Currency-aware price tiers
const CURRENCIES = [
    { label: '🇮🇳 India (INR ₹)', value: 'INR', symbol: '₹', tiers: ['Free / Freemium', '< ₹5,000/mo', '₹5,000–₹50,000/mo', '₹50,000–₹2L/mo', '₹2L+/mo'] },
    { label: '🇺🇸 USA (USD $)', value: 'USD', symbol: '$', tiers: ['Free / Freemium', '< $50/mo', '$50–$500/mo', '$500–$2k/mo', '$2k+/mo'] },
    { label: '🇬🇧 UK (GBP £)', value: 'GBP', symbol: '£', tiers: ['Free / Freemium', '< £40/mo', '£40–£400/mo', '£400–£1,600/mo', '£1,600+/mo'] },
    { label: '🇪🇺 Europe (EUR €)', value: 'EUR', symbol: '€', tiers: ['Free / Freemium', '< €50/mo', '€50–€450/mo', '€450–€2k/mo', '€2k+/mo'] },
    { label: '🇦🇪 UAE (AED د.إ)', value: 'AED', symbol: 'AED', tiers: ['Free / Freemium', '< AED 200/mo', 'AED 200–2,000/mo', 'AED 2,000–7,500/mo', 'AED 7,500+/mo'] },
    { label: '🇸🇬 Singapore (SGD S$)', value: 'SGD', symbol: 'S$', tiers: ['Free / Freemium', '< S$70/mo', 'S$70–S$700/mo', 'S$700–S$2,800/mo', 'S$2,800+/mo'] },
    { label: '🇦🇺 Australia (AUD A$)', value: 'AUD', symbol: 'A$', tiers: ['Free / Freemium', '< A$80/mo', 'A$80–A$800/mo', 'A$800–A$3,200/mo', 'A$3,200+/mo'] },
    { label: '🇨🇦 Canada (CAD C$)', value: 'CAD', symbol: 'C$', tiers: ['Free / Freemium', '< C$70/mo', 'C$70–C$700/mo', 'C$700–C$2,800/mo', 'C$2,800+/mo'] },
    { label: '🇯🇵 Japan (JPY ¥)', value: 'JPY', symbol: '¥', tiers: ['Free / Freemium', '< ¥7,500/mo', '¥7,500–¥75,000/mo', '¥75,000–¥300,000/mo', '¥300,000+/mo'] },
    { label: '🇧🇷 Brazil (BRL R$)', value: 'BRL', symbol: 'R$', tiers: ['Free / Freemium', '< R$250/mo', 'R$250–R$2,500/mo', 'R$2,500–R$10,000/mo', 'R$10,000+/mo'] },
    { label: '🇲🇽 Mexico (MXN MX$)', value: 'MXN', symbol: 'MX$', tiers: ['Free / Freemium', '< MX$900/mo', 'MX$900–MX$9,000/mo', 'MX$9,000–MX$35,000/mo', 'MX$35,000+/mo'] },
    { label: '🇿🇦 South Africa (ZAR R)', value: 'ZAR', symbol: 'R', tiers: ['Free / Freemium', '< R900/mo', 'R900–R9,000/mo', 'R9,000–R36,000/mo', 'R36,000+/mo'] },
    { label: '🇳🇬 Nigeria (NGN ₦)', value: 'NGN', symbol: '₦', tiers: ['Free / Freemium', '< ₦40,000/mo', '₦40,000–₦400,000/mo', '₦400,000–₦1.6M/mo', '₦1.6M+/mo'] },
    { label: '🇲🇾 Malaysia (MYR RM)', value: 'MYR', symbol: 'RM', tiers: ['Free / Freemium', '< RM230/mo', 'RM230–RM2,300/mo', 'RM2,300–RM9,000/mo', 'RM9,000+/mo'] },
    { label: '🇵🇭 Philippines (PHP ₱)', value: 'PHP', symbol: '₱', tiers: ['Free / Freemium', '< ₱2,800/mo', '₱2,800–₱28,000/mo', '₱28,000–₱112,000/mo', '₱112,000+/mo'] },
];

const TIER_VALUES = ['free', 'budget', 'mid', 'premium', 'enterprise'];

function getPriceTiers(currencyCode) {
    const cur = CURRENCIES.find(c => c.value === currencyCode) || CURRENCIES[0];
    return cur.tiers.map((label, i) => ({ label, value: TIER_VALUES[i] }));
}


const BUSINESS_TYPES = [
    { label: 'B2C (Business to Consumer)', value: 'b2c' },
    { label: 'B2B (Business to Business)', value: 'b2b' },
    { label: 'B2B2C', value: 'b2b2c' },
    { label: 'Marketplace', value: 'marketplace' },
    { label: 'D2C (Direct to Consumer)', value: 'd2c' },
];

const CUSTOMER_AGES = [
    'Gen Z (18–25)', 'Millennials (26–41)', 'Gen X (42–57)',
    'Baby Boomers (58–76)', 'All Ages'
];

const FEATURES = [
    {
        icon: '🗺️',
        title: 'Customer Journey Mapping',
        desc: 'AI maps your complete 5-stage customer journey — Awareness, Consideration, Decision, Retention & Advocacy — with specific revenue leak points.',
        color: '#3B82F6'
    },
    {
        icon: '🧠',
        title: 'Psychology Deep-Dive',
        desc: 'Uncover the core desires, fears, and buying triggers of your target persona with neuroscience-backed insights.',
        color: '#8B5CF6'
    },
    {
        icon: '📊',
        title: 'Industry Landscape Analysis',
        desc: 'Get a full competitive landscape report with market opportunities, threats, and positioning recommendations.',
        color: '#10B981'
    },
    {
        icon: '💡',
        title: 'Buying Behavior Engine',
        desc: 'Understand exactly how your customers make purchase decisions and what triggers move them from interest to payment.',
        color: '#F59E0B'
    },
    {
        icon: '👥',
        title: 'Persona Generation',
        desc: 'AI builds 2 detailed customer personas with demographics, psychographics, and a full day-in-the-life narrative.',
        color: '#EF4444'
    },
    {
        icon: '⚡',
        title: 'Instant Action Plan',
        desc: 'Get a prioritized 30-day action plan with specific messaging recommendations to improve conversions immediately.',
        color: '#FF6B35'
    },
];

const STEP_LABELS = ['Business Info', 'Target Customer', 'Goals & Notes'];

// ── Custom Dropdown (replaces native <select> to avoid white OS dropdown) ──
function CustomSelect({ value, onChange, options, placeholder }) {
    const [open, setOpen] = useState(false);
    const ref = React.useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const selected = options.find(o => (o.value ?? o) === value);
    const displayLabel = selected ? (selected.label ?? selected) : placeholder;

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${open ? 'rgba(255,107,53,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, padding: '12px 14px',
                    color: value ? '#F1F5F9' : '#475569',
                    fontSize: 15, fontFamily: 'Inter, sans-serif',
                    textAlign: 'left', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'border-color 0.2s'
                }}
            >
                <span>{displayLabel}</span>
                <span style={{ fontSize: 11, color: '#64748B', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10, zIndex: 999, maxHeight: 220, overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,107,53,0.3) transparent'
                }}>
                    {options.map((opt, i) => {
                        const val = opt.value ?? opt;
                        const label = opt.label ?? opt;
                        const isSelected = val === value;
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => { onChange(val); setOpen(false); }}
                                style={{
                                    display: 'block', width: '100%', textAlign: 'left',
                                    padding: '10px 14px', background: isSelected ? 'rgba(255,107,53,0.15)' : 'transparent',
                                    border: 'none', color: isSelected ? '#FF8C5A' : '#C4C4D4',
                                    fontSize: 14, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                                    borderBottom: i < options.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


function Navbar({ user, onOpenAuth, navigate }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile menu when resizing to desktop
    useEffect(() => {
        function handleResize() {
            if (window.innerWidth > 768) setMobileOpen(false);
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '0 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', height: 64
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700
                }}>⚡</div>
                <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 18, color: '#F1F5F9' }}>
                    People<span style={{ color: '#FF6B35' }}>Plex</span>
                </span>
            </div>

            {/* Desktop Nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, '@media(maxWidth:768px)': { display: 'none' } }} className="desktop-nav">
                {user ? (
                    <>
                        <button onClick={() => navigate('/my-reports')} style={navBtnStyle()}>My Reports</button>
                        <button onClick={() => signOut(auth).then(() => window.location.reload())} style={navBtnStyle()}>Sign Out</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => onOpenAuth('login')} style={navBtnStyle()}>Sign In</button>
                        <button onClick={() => onOpenAuth('register')} style={navBtnPrimaryStyle()}>Create Account</button>
                    </>
                )}
            </div>

            {/* Mobile Hamburger */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 22, display: 'none' }}
                className="mobile-menu-btn"
            >☰</button>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div style={{
                    position: 'absolute', top: 64, left: 0, right: 0,
                    background: '#0F0F1A', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: 16, display: 'flex', flexDirection: 'column', gap: 8
                }}>
                    {user ? (
                        <>
                            <button onClick={() => { navigate('/my-reports'); setMobileOpen(false); }} style={{ ...navBtnStyle(), textAlign: 'left', width: '100%' }}>My Reports</button>
                            <button onClick={() => signOut(auth).then(() => window.location.reload())} style={{ ...navBtnStyle(), textAlign: 'left', width: '100%' }}>Sign Out</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { onOpenAuth('login'); setMobileOpen(false); }} style={{ ...navBtnStyle(), textAlign: 'left', width: '100%' }}>Sign In</button>
                            <button onClick={() => { onOpenAuth('register'); setMobileOpen(false); }} style={{ ...navBtnPrimaryStyle(), textAlign: 'left', width: '100%' }}>Create Account</button>
                        </>
                    )}
                </div>
            )}

            <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
        </nav>
    );
}

function navBtnStyle() {
    return {
        background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
        color: '#94A3B8', padding: '8px 16px', borderRadius: 8,
        cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif',
        transition: 'all 0.2s'
    };
}
function navBtnPrimaryStyle() {
    return {
        background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
        border: 'none', color: '#fff', padding: '8px 18px', borderRadius: 8,
        cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif',
        transition: 'all 0.2s'
    };
}



export default function HomePage({ user, onOpenAuth }) {
    const navigate = useNavigate();
    const formRef = useRef(null);
    const [step, setStep] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        businessName: '',
        industry: '',
        businessType: '',
        website: '',
        instagram: '',
        facebook: '',
        linkedin: '',
        gmb: '',
        currency: 'INR',
        priceTier: '',
        targetAge: '',
        targetGender: 'All',
        targetLocation: '',
        mainProduct: '',
        biggestChallenge: '',
        goal: '',
        additionalNotes: '',
    });

    const set = (k, v) => {
        setForm(p => ({ ...p, [k]: v }));
        setError(''); // Clear error when user changes any field
    };

    function scrollToForm() {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function validateStep() {
        if (step === 0) {
            if (!form.businessName.trim()) return 'Please enter your business name.';
            if (!form.industry) return 'Please select your industry.';
            if (!form.businessType) return 'Please select your business type.';
            if (!form.priceTier) return 'Please select your price tier.';
        }
        if (step === 1) {
            if (!form.targetAge) return 'Please select your target age group.';
            if (!form.mainProduct.trim()) return 'Please describe your main product/service.';
        }
        return null;
    }

    function nextStep() {
        const err = validateStep();
        if (err) { setError(err); return; }
        setError('');
        setStep(s => s + 1);
    }

    function prevStep() {
        setError('');
        setStep(s => s - 1);
    }

    async function handleGenerate() {
        const err = validateStep();
        if (err) { setError(err); return; }
        setError('');

        if (!user) {
            // Show auth modal, pass form data as pending
            onOpenAuth('register', form);
            return;
        }

        await generateReport();
    }

    async function generateReport() {
        setGenerating(true);
        setError('');
        try {
            // Create a report document in Firestore
            const reportRef = await addDoc(collection(db, 'reports'), {
                userId: user.uid,
                userEmail: user.email,
                status: 'generating',
                form,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Navigate to report page — the report page will trigger generation
            navigate(`/report/${reportRef.id}`, { state: { form, isNew: true } });
        } catch (e) {
            console.error(e);
            setError('Failed to start analysis. Please try again.');
            setGenerating(false);
        }
    }

    const inputStyle = {
        width: '100%', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
        padding: '12px 14px', color: '#F1F5F9', fontSize: 15,
        fontFamily: 'Inter, sans-serif', outline: 'none',
        transition: 'border-color 0.2s'
    };
    const selectStyle = { ...inputStyle, cursor: 'pointer', colorScheme: 'dark' };
    const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#94A3B8', marginBottom: 6 };
    const fieldStyle = { marginBottom: 18 };

    return (
        <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
            <Navbar user={user} onOpenAuth={onOpenAuth} navigate={navigate} />

            {/* ── HERO SECTION ─────────────────────────── */}
            <section style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center',
                padding: '80px 24px 60px', position: 'relative', overflow: 'hidden'
            }}>
                {/* Background glow */}
                <div style={{
                    position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
                    width: 600, height: 400,
                    background: 'radial-gradient(ellipse, rgba(255,107,53,0.12) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="hero-grid">
                    {/* Left Copy */}
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
                            padding: '6px 14px', borderRadius: 100, marginBottom: 24
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B35', display: 'inline-block' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#FF6B35', letterSpacing: '0.05em' }}>AI-POWERED BUSINESS INTELLIGENCE</span>
                        </div>

                        <h1 style={{
                            fontFamily: "'Inter Tight', sans-serif",
                            fontSize: 'clamp(36px, 5vw, 58px)',
                            fontWeight: 800, lineHeight: 1.1,
                            color: '#F1F5F9', marginBottom: 24
                        }}>
                            Understand Your<br />
                            <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Customers Deeply
                            </span>
                        </h1>

                        <p style={{ fontSize: 18, lineHeight: 1.7, color: '#94A3B8', marginBottom: 32, maxWidth: 480 }}>
                            Enter your business details and get a <strong style={{ color: '#F1F5F9' }}>complete AI intelligence report</strong> — customer journey, psychology audit, industry analysis & buying behavior — in under 2 minutes.
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
                            {['Customer Journey Map', 'Psychology Audit', 'Industry Analysis', 'Persona Generation'].map(tag => (
                                <span key={tag} style={{
                                    fontSize: 13, color: '#64748B', padding: '4px 12px',
                                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100
                                }}>{tag}</span>
                            ))}
                        </div>

                        <button onClick={scrollToForm} style={{
                            background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                            border: 'none', color: '#fff', padding: '14px 28px',
                            borderRadius: 12, cursor: 'pointer', fontSize: 16,
                            fontWeight: 700, fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 8px 32px rgba(255,107,53,0.35)',
                            transition: 'transform 0.2s'
                        }}>
                            Generate Free Report →
                        </button>

                        <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
                            {[['500+', 'Reports Generated'], ['6', 'Analysis Modules'], ['2 min', 'Average Time']].map(([val, label]) => (
                                <div key={label}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', fontFamily: "'Inter Tight', sans-serif" }}>{val}</div>
                                    <div style={{ fontSize: 12, color: '#64748B' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — FORM */}
                    <div ref={formRef} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 24, padding: '32px 28px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        {/* Form Header */}
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', fontFamily: "'Inter Tight', sans-serif" }}>
                                    {STEP_LABELS[step]}
                                </h2>
                                <span style={{ fontSize: 13, color: '#64748B' }}>{step + 1} / {STEP_LABELS.length}</span>
                            </div>
                            {/* Progress bar */}
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                                <div style={{
                                    height: '100%', borderRadius: 4,
                                    width: `${((step + 1) / STEP_LABELS.length) * 100}%`,
                                    background: 'linear-gradient(90deg, #FF6B35, #FF8C5A)',
                                    transition: 'width 0.4s ease'
                                }} />
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 8, padding: '10px 14px', color: '#FCA5A5', fontSize: 13,
                                marginBottom: 18
                            }}>{error}</div>
                        )}

                        {/* Step 0: Business Info */}
                        {step === 0 && (
                            <>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Business Name *</label>
                                    <input
                                        style={inputStyle} value={form.businessName} placeholder="e.g. Acme Corp"
                                        onChange={e => set('businessName', e.target.value)}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Industry *</label>
                                    <CustomSelect
                                        value={form.industry}
                                        onChange={v => set('industry', v)}
                                        placeholder="Select industry..."
                                        options={INDUSTRIES}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                                    <div>
                                        <label style={labelStyle}>Business Type *</label>
                                        <CustomSelect
                                            value={form.businessType}
                                            onChange={v => set('businessType', v)}
                                            placeholder="Select type..."
                                            options={BUSINESS_TYPES}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Country / Currency *</label>
                                        <CustomSelect
                                            value={form.currency}
                                            onChange={v => { set('currency', v); set('priceTier', ''); }}
                                            placeholder="Select country..."
                                            options={CURRENCIES}
                                        />
                                    </div>
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Price Tier *</label>
                                    <CustomSelect
                                        value={form.priceTier}
                                        onChange={v => set('priceTier', v)}
                                        placeholder="Select tier..."
                                        options={getPriceTiers(form.currency)}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Website URL</label>
                                    <input
                                        style={inputStyle} value={form.website} placeholder="https://yourwebsite.com"
                                        onChange={e => set('website', e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                                    <div>
                                        <label style={labelStyle}>Instagram Profile</label>
                                        <input
                                            style={inputStyle} value={form.instagram} placeholder="@username"
                                            onChange={e => set('instagram', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Facebook Page</label>
                                        <input
                                            style={inputStyle} value={form.facebook} placeholder="fb.com/page"
                                            onChange={e => set('facebook', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                                    <div>
                                        <label style={labelStyle}>LinkedIn Profile</label>
                                        <input
                                            style={inputStyle} value={form.linkedin} placeholder="linkedin.com/company/..."
                                            onChange={e => set('linkedin', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Google My Business (GMB)</label>
                                        <input
                                            style={inputStyle} value={form.gmb} placeholder="GMB Name or Maps Link"
                                            onChange={e => set('gmb', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 1: Target Customer */}
                        {step === 1 && (
                            <>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Main Product / Service *</label>
                                    <textarea
                                        style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                                        value={form.mainProduct}
                                        placeholder="Describe what you sell in 1-2 sentences..."
                                        onChange={e => set('mainProduct', e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                                    <div>
                                        <label style={labelStyle}>Target Age Group *</label>
                                        <CustomSelect
                                            value={form.targetAge}
                                            onChange={v => set('targetAge', v)}
                                            placeholder="Select age..."
                                            options={CUSTOMER_AGES}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Gender Focus</label>
                                        <CustomSelect
                                            value={form.targetGender}
                                            onChange={v => set('targetGender', v)}
                                            placeholder="All Genders"
                                            options={[
                                                { label: 'All Genders', value: 'All' },
                                                { label: 'Primarily Female', value: 'Female' },
                                                { label: 'Primarily Male', value: 'Male' },
                                            ]}
                                        />
                                    </div>
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Target Location / Market</label>
                                    <input
                                        style={inputStyle} value={form.targetLocation} placeholder="e.g. USA, UK, Global, Southeast Asia"
                                        onChange={e => set('targetLocation', e.target.value)}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Biggest Business Challenge</label>
                                    <input
                                        style={inputStyle} value={form.biggestChallenge} placeholder="e.g. Low conversion rate, high churn..."
                                        onChange={e => set('biggestChallenge', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Step 2: Goals */}
                        {step === 2 && (
                            <>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Primary Goal for this Analysis</label>
                                    <CustomSelect
                                        value={form.goal}
                                        onChange={v => set('goal', v)}
                                        placeholder="Select your goal..."
                                        options={[
                                            { label: 'Increase Conversions', value: 'increase_conversions' },
                                            { label: 'Reduce Customer Churn', value: 'reduce_churn' },
                                            { label: 'Enter a New Market', value: 'enter_new_market' },
                                            { label: 'Improve Retention', value: 'improve_retention' },
                                            { label: 'Launch a New Product', value: 'launch_product' },
                                            { label: 'Understand My Audience', value: 'understand_audience' },
                                        ]}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Additional Context (optional)</label>
                                    <textarea
                                        style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                                        value={form.additionalNotes}
                                        placeholder="Any specific context you want the AI to know — recent changes, competitors, specific concerns..."
                                        onChange={e => set('additionalNotes', e.target.value)}
                                    />
                                </div>
                                {!user && (
                                    <div style={{
                                        background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)',
                                        borderRadius: 12, padding: '14px 16px', marginBottom: 18
                                    }}>
                                        <p style={{ fontSize: 13, color: '#FDBA74', fontWeight: 600, marginBottom: 4 }}>
                                            🔐 Free Account Required
                                        </p>
                                        <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
                                            Create your free account to generate the report and save it to your dashboard. No credit card needed.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                            {step > 0 && (
                                <button onClick={prevStep} style={{
                                    flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#94A3B8', padding: '12px', borderRadius: 10, cursor: 'pointer',
                                    fontSize: 14, fontFamily: 'Inter, sans-serif'
                                }}>
                                    ← Back
                                </button>
                            )}
                            {step < STEP_LABELS.length - 1 ? (
                                <button onClick={nextStep} style={{
                                    flex: 1, background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                                    border: 'none', color: '#fff', padding: '12px', borderRadius: 10,
                                    cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif'
                                }}>
                                    Next Step →
                                </button>
                            ) : (
                                <button onClick={handleGenerate} disabled={generating} style={{
                                    flex: 1,
                                    background: generating ? 'rgba(255,107,53,0.4)' : 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                                    border: 'none', color: '#fff', padding: '12px', borderRadius: 10,
                                    cursor: generating ? 'not-allowed' : 'pointer', fontSize: 14,
                                    fontWeight: 700, fontFamily: 'Inter, sans-serif',
                                    boxShadow: generating ? 'none' : '0 4px 20px rgba(255,107,53,0.4)'
                                }}>
                                    {generating ? '⏳ Starting...' : user ? '⚡ Generate Full Report' : '🔐 Create Account & Generate'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile form ref target */}
                <style>{`
          @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          }
        `}</style>
            </section>

            {/* ── FEATURES SECTION ─────────────────────── */}
            <section style={{ padding: '100px 24px', background: '#0F0F1A' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <span style={{
                            fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
                            color: '#FF6B35', textTransform: 'uppercase', display: 'block', marginBottom: 16
                        }}>WHAT YOU'LL GET</span>
                        <h2 style={{
                            fontFamily: "'Inter Tight', sans-serif",
                            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800,
                            color: '#F1F5F9', lineHeight: 1.15, marginBottom: 16
                        }}>
                            6 Complete Intelligence Modules
                        </h2>
                        <p style={{ color: '#64748B', fontSize: 17, maxWidth: 540, margin: '0 auto' }}>
                            One report. Everything you need to understand your customers, outmaneuver competition, and grow faster.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20
                    }} className="features-grid">
                        {FEATURES.map((f) => (
                            <div key={f.title} style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 20, padding: '28px 24px',
                                transition: 'border-color 0.3s, transform 0.2s',
                                cursor: 'default'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.color}40`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12, marginBottom: 16,
                                    background: `${f.color}15`, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: 22
                                }}>{f.icon}</div>
                                <h3 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 17, fontWeight: 700, color: '#F1F5F9', marginBottom: 10 }}>{f.title}</h3>
                                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#64748B' }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    <style>{`
            @media (max-width: 900px) { .features-grid { grid-template-columns: 1fr 1fr !important; } }
            @media (max-width: 600px) { .features-grid { grid-template-columns: 1fr !important; } }
          `}</style>
                </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────── */}
            <section style={{ padding: '100px 24px', background: '#0A0A0F' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#FF6B35', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>SIMPLE PROCESS</span>
                        <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#F1F5F9' }}>
                            From Input to Insights in 3 Steps
                        </h2>
                    </div>

                    <div style={{ display: 'flex', gap: 0, position: 'relative' }} className="steps-container">
                        {[
                            { n: '01', title: 'Fill the Form', desc: 'Enter your business details — industry, target customer, and goals. Takes about 2 minutes.', icon: '📝' },
                            { n: '02', title: 'AI Generates Report', desc: 'Our multi-module AI engine analyzes your business from 6 different intelligence perspectives simultaneously.', icon: '⚡' },
                            { n: '03', title: 'Interactive Dashboard', desc: 'View your complete report with charts, persona cards, journey maps, and actionable recommendations.', icon: '📊' },
                        ].map((s, i) => (
                            <div key={s.n} style={{ flex: 1, textAlign: 'center', padding: '0 20px', position: 'relative' }}>
                                {i < 2 && (
                                    <div style={{
                                        position: 'absolute', top: 30, right: -20, width: 40,
                                        height: 2, background: 'linear-gradient(90deg, rgba(255,107,53,0.5), rgba(255,107,53,0.1))',
                                        zIndex: 1
                                    }} className="step-connector" />
                                )}
                                <div style={{
                                    width: 60, height: 60, borderRadius: '50%', margin: '0 auto 20px',
                                    background: 'rgba(255,107,53,0.1)', border: '2px solid rgba(255,107,53,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
                                }}>{s.icon}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#FF6B35', letterSpacing: '0.1em', marginBottom: 10 }}>{s.n}</div>
                                <h3 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 10 }}>{s.title}</h3>
                                <p style={{ fontSize: 14, lineHeight: 1.65, color: '#64748B' }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>

                    <style>{`
            @media (max-width: 600px) {
              .steps-container { flex-direction: column !important; gap: 40px; }
              .step-connector { display: none !important; }
            }
          `}</style>

                    {/* CTA */}
                    <div style={{ textAlign: 'center', marginTop: 60 }}>
                        <button onClick={scrollToForm} style={{
                            background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                            border: 'none', color: '#fff', padding: '16px 36px',
                            borderRadius: 12, cursor: 'pointer', fontSize: 16,
                            fontWeight: 700, fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 8px 32px rgba(255,107,53,0.35)'
                        }}>
                            Start Free Analysis →
                        </button>
                        <p style={{ fontSize: 13, color: '#475569', marginTop: 12 }}>No credit card required. Free account included.</p>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────────── */}
            <footer style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: '32px 24px', textAlign: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>⚡</div>
                    <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 15, color: '#F1F5F9' }}>People<span style={{ color: '#FF6B35' }}>Plex</span></span>
                </div>
                <p style={{ fontSize: 13, color: '#334155' }}>© 2025 PeoplePlex. AI-Powered Business Intelligence.</p>
            </footer>
        </div>
    );
}
