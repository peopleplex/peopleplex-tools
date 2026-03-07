import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

import ToolsDashboard from "./ToolsDashboard.jsx";
import CustomerPsychology from "./CustomerPsychology.jsx";
import UserProfileSettings from "./UserProfileSettings.jsx";
import SharedReportView from "./SharedReportView.jsx";
import UserDashboard from "./UserDashboard.jsx";
import AuthScreen from "./AuthScreen.jsx"; // Import AuthScreen
import JourneyAudit from "./JourneyAudit.jsx";

const PRIMARY_BLUE = "#007AFF";
const DARK_MODE_BACKGROUND = "#000000";
const CARD_BACKGROUND = "#1C1C1E";
const BORDER_COLOR = "#3A3A3C";
const MUTED_COLOR = "#8E8E93";
const TEXT_COLOR = "#FFFFFF";

function App() {
  const [user, setUser] = useState(undefined);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const isToolsDashboard = location.pathname === "/" || location.pathname === "/tools";
  const isAudit = location.pathname === "/journey";
  const isPsychology = location.pathname === "/psychology";
  const showDashboard = location.pathname === "/history";
  const showSettings = location.pathname === "/settings";

  if (user === undefined) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: DARK_MODE_BACKGROUND,
          color: TEXT_COLOR,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="layout-container">
      <style>{`
        .layout-container {
          display: flex;
          flex-direction: row;
          min-height: 100vh;
          background: ${DARK_MODE_BACKGROUND};
          font-family: 'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;
          color: ${TEXT_COLOR};
        }
        .side-nav {
          width: 260px;
          border-right: 1px solid ${BORDER_COLOR};
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          gap: 16px;
          background: ${CARD_BACKGROUND};
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 50;
        }
        .main-content {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          position: relative;
        }
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 15px;
          text-align: left;
          transition: all .2s;
        }
        .nav-btn.active {
          background: ${PRIMARY_BLUE};
          color: ${TEXT_COLOR};
        }
        .nav-btn.inactive {
          background: transparent;
          color: ${MUTED_COLOR};
        }
        .nav-btn.inactive:hover {
          background: rgba(255,255,255,0.08);
          color: ${TEXT_COLOR};
        }
        .nav-btn-icon {
          font-size: 20px;
          display: none; /* Hidden by default on desktop */
        }
        @media (max-width: 768px) {
          .layout-container {
            flex-direction: column;
          }
          .side-nav {
            width: 100%;
            height: 70px;
            flex-direction: row;
            border-right: none;
            border-top: 1px solid ${BORDER_COLOR};
            bottom: 0;
            top: auto;
            position: fixed;
            justify-content: space-around;
            padding: 0 10px;
            align-items: center;
            gap: 0;
          }
          .logo-section, .spacer {
            display: none !important;
          }
          .nav-btn {
            flex-direction: column;
            gap: 4px;
            padding: 10px;
            font-size: 10px;
            border-radius: 8px;
            justify-content: center;
          }
          .main-content {
            padding-bottom: 70px;
          }
          .nav-btn-icon {
            display: block; /* Show icons on mobile bottom nav */
          }
        }
      `}</style>

      <div className="side-nav">
        <div
          className="logo-section"
          style={{
            padding: "0 8px 16px",
            marginBottom: 16,
            borderBottom: `1px solid ${BORDER_COLOR}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(45deg, ${PRIMARY_BLUE}, #00AFFF)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 900,
              color: "#FFFFFF",
            }}
          >
            P
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: TEXT_COLOR }}>
              PeoplePlex
            </div>
            <div style={{ fontSize: 11, color: MUTED_COLOR }}>Growth Tools</div>
          </div>
        </div>

        <button
          className={`nav-btn ${isToolsDashboard ? "active" : "inactive"}`}
          onClick={() => navigate("/")}
        >
          <span className="nav-btn-icon">📦</span>
          <span>All Tools</span>
        </button>

        <button
          className={`nav-btn ${isAudit ? "active" : "inactive"}`}
          onClick={() => navigate("/journey")}
        >
          <span className="nav-btn-icon">📝</span>
          <span>Journey Audit</span>
        </button>

        <button
          className={`nav-btn ${isPsychology ? "active" : "inactive"}`}
          onClick={() => navigate("/psychology")}
        >
          <span className="nav-btn-icon">🧠</span>
          <span>Psychology Audit</span>
        </button>

        <button
          className={`nav-btn ${showDashboard ? "active" : "inactive"}`}
          onClick={() => navigate("/history")}
        >
          <span className="nav-btn-icon">📊</span>
          <span>My History</span>
        </button>

        <button
          className={`nav-btn ${showSettings ? "active" : "inactive"}`}
          onClick={() => navigate("/settings")}
        >
          <span className="nav-btn-icon">⚙️</span>
          <span>Settings</span>
        </button>

        <div className="spacer" style={{ flex: 1 }} />

        <button
          className="nav-btn inactive"
          onClick={() => signOut(auth)}
          style={{ color: "#FF3B30" }}
        >
          <span className="nav-btn-icon">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>

      <div className="main-content">
        <Routes>
          <Route path="/" element={<ToolsDashboard />} />
          <Route path="/journey" element={<JourneyAudit />} />
          <Route path="/psychology" element={<CustomerPsychology />} />
          <Route path="/history" element={<UserDashboard onClose={() => navigate("/")} />} />
          <Route path="/settings" element={<UserProfileSettings user={user} onClose={() => navigate("/")} />} />
          <Route path="/report/:reportId" element={<SharedReportView />} />
        </Routes>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  )
}
