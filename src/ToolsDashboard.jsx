import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const PRIMARY = "#FF6B35";
const BG = "#F9FAFB";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const MUTED = "#6B7280";
const TEXT = "#111827";
const GREEN = "#059669";
const SHADOW = "0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px 0 rgba(0,0,0,.04)";
const SHADOW_HOVER = "0 8px 20px -4px rgba(0,0,0,.1)";

const TOOLS = [
    {
        id: "journey",
        index: 1,
        icon: "📝",
        title: "Customer Journey Intelligence",
        description: "Map the 5-stage customer journey, generate personas, and identify exactly where your business is losing revenue at each touchpoint.",
        route: "/journey",
        unlockAfter: null,
    },
    {
        id: "psychology",
        index: 2,
        icon: "🧠",
        title: "Customer Psychology Analysis",
        description: "Deep-dive into your customer's mindset. Uncover the desires, fears, and psychological triggers that drive buying decisions.",
        route: "/psychology",
        unlockAfter: "journey",
    },
    {
        id: "competitor",
        index: 3,
        icon: "🎯",
        title: "Competitor Analysis & Gaps",
        description: "Enter your 3 top competitors. The AI analyzes strengths, weaknesses, threat levels, and surfaces the market gaps your business can dominate.",
        route: "/competitor",
        unlockAfter: "psychology",
    },
];

