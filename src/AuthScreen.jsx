import React from 'react';

const AuthScreen = () => {
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

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>🔒 Authentication</h2>
      <p style={textStyle}>
        This is a placeholder for the authentication screen. This feature is under construction.
      </p>
    </div>
  );
};

export default AuthScreen;
