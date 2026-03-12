import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const DARK_MODE_BACKGROUND = "#F9FAFB";
const CARD_BACKGROUND = "#FFFFFF";
const BORDER_COLOR = "#E5E7EB";
const MUTED_COLOR = "#6B7280";
const TEXT_COLOR = "#111827";
const PRIMARY_BLUE = "#FF6B35";

function getFriendlyErrorMessage(err) {
  if (!err || !err.code) return err?.message || "An unknown error occurred.";
  switch (err.code) {
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/user-not-found":
      return "No account registered with this email address.";
    case "auth/wrong-password":
      return "Wrong password. Please try again or reset it.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Please choose a stronger password (at least 6 characters).";
    case "auth/too-many-requests":
      return "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    default:
      return err.message;
  }
}

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let userDetails;
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        userDetails = userCred.user;
      } else {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        userDetails = userCred.user;

        // Send email verification on first signup
        await sendEmailVerification(userDetails);
        alert(
          "A verification link has been sent to your email. Please verify to fully secure your account.",
        );
      }

      // Ensure user profile document exists in Firestore database
      await setDoc(
        doc(db, "users", userDetails.uid),
        {
          email: userDetails.email,
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);

      // Ensure user profile document exists in Firestore database
      await setDoc(
        doc(db, "users", userCred.user.uid),
        {
          email: userCred.user.email,
          displayName: userCred.user.displayName,
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: DARK_MODE_BACKGROUND,
        color: TEXT_COLOR,
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: CARD_BACKGROUND,
          border: `1px solid ${BORDER_COLOR} `,
          padding: 32,
          borderRadius: 16, boxShadow: "0px 8px 24px rgba(0,0,0,0.06)",
          width: "100%",
          maxWidth: 360,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 400,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {isForgotPassword
            ? "Reset Password"
            : isLogin
              ? "Welcome Back"
              : "Create Account"}
        </h2>
        <p
          style={{
            color: MUTED_COLOR,
            textAlign: "center",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {isForgotPassword
            ? "Enter your email to receive a password reset link."
            : isLogin
              ? "Log in to view your audits."
              : "Sign up to start saving your audits."}
        </p>

        {resetSent && (
          <div
            style={{
              background: "#22c55e20",
              color: "#22c55e",
              padding: "10px",
              borderRadius: 8,
              fontSize: 14,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            If a native account exists with this email, a reset link was sent! (Check your spam).<br /><br />
            <i>Note: If you usually click "Continue with Google", you do not have a password to reset! Please log in with Google instead.</i>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#ff3b3020",
              color: "#ff3b30",
              padding: "10px",
              borderRadius: 8,
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${BORDER_COLOR} `,
                background: DARK_MODE_BACKGROUND,
                color: TEXT_COLOR,
                fontSize: 14,
                boxSizing: "border-box"
              }}
            />
          </div>
          {!isForgotPassword && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 400,
                    color: MUTED_COLOR,
                  }}
                >
                  Password
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${BORDER_COLOR} `,
                  background: DARK_MODE_BACKGROUND,
                  color: TEXT_COLOR,
                  fontSize: 14,
                  boxSizing: "border-box"
                }}
              />
            </div>
          )}
          {isForgotPassword ? (
            <button
              type="button"
              onClick={async () => {
                if (!email.trim()) {
                  setError("Please enter your email address first.");
                  return;
                }
                setLoading(true);
                setError(null);
                try {
                  await sendPasswordResetEmail(auth, email);
                  setResetSent(true);
                } catch (err) {
                  setError(getFriendlyErrorMessage(err));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              style={{
                marginTop: 8,
                width: "100%",
                padding: "10px",
                borderRadius: 10,
                border: "none",
                background: PRIMARY_BLUE,
                color: "#FFFFFF",
                fontWeight: 400,
                fontSize: 14,
                cursor: loading ? "wait" : "pointer",
                transition: "all .2s",
              }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                width: "100%",
                padding: "10px",
                borderRadius: 10,
                border: "none",
                background: PRIMARY_BLUE,
                color: "#FFFFFF",
                fontWeight: 400,
                fontSize: 14,
                cursor: loading ? "wait" : "pointer",
                transition: "all .2s",
              }}
            >
              {loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
            </button>
          )}

          {isLogin && !isForgotPassword && (
            <div
              onClick={() => {
                setIsForgotPassword(true);
                setError(null);
                setResetSent(false);
              }}
              style={{
                fontSize: 14,
                color: PRIMARY_BLUE,
                textAlign: "center",
                cursor: "pointer",
                fontWeight: 400,
                marginTop: 8,
              }}
            >
              Forgot your password?
            </div>
          )}

          {isForgotPassword && (
            <div
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
                setResetSent(false);
              }}
              style={{
                fontSize: 14,
                color: MUTED_COLOR,
                textAlign: "center",
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              ← Back to Login
            </div>
          )}
        </form>

        {!isForgotPassword && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "20px 0",
              }}
            >
              <div style={{ flex: 1, height: 1, background: BORDER_COLOR }} />
              <span
                style={{
                  margin: "0 10px",
                  fontSize: 14,
                  fontWeight: 400,
                  color: MUTED_COLOR,
                }}
              >
                OR
              </span>
              <div style={{ flex: 1, height: 1, background: BORDER_COLOR }} />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 10,
                border: `1px solid ${BORDER_COLOR} `,
                background: CARD_BACKGROUND,
                color: TEXT_COLOR,
                fontWeight: 400,
                fontSize: 14,
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                transition: "all .2s",
              }}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                width="20"
                alt="Google"
              />
              Continue with Google
            </button>
          </>
        )}

        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: MUTED_COLOR,
            marginTop: 24,
          }}
        >
          {isForgotPassword ? (
            <></>
          ) : (
            <>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span
                onClick={() => setIsLogin(!isLogin)}
                style={{ color: PRIMARY_BLUE, cursor: "pointer", fontWeight: 400 }}
              >
                {isLogin ? "Sign Up" : "Log In"}
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
