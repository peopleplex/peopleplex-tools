import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// ── Helpers ─────────────────────────────────────────
function parseAI(text) {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last === -1) return null;
    try { return JSON.parse(text.substring(first, last + 1)); } catch { return null; }
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
                        background: `linear-gradient(180deg, ${color}, ${color}88)`,
                        transition: 'height 0.6s ease', minHeight: 4
                    }} />
                    <span style={{ fontSize: 10, color: '#475569', textAlign: 'center', lineHeight: 1.2 }}>{d.label}</span>
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

function DonutChart({ value, label, color = '#FF6B35' }) {
    const r = 36, circ = 2 * Math.PI * r;
    const dash = (value / 100) * circ;
    return (
        <div style={{ position: 'relative', width: 90, height: 90 }}>
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
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setPos({
                top: r.top + window.scrollY - 8,   // above the button
                left: r.left + window.scrollX + r.width / 2  // horizontally centred
            });
        }
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
            {pos && (
                <div style={{
                    position: 'fixed',
                    top: pos.top,
                    left: pos.left,
                    transform: 'translate(-50%, -100%)',
                    background: '#1E2030', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10, padding: '10px 14px',
                    width: 240, fontSize: 13, color: '#CBD5E1', lineHeight: 1.55,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                    zIndex: 99999, pointerEvents: 'none',
                    whiteSpace: 'normal'
                }}>
                    {text}
                    {/* Arrow */}
                    <div style={{
                        position: 'absolute', top: '100%', left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #1E2030'
                    }} />
                </div>
            )}
        </>
    );
}

// ── Section Components ───────────────────────────────
function SectionCard({ icon, title, color, children, badge, info }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, marginBottom: 24, overflow: 'hidden'
        }}>
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

function Tag({ text, color = '#FF6B35' }) {
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
    const colors = ['#3B82F6', '#8B5CF6'];
    const c = colors[index % 2];
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${c}25`,
            borderRadius: 20, padding: '24px', flex: 1, minWidth: 280
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                    width: 52, height: 52, borderRadius: 14, background: `${c}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
                }}>{index === 0 ? '👩' : '👨'}</div>
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
function LoadingScreen({ steps, currentStep }) {
    return (
        <div style={{
            minHeight: '100vh', background: '#0A0A0F',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 24
        }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{
                    width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
                    background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34
                }}>⚡</div>
                <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 26, fontWeight: 800, color: '#F1F5F9', marginBottom: 8 }}>
                    Generating Your Intelligence Report
                </h2>
                <p style={{ fontSize: 15, color: '#64748B' }}>This takes about 60–90 seconds. Please stay on this page.</p>
            </div>

            <div style={{ width: '100%', maxWidth: 500, marginBottom: 40 }}>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 24 }}>
                    <div style={{
                        height: '100%', borderRadius: 6, width: `${((currentStep + 1) / steps.length) * 100}%`,
                        background: 'linear-gradient(90deg, #FF6B35, #FF8C5A)',
                        transition: 'width 0.6s ease'
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
    const [activeTab, setActiveTab] = useState('journey');
    const [error, setError] = useState('');

    // Load or generate report
    useEffect(() => {
        (async () => {
            try {
                // Get report doc
                const snap = await getDoc(doc(db, 'reports', reportId));
                if (!snap.exists()) { setError('Report not found.'); setStatus('error'); return; }

                const data = snap.data();
                setForm(data.form);

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
            const personasRaw = await callAI(`You are a customer persona specialist. Create 2 detailed personas for this business and return ONLY raw JSON (no markdown):
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
    }, []);

    if (status === 'loading') {
        return (
            <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid rgba(255,107,53,0.2)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin-anim 0.8s linear infinite' }} />
                <style>{`@keyframes spin-anim { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (status === 'generating') {
        return <LoadingScreen steps={GENERATION_STEPS} currentStep={genStep} />;
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
        { id: 'journey', label: '🗺️ Journey', color: '#3B82F6' },
        { id: 'psychology', label: '🧠 Psychology', color: '#8B5CF6' },
        { id: 'industry', label: '📊 Industry', color: '#10B981' },
        { id: 'personas', label: '👥 Personas', color: '#F59E0B' },
        { id: 'buying', label: '💡 Buying', color: '#EF4444' },
        { id: 'plan', label: '⚡ Action Plan', color: '#FF6B35' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
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
                            {form?.businessName || 'Business'} Report
                        </div>
                        <div style={{ fontSize: 11, color: '#475569' }}>{form?.industry}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 100 }}>✓ Complete</span>
                </div>
                <button onClick={() => navigate('/my-reports')} style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94A3B8', padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 13, fontFamily: 'Inter, sans-serif'
                }}>
                    My Reports
                </button>
            </div>

            {/* Score Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(139,92,246,0.1))',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '24px 20px'
            }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: '#F1F5F9', marginBottom: 4 }}>
                            Intelligence Report — {form?.businessName}
                        </h1>
                        <p style={{ fontSize: 14, color: '#64748B' }}>
                            {form?.industry} · {form?.businessType?.toUpperCase()} · Generated {new Date().toLocaleDateString()}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <DonutChart value={report?.journey?.overallScore || 72} label="Journey Score" color="#3B82F6" />
                        <DonutChart value={65} label="Market Strength" color="#10B981" />
                        <DonutChart value={report?.buying?.loyaltyScore || 68} label="Loyalty Score" color="#8B5CF6" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', overflowX: 'auto', gap: 4,
                padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: '#0F0F1A', scrollbarWidth: 'none'
            }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                        background: activeTab === t.id ? `${t.color}18` : 'transparent',
                        border: `1px solid ${activeTab === t.id ? `${t.color}40` : 'transparent'}`,
                        color: activeTab === t.id ? t.color : '#64748B',
                        padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                        whiteSpace: 'nowrap', transition: 'all 0.2s'
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px' }}>

                {/* ── JOURNEY TAB ── */}
                {activeTab === 'journey' && report?.journey && (
                    <div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
                            <div style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 20px' }}>
                                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>TOP RISK STAGE</div>
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
                    <div>
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
                    <div>
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
                    <div>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
                            {report?.personas?.map((p, i) => <PersonaCard key={i} persona={p} index={i} />)}
                        </div>
                    </div>
                )}

                {/* ── BUYING TAB ── */}
                {activeTab === 'buying' && report?.buying && (
                    <div>
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
                    <div>
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
            `}</style>
                    </div>
                )}
            </div>
        </div>
    );
}
