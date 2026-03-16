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

function UserProfileSettings({ user, onClose }) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    import("firebase/firestore").then(({ doc, getDoc }) => {
      getDoc(doc(db, "users", user.uid))
        .then((snap) => {
          if (snap.exists() && snap.data().whatsapp) {
            setWhatsapp(snap.data().whatsapp);
          }
        })
        .catch((e) => console.error(e));
    });
  }, [user]);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      if (displayName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }
      if (email !== user.email) {
        await updateEmail(auth.currentUser, email);
      }
      if (password) {
        await updatePassword(auth.currentUser, password);
      }

      const { doc: fsDoc, setDoc: fsSetDoc } =
        await import("firebase/firestore");
      await fsSetDoc(
        fsDoc(db, "users", auth.currentUser.uid),
        { whatsapp },
        { merge: true },
      );

      setMsg({ text: "Profile updated successfully!", type: "success" });
      setPassword("");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setMsg({
          text: "Please sign out and sign back in to change sensitive information like email or password.",
          type: "error",
        });
      } else {
        setMsg({ text: err.message, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: DARK_MODE_BACKGROUND,
        color: TEXT_COLOR,
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${BORDER_COLOR}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: PRIMARY_BLUE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 400,
              color: "#000",
            }}
          >
            H
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 400 }}>
              Profile Settings
            </div>
            <div style={{ fontSize: 14, color: MUTED_COLOR }}>
              Manage your PeoplePlex account
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${BORDER_COLOR}`,
              background: "transparent",
              color: MUTED_COLOR,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ← Back to Tool
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "40px auto", padding: "0 20px" }}>
        <div
          style={{
            background: CARD_BACKGROUND,
            border: `1px solid ${BORDER_COLOR}`,
            padding: "32px",
            borderRadius: 16,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 24 }}>
            Account Settings
          </h2>

          {msg.text && (
            <div
              style={{
                background: msg.type === "error" ? "#ef444420" : "#22c55e20",
                color: msg.type === "error" ? "#ef4444" : "#22c55e",
                padding: "12px",
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 24,
                lineHeight: 1.4,
              }}
            >
              {msg.text}
            </div>
          )}

          <form
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 400,
                  color: MUTED_COLOR,
                  marginBottom: 6,
                }}
              >
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${BORDER_COLOR}`,
                  background: DARK_MODE_BACKGROUND,
                  color: TEXT_COLOR,
                  fontSize: 15,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 400,
                  color: MUTED_COLOR,
                  marginBottom: 6,
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${BORDER_COLOR}`,
                  background: DARK_MODE_BACKGROUND,
                  color: TEXT_COLOR,
                  fontSize: 15,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 400,
                  color: MUTED_COLOR,
                  marginBottom: 6,
                }}
              >
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${BORDER_COLOR}`,
                  background: DARK_MODE_BACKGROUND,
                  color: TEXT_COLOR,
                  fontSize: 15,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 400,
                  color: MUTED_COLOR,
                  marginBottom: 6,
                }}
              >
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${BORDER_COLOR}`,
                  background: DARK_MODE_BACKGROUND,
                  color: TEXT_COLOR,
                  fontSize: 15,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "14px",
                borderRadius: 10,
                border: "none",
                background: PRIMARY_BLUE,
                color: "#000",
                fontWeight: 400,
                fontSize: 15,
                cursor: loading ? "wait" : "pointer",
                transition: "all .2s",
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserProfileSettings;