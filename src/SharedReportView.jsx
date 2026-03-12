import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { updateProfile, updatePassword, updateEmail } from "firebase/auth";
import { auth, db } from "./firebase";

const DARK_MODE_BACKGROUND = "#F9FAFB";
const CARD_BACKGROUND = "#FFFFFF";
const BORDER_COLOR = "#E5E7EB";
const MUTED_COLOR = "#6B7280";
const TEXT_COLOR = "#111827";
const PRIMARY_BLUE = "#FF6B35";

function scoreColor(pct) {
  if (pct >= 70) return "#22c55e";
  if (pct >= 40) return "#eab308";
  return "#ef4444";
}

function scoreLabel(pct) {
  if (pct >= 70) return "Strong";
  if (pct >= 40) return "Developing";
  return "Critical";
}

function Spinner({ message }) {
  return (
    <div style={{ textAlign: "center", padding: 40, color: MUTED_COLOR }}>
      <div
        className="spin"
        style={{
          width: 30,
          height: 30,
          border: `3px solid ${BORDER_COLOR}`,
          borderTopColor: PRIMARY_BLUE,
          borderRadius: "50%",
          margin: "0 auto 16px",
        }}
      />
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
      <div>{message || "Loading..."}</div>
    </div>
  );
}

export default function SharedReportView({ reportId }) {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    import("firebase/firestore").then(({ doc, getDoc }) => {
      getDoc(doc(db, "public_reports", reportId))
        .then((snap) => {
          if (snap.exists()) setHtml(snap.data().html);
          else setError(true);
        })
        .catch(() => setError(true));
    });
  }, [reportId]);

  if (error)
    return (
      <div
        style={{
          color: "#fff",
          padding: 40,
          textAlign: "center",
          background: DARK_MODE_BACKGROUND,
          minHeight: "100vh",
        }}
      >
        <h2>Report Not Found</h2>
        <p style={{ color: MUTED_COLOR }}>
          This report may have been deleted or never existed.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            marginTop: 20,
            padding: "10px 16px",
            background: PRIMARY_BLUE,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 400,
          }}
        >
          Start New Audit
        </button>
      </div>
    );
  if (!html)
    return (
      <div
        style={{
          background: DARK_MODE_BACKGROUND,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner message="Loading Shared Report..." />
      </div>
    );

  return (
    <iframe
      srcDoc={html}
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        background: "#fff",
      }}
      title="Shared Report"
    />
  );
}