function ToolCard({ tool, toolStatus, isUnlocked, onOpen }) {
    const [hovered, setHovered] = useState(false);
    const isDone = toolStatus === "complete";
    const isLocked = !isUnlocked;

    let statusLabel, statusColor, statusBg, actionLabel;

    if (isDone) {
        statusLabel = "✓ Complete";
        statusColor = GREEN;
        statusBg = "#ecfdf5";
        actionLabel = "View Details →";
    } else if (isLocked) {
        statusLabel = `🔒 Complete Tool ${tool.index - 1} First`;
        statusColor = MUTED;
        statusBg = "#f3f4f6";
        actionLabel = null;
    } else if (tool.comingSoon) {
        statusLabel = "🚧 Coming Soon";
        statusColor = "#d97706";
        statusBg = "#fef3c7";
        actionLabel = null;
    } else {
        statusLabel = "⏳ Ready to Start";
        statusColor = PRIMARY;
        statusBg = `${PRIMARY}15`;
        actionLabel = "Start Analysis →";
    }

    const canClick = isUnlocked && !isLocked && !tool.comingSoon;

    return (
        <div
            onClick={() => canClick && onOpen(tool.route)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: isLocked ? BG : CARD,
                border: `1px solid ${hovered && canClick ? PRIMARY : BORDER}`,
                borderRadius: 20,
                padding: "24px 28px",
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
                cursor: canClick ? "pointer" : "default",
                boxShadow: hovered && canClick ? SHADOW_HOVER : SHADOW,
                transition: "all .2s ease",
                opacity: isLocked ? 0.7 : 1,
                transform: hovered && canClick ? "translateY(-2px)" : "none",
            }}
        >
            {/* Number + Icon */}
            <div style={{ flexShrink: 0 }}>
                <div
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: isLocked ? "#f3f4f6" : isDone ? "#ecfdf5" : `${PRIMARY}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        marginBottom: 6,
                    }}
                >
                    {isLocked ? "🔒" : tool.icon}
                </div>
                <div style={{ textAlign: "center", fontSize: 12, color: MUTED, fontWeight: 400 }}>
                    Tool {tool.index}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 400, color: TEXT }}>{tool.title}</h3>
                    <span
                        style={{
                            fontSize: 13,
                            padding: "3px 10px",
                            borderRadius: 999,
                            background: statusBg,
                            color: statusColor,
                            fontWeight: 400,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {statusLabel}
                    </span>
                </div>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, marginBottom: actionLabel ? 16 : 0 }}>
                    {tool.description}
                </p>
                {actionLabel && (
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "10px 20px",
                            borderRadius: 10,
                            background: isDone ? GREEN : PRIMARY,
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: 400,
                            cursor: "pointer",
                            transition: "opacity .2s",
                            boxShadow: `0 4px 12px 0 ${isDone ? "rgba(5,150,105,.25)" : "rgba(255,107,53,.3)"}`,
                        }}
                    >
                        {actionLabel}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ToolsDashboard({ business, setupWizard, onRestart, project, onSwitchProject }) {
    const navigate = useNavigate();

    // ── ALL hooks at top (Rules of Hooks) ────────────────────────────────
    const [analysis, setAnalysis] = useState(business?.analysis || {});
    const [genAnalyzing, setGenAnalyzing] = useState(false);
    const [genPct, setGenPct] = useState(0);
    const [genChecks, setGenChecks] = useState([]);
    const [genError, setGenError] = useState(null);

    useEffect(() => {
        setAnalysis(business?.analysis || {});
    }, [business]);

    const GEN_CHECKS = ["Industry dynamics identified", "Business psychology classified", "Purchase behaviour analysed"];
    const hasAnalysis = analysis.industryDynamics || analysis.businessPsychology || analysis.purchaseBehaviour;

    async function generateIntelligence() {
        setGenAnalyzing(true);
        setGenPct(0);
        setGenChecks([]);

        const timer = setInterval(() => {
            setGenPct(prev => {
                if (prev >= 92) { clearInterval(timer); return 92; }
                return prev + Math.random() * 8;
            });
        }, 300);

        setTimeout(() => setGenChecks([0]), 800);
        setTimeout(() => setGenChecks([0, 1]), 1800);
        setTimeout(() => setGenChecks([0, 1, 2]), 2800);

        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    max_tokens: 400,
                    messages: [{
                        role: "user",
                        content: `Analyze this business. Return ONLY valid JSON, no markdown, no extra text:\n{"industryDynamics":"one concise sentence about how this industry works","businessPsychology":"one concise sentence about the buyer psychology","purchaseBehaviour":"one concise sentence about how customers make buying decisions"}\nBusiness: ${business?.businessName}, Industry: ${business?.industry}, Pricing: ${business?.pricingTier?.label || 'Standard'}, Location: ${business?.location}`
                    }]
                })
            });

            let responseText;
            try {
                responseText = await res.text();
            } catch (err) {
                throw new Error("Could not read response from server.");
            }

            let json;
            try {
                json = JSON.parse(responseText || "{}");
            } catch (err) {
                if (responseText.includes('504 Gateway Timeout') || !responseText) {
                    throw new Error("Local API server offline. Please run `node server.js` in a new terminal tab.");
                }
                throw new Error(`Server returned invalid response: ${responseText.slice(0, 30)}...`);
            }

            if (!res.ok || json.error) {
                const apiError = typeof json.error === "object" ? json.error.message || JSON.stringify(json.error) : (json.message || json.error || "Unknown API Error");
                throw new Error(`API Error: ${apiError}`);
            }

            // Fallback for Vercel/proxies returning an empty response but ok status
            if (!json.content || !json.content[0]) {
                throw new Error("No content received from AI provider.");
            }

            const raw = json.content[0].text || "";
            const firstBrace = raw.indexOf("{");
            const lastBrace = raw.lastIndexOf("}");

            if (firstBrace === -1 || lastBrace === -1) {
                console.error("AI Response was:", raw);
                throw new Error("No JSON object found in AI response. (Check console for raw response)");
            }

            const jsonStr = raw.substring(firstBrace, lastBrace + 1);
            const parsed = JSON.parse(jsonStr);
            clearInterval(timer);
            setGenPct(100);
            setAnalysis(parsed);
            if (project?.id && auth.currentUser) {
                setDoc(
                    doc(db, "users", auth.currentUser.uid, "projects", project.id),
                    { analysis: parsed },
                    { merge: true }
                ).catch(e => console.error("Failed to save analysis", e));
            }
        } catch (e) {
            clearInterval(timer);
            console.error("Intelligence generation failed", e);
            setGenError(e.message || "Failed to generate or parse intelligence.");
        }
        setTimeout(() => setGenAnalyzing(false), 700);
    }

    // ── Show setup wizard if no business yet ───────────────────────────
    if (!business) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px 20px",
                    width: "100%",
                }}
            >
                <div style={{ width: "100%", maxWidth: 600 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 400, marginBottom: 8, color: TEXT, textAlign: "center" }}>
                        Project Setup Wizard
                    </h1>
                    <p style={{ color: MUTED, marginBottom: 32, fontSize: 15, textAlign: "center" }}>
                        Tell us about your client or business to initialize the AI Toolset.
                    </p>
                    {setupWizard}
                </div>
            </div>
        );
    }

    // Determine which tools are unlocked
    const toolStatus = project?.tools || {};
    function isUnlocked(tool) {
        if (!tool.unlockAfter) return true; // Tool 1 always unlocked
        return toolStatus[tool.unlockAfter] === "complete";
    }

    const completedCount = TOOLS.filter(t => toolStatus[t.id] === "complete").length;
    const progressPct = Math.round((completedCount / TOOLS.length) * 100);



    return (
        <div style={{ padding: "40px 32px 80px", maxWidth: 860, margin: "0 auto", width: "100%" }}>

            {/* Project Header */}
            <div
                style={{
                    background: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 20,
                    padding: "20px 24px",
                    marginBottom: 40,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: SHADOW,
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: `${PRIMARY}18`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                        }}
                    >
                        🏢
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 400, color: TEXT }}>{business.businessName}</div>
                        <div style={{ fontSize: 14, color: MUTED }}>{business.industry} · {business.location}</div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                        style={{
                            padding: "4px 12px",
                            borderRadius: 999,
                            background: "#ecfdf5",
                            color: GREEN,
                            fontSize: 13,
                            fontWeight: 400,
                        }}
                    >
                        ✓ Setup Complete
                    </span>
                    <button
                        onClick={onSwitchProject}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: `1px solid ${BORDER}`,
                            background: "transparent",
                            color: MUTED,
                            fontSize: 13,
                            cursor: "pointer",
                            fontWeight: 400,
                            transition: "border-color .2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = TEXT}
                        onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                    >
                        Switch Project
                    </button>
                    <button
                        onClick={onRestart}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: `1px solid ${BORDER}`,
                            background: "transparent",
                            color: MUTED,
                            fontSize: 13,
                            cursor: "pointer",
                            fontWeight: 400,
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#ef4444"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Business Intelligence Panel */}
            {genAnalyzing ? (
                <div style={{ background: "#0f172a", borderRadius: 20, padding: "28px 32px", marginBottom: 32 }}>
                    <p style={{ color: "#94a3b8", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>Analyzing Your Business...</p>
                    <div style={{ background: "#1e293b", borderRadius: 4, height: 8, marginBottom: 8, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 4, width: `${genPct}%`, background: "linear-gradient(90deg,#FF6B35,#FF8C5A)", transition: "width .4s ease" }} />
                    </div>
                    <p style={{ color: "#475569", fontSize: 13, marginBottom: 24 }}>{Math.round(genPct)}%</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {GEN_CHECKS.map((label, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, opacity: genChecks.includes(idx) ? 1 : 0.2, transform: genChecks.includes(idx) ? "translateX(0)" : "translateX(-8px)", transition: "all .4s ease" }}>
                                <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>
                                <span style={{ color: "#cbd5e1", fontSize: 14 }}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : hasAnalysis ? (
                <div
                    style={{
                        background: "#0f172a",
                        borderRadius: 20,
                        padding: "24px 28px",
                        marginBottom: 32,
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 24,
                    }}
                >
                    <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <p style={{ color: "#94a3b8", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", margin: 0 }}>AI Business Intelligence</p>
                        <button onClick={generateIntelligence} style={{ background: "transparent", border: "1px solid #334155", borderRadius: 8, color: "#64748b", fontSize: 12, padding: "4px 10px", cursor: "pointer" }}>Regenerate</button>
                    </div>
                    {[
                        { icon: "📊", label: "Industry Dynamics", value: analysis.industryDynamics },
                        { icon: "🧠", label: "Business Psychology", value: analysis.businessPsychology },
                        { icon: "🛒", label: "Purchase Behaviour", value: analysis.purchaseBehaviour },
                    ].filter(item => item.value).map((item, idx) => (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 16 }}>{item.icon}</span>
                                <span style={{ fontSize: 12, color: "#64748b", letterSpacing: ".06em", textTransform: "uppercase" }}>{item.label}</span>
                            </div>
                            <p style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.6, margin: 0 }}>{item.value}</p>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                                <span style={{ fontSize: 12, color: "#22c55e" }}>Identified</span>
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        background: "#0f172a",
                        borderRadius: 20,
                        padding: "24px 28px",
                        marginBottom: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 20,
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <p style={{ color: "#94a3b8", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>AI Business Intelligence</p>
                        <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>Industry dynamics, business psychology and purchase behaviour haven't been generated yet.</p>
                        {genError && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{genError}</p>}
                    </div>
                    <button
                        onClick={generateIntelligence}
                        style={{ padding: "12px 22px", borderRadius: 12, border: "none", background: PRIMARY, color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 400, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(255,107,53,.3)" }}
                    >
                        Generate Intelligence →
                    </button>
                </div>
            )}

            {/* Progress Section */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
                    <h2 style={{ fontSize: 18, fontWeight: 400, color: TEXT }}>Project Workspace</h2>
                    <span style={{ fontSize: 14, color: MUTED }}>{completedCount}/{TOOLS.length} tools complete · {progressPct}%</span>
                </div>
                <div style={{ height: 6, background: BORDER, borderRadius: 999, overflow: "hidden" }}>
                    <div
                        style={{
                            height: "100%",
                            width: `${progressPct}%`,
                            background: PRIMARY,
                            borderRadius: 999,
                            transition: "width .6s ease",
                        }}
                    />
                </div>
            </div>

            {/* Tools List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {TOOLS.map(tool => (
                    <ToolCard
                        key={tool.id}
                        tool={tool}
                        toolStatus={toolStatus[tool.id]}
                        isUnlocked={isUnlocked(tool)}
                        onOpen={route => navigate(route)}
                    />
                ))}
            </div>
        </div>
    );
}
