import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "80vh",
                textAlign: "center",
                padding: "20px",
            }}
        >
            <div style={{ fontSize: 64, marginBottom: 16 }}>🧭</div>
            <h1
                style={{
                    fontSize: 32,
                    fontWeight: 400,
                    color: "#111827",
                    marginBottom: 16,
                }}
            >
                404 - Page Not Found
            </h1>
            <p
                style={{
                    fontSize: 15,
                    color: "#6B7280",
                    marginBottom: 32,
                    maxWidth: 400,
                    lineHeight: 1.5,
                }}
            >
                We couldn't locate the growth tool or page you were looking for. It might have been moved or removed.
            </p>
            <button
                onClick={() => navigate("/")}
                style={{
                    padding: "12px 24px",
                    borderRadius: 12,
                    border: "none",
                    background: "#FF6B35",
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: 400,
                    cursor: "pointer",
                    transition: "all .2s",
                }}
            >
                Return to Dashboard
            </button>
        </div>
    );
}
