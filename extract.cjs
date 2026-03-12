const fs = require('fs');

const data = fs.readFileSync('main_audit.jsx', 'utf8');
const lines = data.split('\n');

function getLines(start, end) {
    return lines.slice(start - 1, end).join('\n'); // Start and end are 1-based inclusive
}

const colorMappings = {
    'DARK': 'DARK_MODE_BACKGROUND',
    'CARD': 'CARD_BACKGROUND',
    'BORDER': 'BORDER_COLOR',
    'MUTED': 'MUTED_COLOR',
    'WHITE': 'TEXT_COLOR',
    'ORANGE': 'PRIMARY_BLUE',
};

function replaceColors(text) {
    let result = text;
    for (const [oldC, newC] of Object.entries(colorMappings)) {
        // Replace exact word matches for the color constants (e.g., \bDARK\b)
        result = result.replace(new RegExp(`\\b${oldC}\\b`, 'g'), newC);
    }
    return result;
}

const imports = `import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { updateProfile, updatePassword, updateEmail } from "firebase/auth";
import { auth, db } from "./firebase";

const DARK_MODE_BACKGROUND = "#000000";
const CARD_BACKGROUND = "#1C1C1E";
const BORDER_COLOR = "#3A3A3C";
const MUTED_COLOR = "#8E8E93";
const TEXT_COLOR = "#FFFFFF";
const PRIMARY_BLUE = "#007AFF";

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
          border: \`3px solid \${BORDER_COLOR}\`,
          borderTopColor: PRIMARY_BLUE,
          borderRadius: "50%",
          margin: "0 auto 16px",
        }}
      />
      <style>{\`@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }\`}</style>
      <div>{message || "Loading..."}</div>
    </div>
  );
}
`;

// Extract UserDashboard logic!
const automationTools = getLines(2804, 3105);
const userDashboard = getLines(3542, 4211);

const userDashboardFinal = imports + '\n' + replaceColors(automationTools) + '\n\n' + replaceColors(userDashboard) + '\n\nexport default UserDashboard;';

fs.writeFileSync('src/UserDashboard.jsx', userDashboardFinal);

// Extract UserProfileSettings logic
const userProfileSettings = getLines(4216, 4507);
const userProfileSettingsFinal = imports + '\n' + replaceColors(userProfileSettings) + '\n\nexport default UserProfileSettings;';

fs.writeFileSync('src/UserProfileSettings.jsx', userProfileSettingsFinal);

// Extract SharedReportView logic
const sharedReportView = getLines(4513, 4585);
const sharedReportViewFinal = imports + '\n' + replaceColors(sharedReportView) + '\n\nexport default SharedReportView;';

fs.writeFileSync('src/SharedReportView.jsx', sharedReportViewFinal);

console.log("Extraction and replacement successful!");
