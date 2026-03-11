import React from 'react';

const UserProfileSettings = ({ user, onClose }) => {
  // Basic styles for the placeholder
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
      <h2 style={headingStyle}>⚙️ Settings</h2>
      <p style={textStyle}>
        This is a placeholder for user profile settings. This feature is currently under construction.
      </p>
      {user && <p style={{ color: '#ccc', marginBottom: '24px' }}>Logged in as: {user.email}</p>}
      <button style={buttonStyle} onClick={onClose}>Back to Dashboard</button>
    </div>
  );
};

export default UserProfileSettings;
