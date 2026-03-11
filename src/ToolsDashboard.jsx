import React from "react";
import { useNavigate } from "react-router-dom";

const PRIMARY_BLUE = "#007AFF";
const DARK_MODE_BACKGROUND = "#000000";
const CARD_BACKGROUND = "#1C1C1E";
const BORDER_COLOR = "#3A3A3C";
const MUTED_COLOR = "#8E8E93";
const TEXT_COLOR = "#FFFFFF";

const SHADOW = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
const HOVER_SHADOW = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";

export default function ToolsDashboard({ business, setupWizard, onRestart }) {
    const navigate = useNavigate();

    // If setup is not complete, show ONLY the Setup Wizard
    if (!business) {
        return (
            <div style={{ padding: "40px 20px 60px", maxWidth: 600, margin: "0 auto" }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, color: TEXT_COLOR, textAlign: "center" }}>Project Setup Wizard</h1>
                <p style={{ color: MUTED_COLOR, marginBottom: 32, fontSize: 16, textAlign: "center" }}>Tell us about your client or business to initialize the AI Toolset.</p>
                {setupWizard}
            </div>
        );
    }

    // Setup is complete, show the Tools Dashboard catalog
    return (
        <div style={{ padding: "40px 20px 60px", maxWidth: 900, margin: "0 auto" }}>
            <div style={{ padding: "16px 24px", background: CARD_BACKGROUND, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: TEXT_COLOR }}>Active Project: {business.businessName}</h2>
                    <p style={{ fontSize: 13, color: MUTED_COLOR }}>{business.industry}</p>
                </div>
                <button
                    onClick={onRestart}
                    style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER_COLOR}`, background: "transparent", color: MUTED_COLOR, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                >
                    Reset Project
                </button>
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT_COLOR, marginBottom: 8 }}>Tools Dashboard</h1>
            <p style={{ color: MUTED_COLOR, marginBottom: 40, fontSize: 15 }}>Select a PeoplePlex growth tool to start analyzing your business.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>

                {/* Journey Tool */}
                <div
                    onClick={() => navigate("/journey")}
                    style={{
                        background: CARD_BACKGROUND,
                        border: `1px solid ${BORDER_COLOR}`,
                        borderRadius: 20,
                        padding: 24,
                        cursor: "pointer",
                        transition: "all .3s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        boxShadow: SHADOW
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = PRIMARY_BLUE;
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = HOVER_SHADOW;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = BORDER_COLOR;
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = SHADOW;
                    }}
                >
                    <div style={{ background: `${PRIMARY_BLUE}20`, height: 60, width: 60, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📝</div>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT_COLOR, marginBottom: 6 }}>1. Customer Journey Audit</h2>
                        <p style={{ fontSize: 14, color: MUTED_COLOR, lineHeight: 1.5 }}>Map out the 5 stages of your customer's journey and identify exact leaks where you are losing revenue.</p>
                    </div>
                    <button style={{ marginTop: "auto", background: PRIMARY_BLUE, border: "none", color: TEXT_COLOR, fontWeight: 800, padding: "12px", borderRadius: 10, cursor: "pointer", fontSize: 15 }}>Open Tool →</button>
                </div>

                {/* Psychology Tool */}
                <div
                    onClick={() => navigate("/psychology")}
                    style={{
                        background: CARD_BACKGROUND,
                        border: `1px solid ${BORDER_COLOR}`,
                        borderRadius: 20,
                        padding: 24,
                        cursor: "pointer",
                        transition: "all .3s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        boxShadow: SHADOW
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = PRIMARY_BLUE;
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = HOVER_SHADOW;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = BORDER_COLOR;
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = SHADOW;
                    }}
                >
                    <div style={{ background: `${PRIMARY_BLUE}20`, height: 60, width: 60, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🧠</div>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT_COLOR, marginBottom: 6 }}>2. Customer Psychology</h2>
                        <p style={{ fontSize: 14, color: MUTED_COLOR, lineHeight: 1.5 }}>Deep dive into your customer's mindset, uncover their desires, and leverage psychological buying triggers.</p>
                    </div>
                    <button style={{ marginTop: "auto", background: PRIMARY_BLUE, border: "none", color: TEXT_COLOR, fontWeight: 800, padding: "12px", borderRadius: 10, cursor: "pointer", fontSize: 15 }}>Open Tool →</button>
                </div>

            </div>
        </div>
    );
}
