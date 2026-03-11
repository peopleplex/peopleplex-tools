import React from 'react';

const UserDashboard = ({ onClose, onLoadAudit }) => {
  const containerStyle = {
    padding: '40px',
    color: '#FFFFFF',
    background: '#1C1C1E',
    borderRadius: '16px',
    maxWidth: '560px',
    margin: '40px auto',
    textAlign: 'center'
  };

  const headingStyle = {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '16px'
  };

  const textStyle = {
    color: '#8E8E93',
    marginBottom: '32px'
  };

  const buttonStyle = {
      padding: "16px 28px",
      borderRadius: 14,
      border: "none",
      background: `linear-gradient(45deg, #007AFF, #00AFFF)`,
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: 700,
      cursor: "pointer",
      transition: "all .2s ease-in-out",
      boxShadow: "0 4px 15px 0 rgba(0, 122, 255, 0.35)",
  };

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>📊 User Dashboard</h2>
      <p style={textStyle}>
        This is a placeholder for the user dashboard. This feature is under construction.
      </p>
      <button style={buttonStyle} onClick={onClose}>Back to Dashboard</button>
    </div>
  );
};

export default UserDashboard;
