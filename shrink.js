import fs from 'fs';

const filePath = 'src/AuthScreen.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Header Sizes
content = content.replace(/fontSize: 24,/g, 'fontSize: 20,');
content = content.replace(/fontSize: 14,/g, 'fontSize: 13,');

// Input Texts & Labels
content = content.replace(/fontSize: 15,/g, 'fontSize: 13,');
content = content.replace(/fontSize: 12,/g, 'fontSize: 11,');

// General text that was 13 -> 12
content = content.replace(/fontSize: 13,/g, 'fontSize: 12,');

// Buttons Padding tighter
content = content.replace(/padding: "14px",/g, 'padding: "10px",');
content = content.replace(/padding: "12px 16px",/g, 'padding: "10px 12px",');

// Ensure card wrapper is centered (Already is via flex, but let's confirm width and margins)
// Currently it is max-width: 400. Let's make it slightly thinner for "compact"
content = content.replace(/maxWidth: 400,/g, 'maxWidth: 360,');

fs.writeFileSync(filePath, content);
console.log("AuthScreen compact sizes updated");
