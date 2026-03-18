import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import ReactMarkdown from 'react-markdown';


// ── Helpers ─────────────────────────────────────────
function parseAI(text) {
    if (!text) return null;
    
    try {
        return JSON.parse(text);
    } catch {
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first === -1 || last === -1) return null;
        const candidate = text.substring(first, last + 1);
        try {
            return JSON.parse(candidate);
        } catch {
            const cleaned = text.replace(/```json\s?|\s?```/g, '').trim();
            try { return JSON.parse(cleaned); } catch { return null; }
        }
    }
}

// Convert snake_case / underscore text → Title Case Words
function fmt(text) {
    if (!text || typeof text !== 'string') return text;
    // Only reformat if it contains underscores or is all lowercase with no spaces
    if (!text.includes('_') && /[A-Z ]/.test(text)) return text;
    return text
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

async function callAI(prompt) {
    const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            max_tokens: 3000,
            messages: [{ role: 'user', content: prompt }]
        })
    });
    const text = await res.text();
    const json = JSON.parse(text);
    if (!res.ok || json.error) throw new Error(json.message || json.error || 'API error');
    return json.content?.[0]?.text || '';
}

// ── Mini Chart Components ────────────────────────────
function BarChart({ data, color = '#FF6B35' }) {
    const max = Math.max(...data.map(d => d.value));
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                        width: '100%', borderRadius: '4px 4px 0 0',
                        height: `${(d.value / max) * 64}px`,
                        background: `linear-gradient(180deg, ${color}, ${color}44)`,
                        transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)', minHeight: 4,
                        boxShadow: `0 4px 12px ${color}22`
                    }} />
                    <span style={{ fontSize: 10, color: '#64748B', textAlign: 'center', lineHeight: 1.2, marginTop: 4 }}>{d.label}</span>
                </div>
            ))}
        </div>
    );
}

function RadarChart({ data, color = '#FF6B35' }) {
    const n = data.length;
    const cx = 80, cy = 80, r = 60;
    const points = data.map((d, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2;
        const v = (d.value / 100) * r;
        return { x: cx + v * Math.cos(angle), y: cy + v * Math.sin(angle) };
    });
    const polyStr = points.map(p => `${p.x},${p.y}`).join(' ');
    const outerPts = Array.from({ length: n }, (_, i) => {
        const angle = (i * 2 * Math.PI / n) - Math.PI / 2;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });

    return (
        <svg width="160" height="160">
            {[0.25, 0.5, 0.75, 1].map(s => (
                <polygon key={s}
                    points={outerPts.map(p => `${cx + (p.x - cx) * s},${cy + (p.y - cy) * s}`).join(' ')}
                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"
                />
            ))}
            {outerPts.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
            <polygon points={polyStr} fill={`${color}30`} stroke={color} strokeWidth="2" />
            {data.map((d, i) => {
                const angle = (i * 2 * Math.PI / n) - Math.PI / 2;
                const tx = cx + (r + 14) * Math.cos(angle);
                const ty = cy + (r + 14) * Math.sin(angle);
                return <text key={i} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#64748B">{d.label}</text>;
            })}
        </svg>
    );
}

function DonutChart({ value, label, info, color = '#FF6B35' }) {
    const r = 36, circ = 2 * Math.PI * r;
    const dash = (value / 100) * circ;
    return (
        <div style={{ position: 'relative', width: 90, height: 90 }}>
            {info && (
                <div style={{ position: 'absolute', top: -4, right: -4, zIndex: 10 }}>
                    <InfoTooltip text={info} />
                </div>
            )}
            <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9' }}>{value}%</span>
                <span style={{ fontSize: 9, color: '#64748B', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
            </div>
        </div>
    );
}

// ── Info Tooltip (fixed-position to escape overflow:hidden parents) ──────
function InfoTooltip({ text }) {
    const [pos, setPos] = useState(null);
    const btnRef = useRef(null);

    function showTooltip() {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const pad = 12;
        const w = 240;
        
        let targetX = center;
        if (center + w/2 > window.innerWidth - pad) {
            targetX = window.innerWidth - w/2 - pad;
        }
        if (center - w/2 < pad) {
            targetX = w/2 + pad;
        }

        setPos({
            top: rect.top - 12,
            left: targetX,
            centerX: center
        });
    }

    function hideTooltip() { setPos(null); }

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onFocus={showTooltip}
                onBlur={hideTooltip}
                onMouseEnter={e => { showTooltip(); e.currentTarget.style.background = 'rgba(255,107,53,0.2)'; e.currentTarget.style.color = '#FF8C5A'; }}
                onMouseLeave={e => { hideTooltip(); e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94A3B8'; }}
                style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '50%', width: 20, height: 20, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#94A3B8', fontWeight: 700, lineHeight: 1,
                    transition: 'background 0.2s, color 0.2s', flexShrink: 0,
                    verticalAlign: 'middle'
                }}
            >
                i
            </button>
            {pos && createPortal(
                <div style={{
                    position: 'fixed',
                    top: pos.top,
                    left: pos.left,
                    transform: 'translate(-50%, -100%)',
                    background: '#1E2030', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10, padding: '10px 14px',
                    width: 240, fontSize: 13, color: '#CBD5E1', lineHeight: 1.55,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                    zIndex: 999999, pointerEvents: 'none',
                    whiteSpace: 'normal',
                    animation: 'tooltip-reveal 0.1s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxSizing: 'border-box'
                }}>
                    {text}
                    {/* Arrow (relative to trigger center) */}
                    <div style={{
                        position: 'absolute', top: '100%',
                        left: `calc(50% + ${pos.centerX - pos.left}px)`,
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #1E2030'
                    }} />
                </div>,
                document.body
            )}
        </>
    );
}

// ── Section Components ───────────────────────────────
function SectionCard({ icon, title, color, children, badge, info }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 24, marginBottom: 24, overflow: 'hidden',
            transition: 'transform 0.3s ease, border-color 0.3s ease',
            cursor: 'default'
        }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}>
            <div style={{
                padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10, background: `${color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                    }}>{icon}</div>
                    <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 17, fontWeight: 700, color: '#F1F5F9' }}>{title}</h2>
                    {info && <InfoTooltip text={info} />}
                </div>
                {badge && <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}15`, padding: '3px 10px', borderRadius: 100 }}>{badge}</span>}
            </div>
            <div style={{ padding: '24px' }}>{children}</div>
        </div>
    );
}

function Tag({ text, color = '#C5A059' }) {
    return (
        <span style={{
            display: 'inline-block', background: `${color}12`, border: `1px solid ${color}30`,
            color, padding: '4px 12px', borderRadius: 100, fontSize: 13, margin: '3px 4px 3px 0'
        }}>{fmt(text)}</span>
    );
}

