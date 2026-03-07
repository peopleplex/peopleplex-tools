import React from "react";
import { useNavigate } from "react-router-dom";

const DARK = "#131313";
const CARD = "#1C1C1C";
const WHITE = "#FFFFFF";
const MUTED = "#A1A1AA";
const ORANGE = "#FF6B35";
const BORDER = "#2A2A2A";

export default function ToolsDashboard() {
    const navigate = useNavigate();

    return (
        <div style={{ padding: "40px 20px 60px", maxWidth: 900, margin: "0 auto" }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: WHITE, marginBottom: 8 }}>Tools Dashboard</h1>
            <p style={{ color: MUTED, marginBottom: 40, fontSize: 15 }}>Select a PeoplePlex growth tool to start analyzing your business.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>

                {/* Journey Tool */}
                <div
                    onClick={() => navigate("/journey")}
                    style={{
                        background: CARD,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 20,
                        padding: 24,
                        cursor: "pointer",
                        transition: "all .2s",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = ORANGE;
                        e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = BORDER;
                        e.currentTarget.style.transform = "none";
                    }}
                >
                    <div style={{ background: `${ORANGE}20`, height: 60, width: 60, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📝</div>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: WHITE, marginBottom: 6 }}>1. Customer Journey Audit</h2>
                        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>Map out the 5 stages of your customer's journey and identify exact leaks where you are losing revenue.</p>
                    </div>
                    <button style={{ marginTop: "auto", background: ORANGE, border: "none", color: "#000", fontWeight: 800, padding: "12px", borderRadius: 10, cursor: "pointer", fontSize: 15 }}>Open Tool →</button>
                </div>

                {/* Psychology Tool */}
                <div
                    onClick={() => navigate("/psychology")}
                    style={{
                        background: CARD,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 20,
                        padding: 24,
                        cursor: "pointer",
                        transition: "all .2s",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = ORANGE;
                        e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = BORDER;
                        e.currentTarget.style.transform = "none";
                    }}
                >
                    <div style={{ background: `${ORANGE}20`, height: 60, width: 60, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🧠</div>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: WHITE, marginBottom: 6 }}>2. Customer Psychology</h2>
                        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>Deep dive into your customer's mindset, uncover their desires, and leverage psychological buying triggers.</p>
                    </div>
                    <button style={{ marginTop: "auto", background: ORANGE, border: "none", color: "#000", fontWeight: 800, padding: "12px", borderRadius: 10, cursor: "pointer", fontSize: 15 }}>Open Tool →</button>
                </div>

            </div>
        </div>
    );
}
