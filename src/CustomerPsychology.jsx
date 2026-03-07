import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DARK = "#F9FAFB";
const CARD = "#FFFFFF";
const WHITE = "#000000";
const MUTED = "#4B5563";
const ORANGE = "#FF6B35";
const BORDER = "#E5E7EB";

export default function CustomerPsychology({ business, personas }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    // If there is no business data, force them back
    if (!business) {
        return (
            <div style={{ padding: "40px 20px 60px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: WHITE, marginBottom: 16 }}>Project Setup Required</h1>
                <p style={{ color: MUTED, marginBottom: 32 }}>You must complete the Setup Wizard and define your Customer Personas before running the Psychology Audit.</p>
                <button
                    onClick={() => navigate("/journey")}
                    style={{
                        padding: "12px 24px",
                        borderRadius: 12,
                        border: "none",
                        background: ORANGE,
                        color: "#FFFFFF",
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: "pointer",
                    }}
                >
                    Start Setup Wizard →
                </button>
            </div>
        );
    }

    const personaStr = personas?.[0] ? `Name: ${personas[0].name}, Archetype: ${personas[0].archetype}, Pain: ${personas[0].painPoints[0]}` : "General Audience";

    async function generateReport() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-5-20250929",
                    max_tokens: 1500,
                    messages: [
                        {
                            role: "user",
                            content: `You are an elite consumer psychology expert.
                            
Business Name: ${business.businessName}
Industry: ${business.industry}
Target Persona: ${personaStr}
Price Tier: ${business.pricingTier?.label || "Unknown"}
Notes: ${business.additionalNotes || "N/A"}

Please generate a deep-dive Customer Psychology Audit strictly returning a raw JSON object with NO markdown or backticks formatting around it, matching this EXACT structure:
{
  "coreDesires": ["Desire 1", "Desire 2", "Desire 3"],
  "biggestFears": ["Fear 1", "Fear 2", "Fear 3"],
  "buyingTriggers": ["Trigger 1", "Trigger 2"],
  "conversionAdvice": "A powerful paragraph on how this business can immediately tweak their messaging to convert this specific persona based on the psychology triggers above."
}`
                        }
                    ]
                })
            });

            const data = await res.json();
            const txt = data.content?.[0]?.text || "";
            let parsed = null;
            try {
                parsed = JSON.parse(txt);
            } catch (err) {
                const match = txt.match(/\{[\s\S]*\}/);
                if (match) parsed = JSON.parse(match[0]);
            }

            if (parsed && parsed.coreDesires) {
                setReport(parsed);
            } else {
                throw new Error("Failed to parse psychology data.");
            }
        } catch (err) {
            console.error(err);
            setError("Could not generate report. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: "40px 20px 60px", maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
                <button
                    onClick={() => navigate("/")}
                    style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: `1px solid ${BORDER}`,
                        background: "transparent",
                        color: MUTED,
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontWeight: 600
                    }}
                >
                    ← Back to Dashboard
                </button>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 900, color: WHITE, marginBottom: 8 }}>Customer Psychology Audit</h1>
            <p style={{ color: MUTED, marginBottom: 40, fontSize: 16 }}>Understand what truly drives your customers to buy, hesitate, or leave.</p>

            {!report && !loading && (
                <div style={{ padding: 32, background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: WHITE, marginBottom: 12 }}>Ready to analyze {personas?.[0]?.name || "your customers"}?</h2>
                    <p style={{ color: MUTED, fontSize: 14, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>We'll use the Business profile and Personas generated in your Journey Audit to extract their deepest psychological triggers.</p>
                    <button
                        onClick={generateReport}
                        style={{
                            padding: "12px 24px",
                            borderRadius: 12,
                            border: "none",
                            background: ORANGE,
                            color: "#FFFFFF",
                            fontSize: 15,
                            fontWeight: 800,
                            cursor: "pointer",
                        }}
                    >
                        Generate Psychology Report →
                    </button>
                    {error && <div style={{ color: "#ef4444", marginTop: 16, fontSize: 14 }}>{error}</div>}
                </div>
            )}

            {loading && (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: 48, animation: "spin 2s linear infinite", marginBottom: 16 }}>⏳</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: WHITE }}>Extracting Psychological Triggers...</div>
                    <div style={{ fontSize: 14, color: MUTED, marginTop: 8 }}>Analyzing {business?.businessName}'s target audience...</div>
                </div>
            )}

            {report && !loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div style={{ padding: 24, background: CARD, borderRadius: 20, border: `1px solid ${BORDER}` }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: ORANGE, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>✨ Core Desires</h2>
                        <ul style={{ paddingLeft: 20, margin: 0, color: WHITE, display: "flex", flexDirection: "column", gap: 12 }}>
                            {report.coreDesires.map((d, i) => <li key={i} style={{ lineHeight: 1.5 }}>{d}</li>)}
                        </ul>
                    </div>

                    <div style={{ padding: 24, background: CARD, borderRadius: 20, border: `1px solid ${BORDER}` }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#ef4444", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>🚨 Biggest Fears / Hesitations</h2>
                        <ul style={{ paddingLeft: 20, margin: 0, color: WHITE, display: "flex", flexDirection: "column", gap: 12 }}>
                            {report.biggestFears.map((d, i) => <li key={i} style={{ lineHeight: 1.5 }}>{d}</li>)}
                        </ul>
                    </div>

                    <div style={{ padding: 24, background: CARD, borderRadius: 20, border: `1px solid ${BORDER}` }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#22c55e", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>🎯 Buying Triggers</h2>
                        <ul style={{ paddingLeft: 20, margin: 0, color: WHITE, display: "flex", flexDirection: "column", gap: 12 }}>
                            {report.buyingTriggers.map((d, i) => <li key={i} style={{ lineHeight: 1.5 }}>{d}</li>)}
                        </ul>
                    </div>

                    <div style={{ padding: 24, background: `linear-gradient(145deg, ${CARD}, #FFF5F0)`, borderRadius: 20, border: `1px solid ${ORANGE}50` }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: WHITE, marginBottom: 12 }}>Immediate Conversion Strategy</h2>
                        <p style={{ color: MUTED, lineHeight: 1.6, fontSize: 15 }}>{report.conversionAdvice}</p>
                    </div>

                    <button
                        onClick={() => navigate("/")}
                        style={{
                            marginTop: 16,
                            padding: "16px",
                            borderRadius: 12,
                            border: `1.5px solid ${BORDER}`,
                            background: "transparent",
                            color: WHITE,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: "pointer",
                            width: "100%",
                        }}
                    >
                        Return to All Tools
                    </button>

                    <style>{`
                        @keyframes spin { 100% { transform: rotate(360deg); } }
                    `}</style>
                </div>
            )}
        </div>
    );
}
