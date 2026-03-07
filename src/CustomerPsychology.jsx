import React from "react";
import { useNavigate } from "react-router-dom";

const DARK = "#131313";
const CARD = "#1C1C1C";
const WHITE = "#FFFFFF";
const MUTED = "#A1A1AA";
const ORANGE = "#FF6B35";
const BORDER = "#2A2A2A";

export default function CustomerPsychology() {
    const navigate = useNavigate();

    return (
        <div style={{ padding: "40px 20px 60px", maxWidth: 700, margin: "0 auto" }}>
            {/* Breadcrumb / Back Navigation */}
            <div
                style={{ display: "flex", alignItems: "center", marginBottom: 32 }}
            >
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
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = WHITE;
                        e.currentTarget.style.borderColor = WHITE;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = MUTED;
                        e.currentTarget.style.borderColor = BORDER;
                    }}
                >
                    ← Back to Dashboard
                </button>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 900, color: WHITE, marginBottom: 8 }}>Customer Psychology Audit</h1>
            <p style={{ color: MUTED, marginBottom: 40, fontSize: 16 }}>Understand what truly drives your customers to buy, hesitate, or leave.</p>

            <div style={{ textAlign: "center", padding: "80px 40px", background: CARD, borderRadius: 24, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 48, marginBottom: 24 }}>🧠 🛠️</div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: WHITE, marginBottom: 16 }}>Tool in Active Development</h2>
                <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>
                    The Customer Psychology multi-step engine is currently being structured. Soon, this will leverage the Personas generated in your Journey Audit to extract deep behavioral data.
                </p>
                <button
                    onClick={() => navigate("/")}
                    style={{
                        marginTop: 32,
                        padding: "12px 24px",
                        borderRadius: 12,
                        border: "none",
                        background: ORANGE,
                        color: "#000",
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: "pointer",
                    }}
                >
                    Return Home
                </button>
            </div>
        </div>
    );
}