function JourneyStage({ stage, index }) {
    const colors = ['#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#10B981'];
    const c = colors[index % 5];
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${c}25`,
            borderRadius: 16, padding: '16px 18px', marginBottom: 12
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Stage {index + 1}
                    </span>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginTop: 2 }}>{stage.name}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Revenue Risk</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{stage.riskScore || 70}%</div>
                </div>
            </div>
            <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, marginBottom: 10 }}>{stage.description}</p>
            {stage.leakPoints && (
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>REVENUE LEAK POINTS</div>
                    {stage.leakPoints.map((l, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                            <span style={{ color: '#EF4444', marginTop: 2 }}>⚠</span>
                            <span style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>{l}</span>
                        </div>
                    ))}
                </div>
            )}
            {stage.action && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: `${c}0A`, borderRadius: 8, borderLeft: `3px solid ${c}` }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: c }}>ACTION: </span>
                    <span style={{ fontSize: 13, color: '#94A3B8' }}>{stage.action}</span>
                </div>
            )}
        </div>
    );
}

function PersonaCard({ persona, index }) {
    const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];
    const icons = ['👩', '👨', '🧑', '👤'];
    const c = colors[index % 4];
    const icon = icons[index % 4];
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${c}25`,
            borderRadius: 20, padding: '24px', flex: 1, minWidth: 280
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                    width: 52, height: 52, borderRadius: 14, background: `${c}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
                }}>{icon}</div>
                <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#F1F5F9' }}>{persona.name}</div>
                    <div style={{ fontSize: 13, color: c }}>{persona.archetype}</div>
                </div>
            </div>
            <div style={{ marginBottom: 16 }}>
                {[['Age', persona.age], ['Location', persona.location], ['Income', persona.income]].map(([k, v]) => v && (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: 13, color: '#64748B' }}>{k}</span>
                        <span style={{ fontSize: 13, color: '#94A3B8' }}>{v}</span>
                    </div>
                ))}
            </div>
            {persona.story && <p style={{ fontSize: 14, lineHeight: 1.65, color: '#64748B', marginBottom: 14 }}>{persona.story}</p>}
            {persona.goals && (
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', marginBottom: 8 }}>GOALS</div>
                    {persona.goals.map((g, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
                            <span style={{ color: c, fontSize: 12, marginTop: 2 }}>✓</span>
                            <span style={{ fontSize: 13, color: '#94A3B8' }}>{g}</span>
                        </div>
                    ))}
                </div>
            )}
            {persona.biggestFear && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#EF4444' }}>Biggest Fear: </span>
                    <span style={{ fontSize: 13, color: '#94A3B8' }}>{persona.biggestFear}</span>
                </div>
            )}
        </div>
    );
}

// ── Loading Screen ───────────────────────────────────
function LoadingScreen({ steps, currentStep, businessName }) {
    return (
        <div style={{
            minHeight: '100vh', background: '#0A0A0F',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 24
        }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{
                    width: 72, height: 72, borderRadius: 24, margin: '0 auto 24px',
                    background: 'linear-gradient(135deg, #C5A059, #E2D1B0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34,
                    boxShadow: '0 0 40px rgba(197, 160, 89, 0.2)'
                }}>⚡</div>
                <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 28, fontWeight: 700, color: '#FFFFFF', marginBottom: 12, letterSpacing: '-0.02em' }}>
                    Generating Intelligence Report
                </h2>
                <p style={{ fontSize: 16, color: '#666666' }}>Curating specialized market data for {businessName || 'your business'}...</p>
            </div>

            <div style={{ width: '100%', maxWidth: 500, marginBottom: 40 }}>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 24 }}>
                    <div style={{
                        height: '100%', borderRadius: 6, width: `${((currentStep + 1) / steps.length) * 100}%`,
                        background: 'linear-gradient(90deg, #C5A059, #E2D1B0)',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                </div>

                {steps.map((s, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
                        opacity: i > currentStep ? 0.35 : 1, transition: 'opacity 0.5s'
                    }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            background: i < currentStep ? '#10B981' : i === currentStep ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
                        }}>
                            {i < currentStep ? '✓' : i === currentStep ? <span style={{ animation: 'spin-anim 1s linear infinite', display: 'inline-block' }}>⟳</span> : ''}
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: i <= currentStep ? '#F1F5F9' : '#475569' }}>{s.label}</div>
                            <div style={{ fontSize: 12, color: '#475569' }}>{s.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`@keyframes spin-anim { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ── Main Report Dashboard ────────────────────────────
const GENERATION_STEPS = [
    { label: 'Analyzing Business Profile', desc: 'Reading your industry, price tier, and business model...' },
    { label: 'Mapping Customer Journey', desc: 'Building your 5-stage customer journey with revenue leak points...' },
    { label: 'Psychology Deep-Dive', desc: 'Uncovering desires, fears, and buying triggers...' },
    { label: 'Industry Landscape', desc: 'Scanning competitive landscape and market gaps...' },
    { label: 'Building Customer Personas', desc: 'Generating 2 detailed psychological profiles...' },
    { label: 'Buying Behavior Engine', desc: 'Mapping decision-making patterns and conversion triggers...' },
    { label: 'Compiling Action Plan', desc: 'Prioritizing 30-day action steps for maximum impact...' },
];

export default function ReportDashboard({ user }) {
    const { reportId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [status, setStatus] = useState('loading'); // loading, generating, done, error
    const [genStep, setGenStep] = useState(0);
    const [report, setReport] = useState(null);
    const [form, setForm] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [error, setError] = useState('');
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [showShareToast, setShowShareToast] = useState(false);

    // Load or generate report
    useEffect(() => {
        (async () => {
            try {
                // Get report doc
                const snap = await getDoc(doc(db, 'reports', reportId));
                if (!snap.exists()) { setError('Report not found.'); setStatus('error'); return; }

                const data = snap.data();
                setForm(data.form);
                
                // Security/Privacy: Check if this user is the owner
                const ownerId = data.userId;
                const currentUserId = user?.uid;
                const readOnly = ownerId && currentUserId !== ownerId;
                setIsReadOnly(readOnly);
                if (readOnly) setActiveTab('journey');

                if (data.status === 'done' && data.reportData) {
                    setReport(data.reportData);
                    setStatus('done');
                } else if (data.status === 'generating' || location.state?.isNew) {
                    setStatus('generating');
                    await generateFullReport(data.form, reportId);
                } else {
                    setStatus('generating');
                    await generateFullReport(data.form, reportId);
                }
            } catch (e) {
                console.error(e);
                setError(e.message);
                setStatus('error');
            }
        })();
    }, [reportId]);

    const generateFullReport = useCallback(async (formData, rid) => {
        setStatus('generating');
        setGenStep(0);

        const businessContext = `
Business Name: ${formData.businessName}
Industry: ${formData.industry}
Business Type: ${formData.businessType}
Price Tier: ${formData.priceTier}
Main Product/Service: ${formData.mainProduct}
Target Demographics: ${formData.targetAge}, ${formData.targetGender}, ${formData.targetLocation || 'Global'}
Biggest Challenge: ${formData.biggestChallenge || 'Not specified'}
Primary Goal: ${formData.goal || 'Not specified'}
Additional Notes: ${formData.additionalNotes || 'None'}
Website: ${formData.website || 'Not provided'}
Instagram: ${formData.instagram || 'Not provided'}
Facebook: ${formData.facebook || 'Not provided'}
LinkedIn: ${formData.linkedin || 'Not provided'}
Google My Business: ${formData.gmb || 'Not provided'}
`;

        try {
            // === MODULE 1: CUSTOMER JOURNEY ===
            setGenStep(1);
            const journeyRaw = await callAI(`You are a customer journey expert. Analyze this business and return ONLY a raw JSON object (no markdown):
${businessContext}
Return JSON:
{
  "stages": [
    { "name": "Awareness", "description": "...", "riskScore": 75, "leakPoints": ["leak1", "leak2"], "action": "specific action" },
    { "name": "Consideration", "description": "...", "riskScore": 60, "leakPoints": ["leak1", "leak2"], "action": "..." },
    { "name": "Decision", "description": "...", "riskScore": 85, "leakPoints": ["leak1", "leak2"], "action": "..." },
    { "name": "Retention", "description": "...", "riskScore": 50, "leakPoints": ["leak1", "leak2"], "action": "..." },
    { "name": "Advocacy", "description": "...", "riskScore": 40, "leakPoints": ["leak1", "leak2"], "action": "..." }
  ],
  "overallScore": 72,
  "topRisk": "Most critical stage to fix is...",
  "quickWin": "The fastest thing to do to improve conversions is..."
}`);
            const journey = parseAI(journeyRaw) || { stages: [], overallScore: 70, topRisk: '', quickWin: '' };

            // === MODULE 2: PSYCHOLOGY ===
            setGenStep(2);
            const psychRaw = await callAI(`You are a consumer psychology expert. Analyze this business and return ONLY raw JSON (no markdown):
${businessContext}
Return JSON:
{
  "coreDesires": ["desire1", "desire2", "desire3", "desire4"],
  "biggestFears": ["fear1", "fear2", "fear3"],
  "buyingTriggers": ["trigger1", "trigger2", "trigger3", "trigger4"],
  "emotionalDrivers": ["driver1", "driver2", "driver3"],
  "psychScores": [
    {"label": "Trust", "value": 78},
    {"label": "Urgency", "value": 65},
    {"label": "Social Proof", "value": 82},
    {"label": "Value", "value": 71},
    {"label": "FOMO", "value": 68}
  ],
  "conversionAdvice": "A detailed paragraph about how to tweak messaging to convert this persona immediately.",
  "messagingHooks": ["Hook 1: ...", "Hook 2: ...", "Hook 3: ..."]
}`);
            const psychology = parseAI(psychRaw) || { coreDesires: [], biggestFears: [], buyingTriggers: [], conversionAdvice: '' };

            // === MODULE 3: INDUSTRY ===
            setGenStep(3);
            const industryRaw = await callAI(`You are a market intelligence analyst. Analyze this business industry and return ONLY raw JSON (no markdown):
${businessContext}
Return JSON:
{
  "marketSize": "e.g. $12.4B global",
  "growthRate": "e.g. 18% YoY",
  "maturity": "Growing / Mature / Emerging",
  "opportunities": ["opp1", "opp2", "opp3"],
  "threats": ["threat1", "threat2", "threat3"],
  "keyTrends": ["trend1", "trend2", "trend3"],
  "competitorTypes": ["type1", "type2"],
  "uniquePositioning": "How this specific business should position to stand out...",
  "marketGaps": ["gap1", "gap2"],
  "industryScore": {"label": "Industry Health", "value": 74}
}`);
            const industry = parseAI(industryRaw) || { opportunities: [], threats: [], keyTrends: [] };

            // === MODULE 4: PERSONAS ===
            setGenStep(4);
            const personasRaw = await callAI(`You are a customer persona specialist. Create 4 detailed personas for this business and return ONLY raw JSON (no markdown):
${businessContext}
Return JSON:
{
  "personas": [
    {
      "name": "First name only",
      "archetype": "The [Archetype Label]",
      "age": "28–35",
      "location": "...",
      "income": "...",
      "story": "One paragraph day-in-the-life narrative...",
      "goals": ["goal1", "goal2", "goal3"],
      "biggestFear": "...",
      "buyingBehavior": "How they typically buy products like this...",
      "preferredChannels": ["channel1", "channel2"]
    },
    { ... }
  ]
}`);
            const personasData = parseAI(personasRaw) || { personas: [] };

            // === MODULE 5: BUYING BEHAVIOR ===
            setGenStep(5);
            const buyingRaw = await callAI(`You are a behavioral economics expert. Analyze buying behavior for this business and return ONLY raw JSON (no markdown):
${businessContext}
Return JSON:
{
  "decisionType": "Impulse / Considered / Complex",
  "avgDecisionTime": "e.g. 3–7 days",
  "keyInfluencers": ["influencer1", "influencer2", "influencer3"],
  "barriers": ["barrier1", "barrier2", "barrier3"],
  "priceSensitivity": 65,
  "loyaltyScore": 72,
  "referralLikelihood": 58,
  "buyingStages": [
    {"stage": "Problem Recognition", "action": "What triggers the need for this product..."},
    {"stage": "Information Search", "action": "Where they look, what they search for..."},
    {"stage": "Evaluation", "action": "How they compare options..."},
    {"stage": "Purchase", "action": "What finally makes them buy or abandon..."},
    {"stage": "Post-Purchase", "action": "What determines if they become loyal..."}
  ],
  "bestChannel": "Most effective channel to reach this buyer is...",
  "pricingPsychology": "How to frame pricing to maximize conversion..."
}`);
            const buying = parseAI(buyingRaw) || { keyInfluencers: [], barriers: [], buyingStages: [] };

            // === MODULE 6: ACTION PLAN ===
            setGenStep(6);
            const actionRaw = await callAI(`You are a growth strategist. Create a prioritized 30-day action plan for this business and return ONLY raw JSON (no markdown):
${businessContext}
Return JSON:
{
  "immediateActions": [
    {"priority": 1, "action": "...", "impact": "High", "effort": "Low", "timeframe": "This week"},
    {"priority": 2, "action": "...", "impact": "High", "effort": "Medium", "timeframe": "Week 1-2"},
    {"priority": 3, "action": "...", "impact": "Medium", "effort": "Low", "timeframe": "Week 1"}
  ],
  "week1": ["action1", "action2", "action3"],
  "week2": ["action1", "action2"],
  "week3": ["action1", "action2"],
  "week4": ["action1", "action2"],
  "kpis": ["kpi1 to measure", "kpi2", "kpi3"],
  "expectedOutcome": "What results to expect after 30 days of implementing this plan..."
}`);
            const actionPlan = parseAI(actionRaw) || { immediateActions: [], week1: [], week2: [] };

            const fullReport = {
                journey,
                psychology,
                industry,
                personas: personasData.personas || [],
                buying,
                actionPlan,
                generatedAt: new Date().toISOString(),
            };

            // Save to Firestore
            await updateDoc(doc(db, 'reports', rid), {
                status: 'done',
                reportData: fullReport,
                businessName: formData.businessName,
                industry: formData.industry,
                updatedAt: serverTimestamp(),
            });

            setReport(fullReport);
            setStatus('done');
        } catch (e) {
            console.error('Report generation error:', e);
            setError(e.message || 'Failed to generate report. Please try again.');
            setStatus('error');
            await updateDoc(doc(db, 'reports', rid), { status: 'error' }).catch(() => { });
        }
    }, [navigate]);

    const handleRegenerate = async () => {
        if (!window.confirm("Are you sure you want to regenerate this report? Current data will be replaced with fresh AI insights.")) return;
        setStatus('generating');
        await generateFullReport(form, reportId);
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
    };

    if (status === 'loading') {
        return (
            <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid rgba(255,107,53,0.2)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin-anim 0.8s linear infinite' }} />
                <style>{`@keyframes spin-anim { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (status === 'generating') {
        return <LoadingScreen steps={GENERATION_STEPS} currentStep={genStep} businessName={form?.businessName} />;
    }

    if (status === 'error') {
        return (
            <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
                <h2 style={{ color: '#F1F5F9', marginBottom: 8 }}>Generation Failed</h2>
                <p style={{ color: '#64748B', marginBottom: 24 }}>{error || 'An error occurred. Please try again.'}</p>
                <button onClick={() => navigate('/')} style={{ background: '#FF6B35', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    ← Back to Home
                </button>
            </div>
        );
    }

    const TABS = [
        { id: 'profile', label: 'BUSINESS PROFILE', icon: '🏢', color: '#94A3B8' },
        { id: 'journey', label: 'MAP JOURNEY', icon: '🗺️', color: '#3B82F6' },
        { id: 'psychology', label: 'PSYCHOLOGY', icon: '🧠', color: '#8B5CF6' },
        { id: 'industry', label: 'INDUSTRY', icon: '📊', color: '#10B981' },
        { id: 'personas', label: 'PERSONAS', icon: '👥', color: '#F59E0B' },
        { id: 'buying', label: 'BUYING', icon: '💡', color: '#EF4444' },
        { id: 'plan', label: 'ACTION PLAN', icon: '⚡', color: '#C5A059' },
    ].filter(t => !isReadOnly || (t.id !== 'profile'));

    return (
        <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
            <style>{`
                 @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                 @keyframes message-slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                 @keyframes glow-pulse { 0% { box-shadow: 0 0 0px rgba(255,107,53,0); } 50% { box-shadow: 0 0 15px rgba(255,107,53,0.1); } 100% { box-shadow: 0 0 0px rgba(255,107,53,0); } }
                 @keyframes dot-pulse { 0% { opacity: 0.2; } 50% { opacity: 1; } 100% { opacity: 0.2; } }
                 @keyframes tooltip-reveal { from { opacity: 0; transform: translate(-50%, -95%); } to { opacity: 1; transform: translate(-50%, -100%); } }
                 .aesthetic-view h2 { font-size: 1.25em; margin-top: 28px; color: #FFFFFF; margin-bottom: 10px; font-weight: 600; }
                 .aesthetic-view p { margin-bottom: 16px; color: #BBBBBB; font-family: 'Inter Tight', sans-serif; }
                 .aesthetic-view { font-family: 'Inter Tight', sans-serif; font-size: 0.95em; line-height: 1.7; }
                 .aesthetic-view strong { color: #FFFFFF; font-weight: 700; font-style: normal; }
                 @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                 .markdown-content h1, .markdown-content h2, .markdown-content h3 { color: #FFFFFF; font-weight: 700; margin-top: 2em; margin-bottom: 0.5em; }
                 .markdown-content strong { color: #FFFFFF; font-weight: 800; }
                 .markdown-content p { margin-bottom: 1.5em; }
                 .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                 .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); borderRadius: 10px; }
                 .advisor-sidebar div, .advisor-sidebar button { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                 @media (max-width: 900px) { .advisor-sidebar { display: none !important; } }
                 @media (max-width: 768px) { .personas-grid { grid-template-columns: 1fr !important; } }
            `}</style>

            {/* Top Bar */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                height: 60
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate('/')} style={{
                        background: 'none', border: 'none', color: '#64748B', cursor: 'pointer',
                        fontSize: 20, display: 'flex', alignItems: 'center'
                    }}>←</button>
                    <div>
                        <div style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 15, color: '#F1F5F9' }}>
                            {form?.businessName || 'Business'} analysis
                        </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 100 }}>{isReadOnly ? '👀 Shared View' : '✓ Complete'}</span>
                    {!isReadOnly && (
                        <button 
                            onClick={handleRegenerate}
                            style={{
                                background: 'rgba(197, 160, 89, 0.1)', border: '1px solid rgba(197, 160, 89, 0.2)',
                                color: '#C5A059', padding: '3px 10px', borderRadius: 100, fontSize: 11,
                                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(197, 160, 89, 0.2)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(197, 160, 89, 0.1)'}
                        >
                            ⟳ Regenerate
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {showShareToast && (
                        <div style={{
                            fontSize: 12, color: '#10B981', background: 'rgba(16,185,129,0.1)',
                            padding: '4px 12px', borderRadius: 8, animation: 'fade-in 0.3s'
                        }}>Link copied!</div>
                    )}
                    <button onClick={handleShare} style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F1F5F9', padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                        fontSize: 13, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6
                    }}>
                        <span>🔗</span> Share
                    </button>
                    <button onClick={() => navigate('/my-reports')} style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94A3B8', padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                        fontSize: 13, fontFamily: 'Inter, sans-serif'
                    }}>
                        My Reports
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex' }}>
                {/* --- 📟 MINIMALIST SIDEBAR RAIL --- */}
                <div style={{
                    width: 68, height: 'calc(100vh - 60px)', position: 'sticky', top: 60,
                    background: '#1A1A1A', borderRight: '1px solid rgba(255,255,255,0.03)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20, gap: 24,
                    flexShrink: 0, zIndex: 100
                }} className="dashboard-sidebar">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} title={t.label}
                            onMouseEnter={e => { if (activeTab !== t.id) e.currentTarget.style.color = '#FFFFFF'; }}
                            onMouseLeave={e => { if (activeTab !== t.id) e.currentTarget.style.color = '#666666'; }}
                            style={{
                                background: activeTab === t.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                border: 'none',
                                color: activeTab === t.id ? '#FFFFFF' : '#666666',
                                width: 42, height: 42, borderRadius: 12, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative'
                            }}>
                            <span style={{ fontSize: 20, filter: activeTab === t.id ? 'none' : 'grayscale(100%) opacity(0.5)', transition: 'all 0.3s' }}>{t.icon}</span>
                            {activeTab === t.id && (
                                <div style={{ position: 'absolute', left: 0, width: 3, height: 20, background: '#C5A059', borderRadius: '0 4px 4px 0', boxShadow: '0 0 10px #C5A059' }} />
                            )}
                        </button>
                    ))}
                </div>

                {/* --- 📄 MAIN CONTENT AREA --- */}
                <div style={{ flex: 1, minWidth: 0, background: '#0A0A0F' }}>
                        <>
                            {activeTab === 'profile' && (
                            <div style={{
                                background: '#1A1A1A',
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                padding: '60px 80px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Background Detail Layer */}
                                <div style={{
                                    position: 'absolute', top: 0, right: 0, width: '40%', height: '100%',
                                    background: 'linear-gradient(to left, rgba(59,130,246,0.03), transparent)',
                                    pointerEvents: 'none'
                                }} />
                                
                                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 60, alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                                    <div style={{ flex: 1, minWidth: 320 }}>
                                        {/* Meta Tags Section */}
                                        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                                            <span style={{ 
                                                fontSize: 10, fontWeight: 800, color: '#3B82F6', 
                                                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                                                padding: '5px 12px', borderRadius: 99, letterSpacing: '0.08em' 
                                            }}>
                                                {form?.industry?.toUpperCase()}
                                            </span>
                                            <span style={{ 
                                                fontSize: 10, fontWeight: 800, color: '#10B981', 
                                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                                                padding: '5px 12px', borderRadius: 99, letterSpacing: '0.08em' 
                                            }}>
                                                {form?.businessType?.toUpperCase()}
                                            </span>
                                        </div>
                                        
                                        <h1 style={{ 
                                            fontFamily: "'Inter Tight', sans-serif", fontSize: 44, 
                                            fontWeight: 700, color: '#FFFFFF', marginBottom: 16, 
                                            letterSpacing: '-0.04em', lineHeight: 1 
                                        }}>
                                            Overview Analysis
                                        </h1>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
                                            <p style={{ fontSize: 15, color: '#64748B', fontWeight: 500, margin: 0 }}>
                                                Last updated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>

                                        {/* Digital Footprint Quick Links */}
                                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                            {form?.website && (
                                                <a href={form.website.startsWith('http') ? form.website : `https://${form.website}`} 
                                                   target="_blank" rel="noreferrer" 
                                                   style={{ 
                                                       fontSize: 13, color: '#F1F5F9', textDecoration: 'none', 
                                                       background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
                                                       padding: '10px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, 
                                                       transition: 'all 0.2s', fontWeight: 500 
                                                   }}
                                                   onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                                                   onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                                >
                                                    <span style={{ fontSize: 16 }}>🌐</span> Website
                                                </a>
                                            )}
                                            {form?.instagram && <div style={{ fontSize: 13, color: '#F1F5F9', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}><span>📸</span> Instagram</div>}
                                            {form?.facebook && <div style={{ fontSize: 13, color: '#F1F5F9', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}><span>📘</span> Facebook</div>}
                                            {form?.linkedin && <div style={{ fontSize: 13, color: '#F1F5F9', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}><span>💼</span> LinkedIn</div>}
                                            {form?.gmb && <div style={{ fontSize: 13, color: '#F1F5F9', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}><span>📍</span> GMB</div>}
                                        </div>
                                    </div>

                                    {/* KPI Stat Cards */}
                                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                        {[
                                            { value: report?.journey?.overallScore || 72, label: 'Journey Health', color: '#3B82F6', info: "Overall efficiency of your Customer Sales Funnel. High scores mean a friction-free path from awareness to purchase." },
                                            { value: report?.industry?.industryScore?.value || 68, label: 'Market Context', color: '#10B981', info: "Your competitive positioning. Measures how well you stand out against industry trends and competitor saturation." },
                                            { value: report?.buying?.loyaltyScore || 80, label: 'Loyalty Index', color: '#8B5CF6', info: "Retention & Advocacy strength. High scores indicate customers likely to stay long-term and recommend your business." }
                                        ].map((kpi, i) => (
                                            <div key={i} style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: 28,
                                                padding: '24px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 16,
                                                minWidth: 160,
                                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                cursor: 'default'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                                e.currentTarget.style.transform = 'translateY(-6px)';
                                                e.currentTarget.style.borderColor = `${kpi.color}40`;
                                                e.currentTarget.style.boxShadow = `0 20px 40px -20px ${kpi.color}30`;
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}>
                                                <DonutChart value={kpi.value} label={kpi.label} info={kpi.info} color={kpi.color} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            )}
                            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 60px' }}>
                                {/* ── BUSINESS PROFILE TAB ── */}
                                {activeTab === 'profile' && (
                                    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 60 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                            <div>
                                                <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Business Profile</h2>
                                                <p style={{ color: '#64748B', fontSize: 14 }}>Manage your digital footprint and core business identity.</p>
                                            </div>
                                            {!isReadOnly && (
                                                <button 
                                                    onClick={async () => {
                                                        if (window.confirm("Updating your profile will reset your current tokens and trigger a full AI re-analysis. Continue?")) {
                                                            setStatus('generating');
                                                            await updateDoc(doc(db, 'reports', reportId), { form });
                                                            await generateFullReport(form, reportId);
                                                        }
                                                    }}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                                                        border: 'none', color: '#fff', padding: '12px 24px', borderRadius: 12,
                                                        fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,107,53,0.3)'
                                                    }}
                                                >
                                                    ⚡ Update & Refresh Analysis
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
                                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Core Identity</h3>
                                                <div style={{ marginBottom: 16 }}>
                                                    <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>Business Name</label>
                                                    <input 
                                                        disabled={isReadOnly}
                                                        style={{ width: '100%', background: isReadOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: isReadOnly ? '#94A3B8' : '#F1F5F9', cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                                        value={form?.businessName || ''} onChange={e => setForm({...form, businessName: e.target.value})}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: 16 }}>
                                                    <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>Industry</label>
                                                    <input 
                                                        disabled={isReadOnly}
                                                        style={{ width: '100%', background: isReadOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: isReadOnly ? '#94A3B8' : '#F1F5F9', cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                                        value={form?.industry || ''} onChange={e => setForm({...form, industry: e.target.value})}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: 16 }}>
                                                    <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>Business Type</label>
                                                    <input 
                                                        disabled={isReadOnly}
                                                        style={{ width: '100%', background: isReadOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: isReadOnly ? '#94A3B8' : '#F1F5F9', cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                                        value={form?.businessType || ''} onChange={e => setForm({...form, businessType: e.target.value})}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
                                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Digital Footprint</h3>
                                                <div style={{ marginBottom: 16 }}>
                                                    <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>Website</label>
                                                    <input 
                                                        disabled={isReadOnly}
                                                        style={{ width: '100%', background: isReadOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: isReadOnly ? '#94A3B8' : '#F1F5F9', cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                                        value={form?.website || ''} onChange={e => setForm({...form, website: e.target.value})}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: 16 }}>
                                                    <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>Instagram</label>
                                                    <input 
                                                        disabled={isReadOnly}
                                                        style={{ width: '100%', background: isReadOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: isReadOnly ? '#94A3B8' : '#F1F5F9', cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                                        value={form?.instagram || ''} onChange={e => setForm({...form, instagram: e.target.value})}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: 16 }}>
                                                    <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>LinkedIn</label>
                                                    <input 
                                                        disabled={isReadOnly}
                                                        style={{ width: '100%', background: isReadOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: isReadOnly ? '#94A3B8' : '#F1F5F9', cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                                        value={form?.linkedin || ''} onChange={e => setForm({...form, linkedin: e.target.value})}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: 16 }}>
                                                    <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>GMB Link</label>
                                                    <input 
                                                        disabled={isReadOnly}
                                                        style={{ width: '100%', background: isReadOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: isReadOnly ? '#94A3B8' : '#F1F5F9', cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                                        value={form?.gmb || ''} onChange={e => setForm({...form, gmb: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Competitive Strategy</h3>
                                            <div style={{ marginBottom: 16 }}>
                                                <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>Biggest Business Challenge</label>
                                                <textarea 
                                                    disabled={isReadOnly}
                                                    style={{ width: '100%', background: isReadOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: isReadOnly ? '#94A3B8' : '#F1F5F9', minHeight: 80, cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                                    value={form?.biggestChallenge || ''} onChange={e => setForm({...form, biggestChallenge: e.target.value})}
                                                />
                                            </div>
                                            <div style={{ marginBottom: 16 }}>
                                                <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6 }}>Main Product/Service</label>
                                                <textarea 
                                                    disabled={isReadOnly}
                                                    style={{ width: '100%', background: isReadOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: isReadOnly ? '#94A3B8' : '#F1F5F9', minHeight: 80, cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                                    value={form?.mainProduct || ''} onChange={e => setForm({...form, mainProduct: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── JOURNEY TAB ── */}
                                {activeTab === 'journey' && report?.journey && (
                                    <div style={{ paddingBottom: 60 }}>
                                        <div style={{ marginBottom: 32 }}>
                                            <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Customer Journey Map</h2>
                                            <p style={{ color: '#64748B', fontSize: 14 }}>Visualize every touchpoint and identify revenue leakage across your sales funnel.</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
                                            <div style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 20px' }}>
                                                <div style={{ fontSize: 12, color: '#9B9B9B', marginBottom: 4 }}>TOP RISK STAGE</div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#EF4444', lineHeight: 1.5 }}>{report.journey.topRisk}</div>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 20px' }}>
                                                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>QUICK WIN</div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#10B981', lineHeight: 1.5 }}>{report.journey.quickWin}</div>
                                            </div>
                                        </div>

                                        {/* Risk bar chart */}
                                        {report.journey.stages?.length > 0 && (
                                            <SectionCard icon="📈" title="Revenue Risk by Stage" color="#3B82F6" badge="5 Stages Mapped"
                                                info="Shows how much revenue you are at risk of losing at each step of the customer journey. Higher % = more customers dropping off at that stage.">
                                                <BarChart
                                                    data={report.journey.stages.map(s => ({ label: s.name, value: s.riskScore || 70 }))}
                                                    color="#3B82F6"
                                                />
                                                <p style={{ fontSize: 12, color: '#475569', marginTop: 12 }}>Higher bar = higher revenue loss risk at that stage</p>
                                            </SectionCard>
                                        )}

                                        <SectionCard icon="🗺️" title="5-Stage Customer Journey" color="#3B82F6"
                                            info="A step-by-step map of how your customers find you, evaluate you, buy from you, stay with you, and recommend you. Each stage shows where you are losing people and what to do about it.">
                                            {report.journey.stages?.map((s, i) => <JourneyStage key={i} stage={s} index={i} />)}
                                        </SectionCard>
                                    </div>
                                )}

                                {/* ── PSYCHOLOGY TAB ── */}
                                {activeTab === 'psychology' && report?.psychology && (
                                    <div style={{ paddingBottom: 60 }}>
                                        <div style={{ marginBottom: 32 }}>
                                            <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Consumer Psychology</h2>
                                            <p style={{ color: '#64748B', fontSize: 14 }}>Decode the emotional drivers, fears, and triggers that influence your audience's behavior.</p>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }} className="psych-grid">
                                            <SectionCard icon="✨" title="Core Desires" color="#8B5CF6"
                                                info="The deep emotional and practical things your customers really want when they look for a product like yours. Use these to write your headlines, ads, and pitch.">
                                                {report.psychology.coreDesires?.map((d, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                                                        <div style={{ width: 20, height: 20, borderRadius: 6, background: '#8B5CF680', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>{i + 1}</div>
                                                        <span style={{ fontSize: 14, color: '#C4B5FD', lineHeight: 1.5 }}>{fmt(d)}</span>
                                                    </div>
                                                ))}
                                            </SectionCard>
                                            <SectionCard icon="🚨" title="Biggest Fears" color="#EF4444"
                                                info="What your customers are most afraid of when making a purchase decision. Addressing these fears in your marketing directly reduces hesitation and increases trust.">
                                                {report.psychology.biggestFears?.map((f, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                                                        <span style={{ color: '#EF4444', flexShrink: 0 }}>⚠</span>
                                                        <span style={{ fontSize: 14, color: '#FCA5A5', lineHeight: 1.5 }}>{fmt(f)}</span>
                                                    </div>
                                                ))}
                                            </SectionCard>
                                        </div>

                                        <SectionCard icon="🎯" title="Buying Triggers" color="#10B981"
                                            info="The specific events or feelings that push a customer to finally make a purchase. These are the moments you should target with your ads, emails, and offers.">
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                                {report.psychology.buyingTriggers?.map((t, i) => <Tag key={i} text={t} color="#10B981" />)}
                                            </div>
                                        </SectionCard>

                                        {report.psychology.psychScores && (
                                            <SectionCard icon="📡" title="Psychological Influence Scores" color="#8B5CF6"
                                                info="A radar chart showing how strongly different psychological levers (trust, urgency, social proof etc.) influence your customers. Higher score = more impactful lever to use in messaging.">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                                                    <RadarChart data={report.psychology.psychScores} color="#8B5CF6" />
                                                    <div style={{ flex: 1 }}>
                                                        {report.psychology.psychScores.map((s, i) => (
                                                            <div key={i} style={{ marginBottom: 10 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                                    <span style={{ fontSize: 13, color: '#94A3B8' }}>{s.label}</span>
                                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{s.value}%</span>
                                                                </div>
                                                                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6 }}>
                                                                    <div style={{ height: '100%', width: `${s.value}%`, borderRadius: 6, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', transition: 'width 1s ease' }} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </SectionCard>
                                        )}

                                        <SectionCard icon="💬" title="Conversion Strategy" color="#FF6B35"
                                            info="AI-generated recommendations on exactly how to tweak your messaging, offer, and communication to convert more visitors into paying customers.">
                                            <p style={{ fontSize: 15, lineHeight: 1.7, color: '#94A3B8', marginBottom: 16 }}>{report.psychology.conversionAdvice}</p>
                                            {report.psychology.messagingHooks && (
                                                <>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', marginBottom: 10 }}>MESSAGING HOOKS TO USE</div>
                                                    {report.psychology.messagingHooks.map((h, i) => (
                                                        <div key={i} style={{
                                                            padding: '12px 16px', background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)',
                                                            borderRadius: 10, marginBottom: 8, fontSize: 14, color: '#FDBA74', lineHeight: 1.5
                                                        }}>{h}</div>
                                                    ))}
                                                </>
                                            )}
                                        </SectionCard>
                                    </div>
                                )}

                                {/* ── INDUSTRY TAB ── */}
                                {activeTab === 'industry' && report?.industry && (
                                    <div style={{ paddingBottom: 60 }}>
                                        <div style={{ marginBottom: 32 }}>
                                            <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Industry & Market Insights</h2>
                                            <p style={{ color: '#64748B', fontSize: 14 }}>Analyze market size, emerging trends, and your unique strategic positioning.</p>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }} className="industry-stats">
                                            {[
                                                { label: 'Market Size', value: report.industry.marketSize || 'N/A', icon: '💰', color: '#10B981' },
                                                { label: 'Growth Rate', value: report.industry.growthRate || 'N/A', icon: '📈', color: '#3B82F6' },
                                                { label: 'Maturity', value: report.industry.maturity || 'N/A', icon: '🎯', color: '#F59E0B' },
                                            ].map(stat => (
                                                <div key={stat.label} style={{
                                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                                                    borderRadius: 16, padding: '20px', textAlign: 'center'
                                                }}>
                                                    <div style={{ fontSize: 26, marginBottom: 8 }}>{stat.icon}</div>
                                                    <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, fontFamily: "'Inter Tight', sans-serif", marginBottom: 4 }}>{stat.value}</div>
                                                    <div style={{ fontSize: 12, color: '#64748B' }}>{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="opp-threat-grid">
                                            <SectionCard icon="🚀" title="Opportunities" color="#10B981"
                                                info="Market gaps and emerging trends your business can exploit right now to grow faster than competitors. These are real openings in your industry that are currently underserved.">
                                                {report.industry.opportunities?.map((o, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                                        <span style={{ color: '#10B981', flexShrink: 0 }}>→</span>
                                                        <span style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.5 }}>{fmt(o)}</span>
                                                    </div>
                                                ))}
                                            </SectionCard>
                                            <SectionCard icon="⚠️" title="Threats to Watch" color="#EF4444"
                                                info="External risks and competitive or market forces that could hurt your business if left unchecked. Being aware of these helps you stay one step ahead.">
                                                {report.industry.threats?.map((t, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                                        <span style={{ color: '#EF4444', flexShrink: 0 }}>!</span>
                                                        <span style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.5 }}>{fmt(t)}</span>
                                                    </div>
                                                ))}
                                            </SectionCard>
                                        </div>

                                        <SectionCard icon="📊" title="Key Industry Trends" color="#3B82F6"
                                            info="The biggest shifts currently happening in your industry. Knowing these trends helps you align your product, marketing, and strategy with where the market is heading.">
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                                {report.industry.keyTrends?.map((t, i) => <Tag key={i} text={t} color="#3B82F6" />)}
                                            </div>
                                        </SectionCard>

                                        <SectionCard icon="🎯" title="Your Positioning Strategy" color="#F59E0B"
                                            info="How your business should be uniquely positioned in the market to stand out from competitors. Includes the specific market gaps you can own and win.">
                                            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#94A3B8' }}>{report.industry.uniquePositioning}</p>
                                            {report.industry.marketGaps && (
                                                <>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', marginTop: 16, marginBottom: 10 }}>MARKET GAPS TO EXPLOIT</div>
                                                    {report.industry.marketGaps.map((g, i) => <Tag key={i} text={g} color="#F59E0B" />)}
                                                </>
                                            )}
                                        </SectionCard>

                                        <style>{`
              @media (max-width: 600px) {
                .industry-stats { grid-template-columns: 1fr 1fr !important; }
                .opp-threat-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
                                    </div>
                                )}

                                {/* ── PERSONAS TAB ── */}
                                {activeTab === 'personas' && (
                                    <div style={{ paddingBottom: 60 }}>
                                        <div style={{ marginBottom: 32 }}>
                                            <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Customer Personas</h2>
                                            <p style={{ color: '#64748B', fontSize: 14 }}>Detailed profiles of your ideal customers based on demographic and psychographic data.</p>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 24 }} className="personas-grid">
                                            {report?.personas?.map((p, i) => <PersonaCard key={i} persona={p} index={i} />)}
                                        </div>
                                    </div>
                                )}

                                {/* ── BUYING TAB ── */}
                                {activeTab === 'buying' && report?.buying && (
                                    <div style={{ paddingBottom: 60 }}>
                                        <div style={{ marginBottom: 32 }}>
                                            <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Buying Journey Analysis</h2>
                                            <p style={{ color: '#64748B', fontSize: 14 }}>Understand decision-making cycles, loyalty metrics, and conversion barriers.</p>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }} className="buying-stats">
                                            {[
                                                { label: 'Decision Type', value: report.buying.decisionType || 'Considered', icon: '🧠', color: '#8B5CF6' },
                                                { label: 'Avg Decision Time', value: report.buying.avgDecisionTime || '3-7 days', icon: '⏱', color: '#3B82F6' },
                                                { label: 'Price Sensitivity', value: `${report.buying.priceSensitivity || 65}%`, icon: '💰', color: '#EF4444' },
                                            ].map(stat => (
                                                <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: 26, marginBottom: 8 }}>{stat.icon}</div>
                                                    <div style={{ fontSize: 17, fontWeight: 800, color: stat.color, fontFamily: "'Inter Tight', sans-serif", marginBottom: 4 }}>{stat.value}</div>
                                                    <div style={{ fontSize: 12, color: '#64748B' }}>{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                                            <DonutChart value={report.buying.loyaltyScore || 72} label="Loyalty" color="#10B981" />
                                            <DonutChart value={report.buying.referralLikelihood || 58} label="Referral Rate" color="#8B5CF6" />
                                            <DonutChart value={100 - (report.buying.priceSensitivity || 65)} label="Price Flex" color="#F59E0B" />
                                        </div>

                                        <SectionCard icon="🛒" title="5-Stage Buying Journey" color="#EF4444"
                                            info="Traces the exact mental steps your customer goes through — from first realizing they have a problem to becoming a loyal repeat buyer. Each stage shows what action to take.">
                                            {report.buying.buyingStages?.map((b, i) => (
                                                <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>{b.stage}</div>
                                                    <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>{b.action}</p>
                                                </div>
                                            ))}
                                        </SectionCard>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="buy-grid">
                                            <SectionCard icon="💡" title="Key Influencers" color="#F59E0B"
                                                info="The people, platforms, or content types that most influence your customer's purchase decision. Target these to amplify your reach and credibility.">
                                                {report.buying.keyInfluencers?.map((k, i) => <Tag key={i} text={k} color="#F59E0B" />)}
                                            </SectionCard>
                                            <SectionCard icon="🚧" title="Purchase Barriers" color="#EF4444"
                                                info="The specific objections, doubts, or friction points that stop customers from completing a purchase. Removing these barriers is one of the fastest ways to increase conversions.">
                                                {report.buying.barriers?.map((b, i) => <Tag key={i} text={b} color="#EF4444" />)}
                                            </SectionCard>
                                        </div>

                                        {report.buying.pricingPsychology && (
                                            <SectionCard icon="💳" title="Pricing Psychology" color="#10B981"
                                                info="How to frame and present your pricing so customers feel they are getting great value. Small changes in how you show price can dramatically increase your conversion rate.">
                                                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#94A3B8' }}>{report.buying.pricingPsychology}</p>
                                            </SectionCard>
                                        )}

                                        <style>{`
              @media (max-width: 600px) {
                .buying-stats { grid-template-columns: 1fr 1fr !important; }
                .buy-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
                                    </div>
                                )}

                                {/* ── ACTION PLAN TAB ── */}
                                {activeTab === 'plan' && report?.actionPlan && (
                                    <div style={{ paddingBottom: 60 }}>
                                        <div style={{ marginBottom: 32 }}>
                                            <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>30-Day Growth Plan</h2>
                                            <p style={{ color: '#64748B', fontSize: 14 }}>A structured, high-impact roadmap designed to deliver measurable results within one month.</p>
                                        </div>
                                        {report.actionPlan.immediateActions && (
                                            <SectionCard icon="⚡" title="Top Priority Actions" color="#FF6B35" badge="Quick Wins"
                                                info="The 3 highest-impact actions you should take immediately, ranked by effort vs. impact. These are your fastest path to visible results in the next 7 days.">
                                                {report.actionPlan.immediateActions.map((a, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex', gap: 16, padding: '16px', marginBottom: 10,
                                                        background: 'rgba(255,107,53,0.04)', border: '1px solid rgba(255,107,53,0.12)',
                                                        borderRadius: 12, alignItems: 'flex-start'
                                                    }}>
                                                        <div style={{
                                                            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                                            background: 'rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#FF6B35'
                                                        }}>#{a.priority}</div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 4 }}>{a.action}</div>
                                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                                <span style={{ fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 100 }}>Impact: {a.impact}</span>
                                                                <span style={{ fontSize: 11, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 100 }}>Effort: {a.effort}</span>
                                                                <span style={{ fontSize: 11, color: '#94A3B8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 100 }}>{a.timeframe}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </SectionCard>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }} className="weeks-grid">
                                            {[
                                                { week: 'Week 1', items: report.actionPlan.week1, color: '#3B82F6' },
                                                { week: 'Week 2', items: report.actionPlan.week2, color: '#8B5CF6' },
                                                { week: 'Week 3', items: report.actionPlan.week3, color: '#10B981' },
                                                { week: 'Week 4', items: report.actionPlan.week4, color: '#F59E0B' },
                                            ].map(w => w.items && (
                                                <div key={w.week} style={{
                                                    background: 'rgba(255,255,255,0.03)', border: `1px solid ${w.color}20`,
                                                    borderRadius: 16, padding: '18px'
                                                }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: w.color, marginBottom: 12 }}>{w.week}</div>
                                                    {w.items.map((item, i) => (
                                                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                                            <span style={{ color: w.color, flexShrink: 0, fontSize: 12, marginTop: 1 }}>✓</span>
                                                            <span style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>

                                        {report.actionPlan.kpis && (
                                            <SectionCard icon="📏" title="KPIs to Track" color="#10B981"
                                                info="The Key Performance Indicators you should measure to know if your 30-day action plan is working. These numbers act as your progress report.">
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {report.actionPlan.kpis.map((k, i) => <Tag key={i} text={k} color="#10B981" />)}
                                                </div>
                                            </SectionCard>
                                        )}

                                        {report.actionPlan.expectedOutcome && (
                                            <SectionCard icon="🎯" title="Expected Outcome (30 days)" color="#FF6B35"
                                                info="What realistic results you should expect after consistently applying this action plan for 30 days. Use this as a benchmark to measure your progress.">
                                                <p style={{ fontSize: 15, lineHeight: 1.7, color: '#94A3B8' }}>{report.actionPlan.expectedOutcome}</p>
                                            </SectionCard>
                                        )}

                                        <style>{`
              @media (max-width: 600px) { .weeks-grid { grid-template-columns: 1fr !important; } }
              @media (max-width: 600px) { .psych-grid { grid-template-columns: 1fr !important; } }
              @media (max-width: 900px) { .dashboard-sidebar { display: none !important; } }
            `}</style>
                                    </div>
                                )}

                            </div>
                        </>
                </div>
            </div>
        </div>
    );
}
