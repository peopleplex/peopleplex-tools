import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import HomePage from './HomePage.jsx';
import AuthModal from './AuthModal.jsx';
import ReportDashboard from './ReportDashboard.jsx';
import MyReports from './MyReports.jsx';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0A0A0F',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 24
          }}>⚡</div>
          <div style={{ color: '#94A3B8', fontSize: 14 }}>Loading PeoplePlex...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              user={user}
              onOpenAuth={(mode, formData) => {
                setAuthMode(mode);
                setPendingFormData(formData || null);
                setShowAuthModal(true);
              }}
            />
          }
        />
        <Route
          path="/report/:reportId"
          element={<ReportDashboard user={user} />}
        />
        <Route
          path="/my-reports"
          element={
            user
              ? <MyReports user={user} onOpenAuth={(mode) => { setAuthMode(mode); setShowAuthModal(true); }} />
              : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          pendingFormData={pendingFormData}
          onClose={() => { setShowAuthModal(false); setPendingFormData(null); }}
          onSuccess={(u) => {
            setUser(u);
            setShowAuthModal(false);
          }}
          onSwitchMode={(m) => setAuthMode(m)}
        />
      )}
    </>
  );
}
