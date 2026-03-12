import React, { useState } from "react";

const PRIMARY = "#FF6B35";
const BG = "#F9FAFB";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const MUTED = "#6B7280";
const TEXT = "#111827";
const SHADOW = "0 1px 3px 0 rgba(0,0,0,.08)";
const SHADOW_HOVER = "0 8px 20px -4px rgba(0,0,0,.1)";

function Input({ label, placeholder, value, onChange, textarea }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, color: MUTED, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 400 }}>{label}</label>
            {textarea ? (
                <textarea
                    rows={3}
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", color: TEXT, fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit" }}
                />
            ) : (
                <input
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", color: TEXT, fontSize: 14, outline: "none", fontFamily: "inherit", width: "100%" }}
                />
            )}
        </div>
    );
}

const EMPTY_COMPETITOR = () => ({ name: "", website: "", pricing: "", strengths: "", weaknesses: "" });

export default function CompetitorAnalysis({ business, onComplete }) {
    const [competitors, setCompetitors] = useState([EMPTY_COMPETITOR(), EMPTY_COMPETITOR(), EMPTY_COMPETITOR()]);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisPct, setAnalysisPct] = useState(0);
    const [analysisChecks, setAnalysisChecks] = useState([]);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    const CHECKS = [
        "Competitor data indexed",
        "Strength-weakness matrix built",
        "Market positioning mapped",
        "Gap opportunities identified",
    ];

    function updateCompetitor(idx, field, value) {
        setCompetitors(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    }

    const isReady = competitors.every(c => c.name.trim());

    async function runAnalysis() {
        setAnalyzing(true);
        setAnalysisPct(0);
        setAnalysisChecks([]);
        setError(null);

        const timer = setInterval(() => {
            setAnalysisPct(prev => {
                if (prev >= 92) { clearInterval(timer); return 92; }
                return prev + Math.random() * 6;
            });
        }, 350);

        setTimeout(() => setAnalysisChecks([0]), 700);
        setTimeout(() => setAnalysisChecks([0, 1]), 1500);
        setTimeout(() => setAnalysisChecks([0, 1, 2]), 2400);
        setTimeout(() => setAnalysisChecks([0, 1, 2, 3]), 3200);

        try {
            const prompt = `You are a competitive intelligence analyst. Analyze these 3 competitors for ${business?.businessName || "us"} (${business?.industry || "our industry"}) and return ONLY valid JSON, no markdown.

Competitors:
${competitors.map((c, i) => `${i + 1}. Name: ${c.name}, Website: ${c.website || "N/A"}, Pricing: ${c.pricing || "unknown"}, Strengths: ${c.strengths || "not specified"}, Weaknesses: ${c.weaknesses || "not specified"}`).join("\n")}

Return this exact JSON structure:
{
  "summary": "2-3 sentence competitive landscape overview",
  "competitors": [
    {
      "name": "competitor name",
      "tier": "Budget|Mid|Premium|Luxury",
      "marketPosition": "1-line market positioning statement",
      "topStrengths": ["strength 1", "strength 2", "strength 3"],
      "topWeaknesses": ["weakness 1", "weakness 2", "weakness 3"],
      "threatLevel": "Low|Medium|High",
      "threatReason": "1-line why"
    }
  ],
  "gaps": [
    { "title": "gap opportunity title", "description": "how your business can exploit this gap" }
  ],
  "recommendation": "2-3 sentence strategic recommendation for ${business?.businessName || "your business"}"
}`;

            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    max_tokens: 1200,
                    messages: [{ role: "user", content: prompt }],
                }),
            });

            const data = await res.json();
            const text = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(text);
            clearInterval(timer);
            setAnalysisPct(100);
            setTimeout(() => {
                setReport(parsed);
                setAnalyzing(false);
                if (onComplete) onComplete();
            }, 600);
        } catch (e) {
            clearInterval(timer);
            setAnalyzing(false);
            setError("Analysis failed. Please try again.");
        }
    }

    const THREAT_COLOR = { Low: "#059669", Medium: "#d97706", High: "#dc2626" };
    const THREAT_BG = { Low: "#ecfdf5", Medium: "#fffbeb", High: "#fef2f2" };

    // ── Analysis loading screen ─────────────────────────────────
    if (analyzing) {
        return (
            <div style={{ padding: "48px 32px 80px", maxWidth: 700, margin: "0 auto" }}>
                <div style={{ background: "#0f172a", borderRadius: 20, padding: "48px 40px" }}>
                    <p style={{ color: "#94a3b8", fontSize: 14, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>
                        Analyzing Competitors...
                    </p>
                    <div style={{ background: "#1e293b", borderRadius: 4, height: 10, marginBottom: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 4, width: `${analysisPct}%`, background: "linear-gradient(90deg, #FF6B35, #FF8C5A)", transition: "width .4s ease" }} />
                    </div>
                    <p style={{ color: "#475569", fontSize: 13, marginBottom: 32 }}>{Math.round(analysisPct)}%</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {CHECKS.map((label, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, opacity: analysisChecks.includes(idx) ? 1 : 0.2, transform: analysisChecks.includes(idx) ? "translateX(0)" : "translateX(-8px)", transition: "all .4s ease" }}>
                                <span style={{ color: "#22c55e", fontSize: 15 }}>✓</span>
                                <span style={{ color: "#cbd5e1", fontSize: 14 }}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── Report view ─────────────────────────────────────────────
    if (report) {
        return (
            <div style={{ padding: "40px 32px 80px", maxWidth: 960, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ marginBottom: 36 }}>
                    <p style={{ fontSize: 14, color: PRIMARY, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Competitor Analysis Report</p>
                    <h1 style={{ fontSize: 22, fontWeight: 400, color: TEXT, marginBottom: 12 }}>
                        Competitive Landscape — {business?.businessName || "Your Business"}
                    </h1>
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 24px", boxShadow: SHADOW }}>
                        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7 }}>{report.summary}</p>
                    </div>
                </div>

                {/* Competitor Cards */}
                <h2 style={{ fontSize: 18, fontWeight: 400, color: TEXT, marginBottom: 16 }}>Three Competitors Analyzed</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 40 }}>
                    {(report.competitors || []).map((comp, idx) => (
                        <div key={idx} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "24px", boxShadow: SHADOW }}>
                            {/* Name + threat badge */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 400, color: TEXT, marginBottom: 2 }}>{comp.name}</div>
                                    <div style={{ fontSize: 13, color: MUTED }}>{comp.tier} Market</div>
                                </div>
                                <span style={{ padding: "4px 10px", borderRadius: 999, background: THREAT_BG[comp.threatLevel] || "#f3f4f6", color: THREAT_COLOR[comp.threatLevel] || MUTED, fontSize: 12, fontWeight: 400, whiteSpace: "nowrap" }}>
                                    {comp.threatLevel} Threat
                                </span>
                            </div>

                            <p style={{ fontSize: 14, color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>{comp.marketPosition}</p>

                            {/* Strengths */}
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 13, color: "#059669", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 8, fontWeight: 400 }}>Strengths</div>
                                {(comp.topStrengths || []).map((s, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                                        <span style={{ color: "#059669", fontSize: 13, marginTop: 1 }}>+</span>
                                        <span style={{ fontSize: 14, color: TEXT }}>{s}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Weaknesses */}
                            <div>
                                <div style={{ fontSize: 13, color: "#dc2626", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 8, fontWeight: 400 }}>Weaknesses</div>
                                {(comp.topWeaknesses || []).map((w, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                                        <span style={{ color: "#dc2626", fontSize: 13, marginTop: 1 }}>−</span>
                                        <span style={{ fontSize: 14, color: TEXT }}>{w}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: 16, padding: "10px 14px", background: `${THREAT_BG[comp.threatLevel] || "#f3f4f6"}`, borderRadius: 10 }}>
                                <span style={{ fontSize: 13, color: THREAT_COLOR[comp.threatLevel] || MUTED }}>{comp.threatReason}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Gaps */}
                <h2 style={{ fontSize: 18, fontWeight: 400, color: TEXT, marginBottom: 16 }}>Market Gaps You Can Exploit</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
                    {(report.gaps || []).map((gap, idx) => (
                        <div key={idx} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start", boxShadow: SHADOW }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${PRIMARY}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🎯</div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 400, color: TEXT, marginBottom: 4 }}>{gap.title}</div>
                                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{gap.description}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recommendation */}
                <div style={{ background: "#0f172a", borderRadius: 20, padding: "28px 32px" }}>
                    <p style={{ color: "#94a3b8", fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 12 }}>Strategic Recommendation</p>
                    <p style={{ color: "#f1f5f9", fontSize: 15, lineHeight: 1.7 }}>{report.recommendation}</p>
                </div>

                {/* Re-analyze */}
                <div style={{ marginTop: 32, textAlign: "center" }}>
                    <button
                        onClick={() => { setReport(null); setCompetitors([EMPTY_COMPETITOR(), EMPTY_COMPETITOR(), EMPTY_COMPETITOR()]); }}
                        style={{ padding: "12px 24px", borderRadius: 12, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 14, cursor: "pointer" }}
                    >
                        Analyze Different Competitors
                    </button>
                </div>
            </div>
        );
    }

    // ── Input form ──────────────────────────────────────────────
    return (
        <div style={{ padding: "40px 32px 80px", maxWidth: 960, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 14, color: PRIMARY, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Tool 3</p>
                <h1 style={{ fontSize: 22, fontWeight: 400, color: TEXT, marginBottom: 10 }}>Competitor Analysis</h1>
                <p style={{ fontSize: 15, color: MUTED }}>
                    Enter your 3 top competitors below. The AI will analyze their strengths, weaknesses, and uncover gaps your business can dominate.
                </p>
            </div>

            {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "#dc2626", fontSize: 14 }}>
                    {error}
                </div>
            )}

            {/* Competitor forms */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 24, marginBottom: 40 }}>
                {competitors.map((comp, idx) => (
                    <div key={idx} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "28px 24px", boxShadow: SHADOW }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${PRIMARY}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 400, color: PRIMARY }}>
                                {idx + 1}
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 400, color: TEXT }}>Competitor {idx + 1}</div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <Input
                                label="Business Name *"
                                placeholder="e.g., Acme Corp"
                                value={comp.name}
                                onChange={v => updateCompetitor(idx, "name", v)}
                            />
                            <Input
                                label="Website (Optional)"
                                placeholder="https://acme.com"
                                value={comp.website}
                                onChange={v => updateCompetitor(idx, "website", v)}
                            />
                            <Input
                                label="Pricing Range"
                                placeholder="e.g., ₹5,000–₹20,000 / mo"
                                value={comp.pricing}
                                onChange={v => updateCompetitor(idx, "pricing", v)}
                            />
                            <Input
                                label="What They Do Well"
                                placeholder="e.g., Strong brand, fast delivery, great reviews..."
                                value={comp.strengths}
                                onChange={v => updateCompetitor(idx, "strengths", v)}
                                textarea
                            />
                            <Input
                                label="What They Do Poorly"
                                placeholder="e.g., Slow support, no personalisation, outdated website..."
                                value={comp.weaknesses}
                                onChange={v => updateCompetitor(idx, "weaknesses", v)}
                                textarea
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Analyze button */}
            <div style={{ textAlign: "center" }}>
                <button
                    onClick={runAnalysis}
                    disabled={!isReady}
                    style={{
                        padding: "16px 48px",
                        borderRadius: 14,
                        border: "none",
                        background: isReady ? PRIMARY : BORDER,
                        color: isReady ? "#fff" : MUTED,
                        fontSize: 15,
                        fontWeight: 400,
                        cursor: isReady ? "pointer" : "not-allowed",
                        boxShadow: isReady ? "0 4px 15px 0 rgba(255,107,53,.3)" : "none",
                        transition: "all .2s",
                    }}
                >
                    Analyse All 3 Competitors →
                </button>
                <p style={{ fontSize: 13, color: MUTED, marginTop: 12 }}>Enter at least the name of each competitor to proceed</p>
            </div>
        </div>
    );
}
