// Re-aligning the layout container globally based on user feedback + adding a 404 block for unknown routes
const fs = require('fs');

// 1. Fix the width problem on generic pages (UserDashboard, UserProfileSettings, etc)
// The "align.js" script forced 'minHeight: 100vh' AND 'alignItems: "center"' on the 
// outer div of files like UserDashboard and UserProfileSettings, but didn't set width to 100%. 
// So the flex-column shrunk the layout.

const filesFixLayouts = [
    'src/UserDashboard.jsx',
    'src/UserProfileSettings.jsx'
];

for (const file of filesFixLayouts) {
    if (fs.existsSync(file)) {
        let cnt = fs.readFileSync(file, 'utf8');
        // Let's strip out the enforced flex-boxing on these generic dashboard pages
        // which messed up their horizontal widths and return them to the standard container block with margin: 0 auto
        cnt = cnt.replace(/display:\s*"flex",\s*flexDirection:\s*"column",\s*alignItems:\s*"center",\s*justifyContent:\s*"center",\s*minHeight:\s*"100vh"/, 'width: "100%"');
        fs.writeFileSync(file, cnt);
    }
}

// Re-fix App.jsx main-content flex
let appCnt = fs.readFileSync('src/App.jsx', 'utf8');
appCnt = appCnt.replace(
    `.main-content {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }`,
    `.main-content {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          position: relative;
          display: flex;
          flex-direction: column;
        }`
);
fs.writeFileSync('src/App.jsx', appCnt);


// ToolsDashboard Setup Wizard Wrapper
let toolsCnt = fs.readFileSync('src/ToolsDashboard.jsx', 'utf8');
// Fix the tools setup wizard flex bounding box size so the inputs are at a good width, but centered correctly.
toolsCnt = toolsCnt.replace(
    /<div style=\{\{\s*display:\s*"flex",\s*flexDirection:\s*"column",\s*height:\s*"100vh",\s*alignItems:\s*"center",\s*justifyContent:\s*"center",\s*textAlign:\s*"center",\s*padding:\s*"20px"\s*\}\}>/,
    `<div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px", width: "100%" }}>`
);
// Make the ToolsDashboard standard page full width too 
toolsCnt = toolsCnt.replace(
    /display:\s*"flex",\s*flexDirection:\s*"column",\s*alignItems:\s*"center",\s*justifyContent:\s*"center",\s*minHeight:\s*"100vh",\s*width:\s*"100%"/,
    `width: "100%"`
);
fs.writeFileSync('src/ToolsDashboard.jsx', toolsCnt);

// JourneyAudit - The actual setup wizard form is rendered in here, it needs width bounding
let journeyCnt = fs.readFileSync('src/JourneyAudit.jsx', 'utf8');
// Look for the main form layout block that needs width control.
journeyCnt = journeyCnt.replace(
    `{setupStep === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>`,
    `{setupStep === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: "400px", margin: "0 auto" }}>`
);
journeyCnt = journeyCnt.replace(
    `{setupStep === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>`,
    `{setupStep === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: "400px", margin: "0 auto" }}>`
);
journeyCnt = journeyCnt.replace(
    `{setupStep === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>`,
    `{setupStep === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: "400px", margin: "0 auto" }}>`
);
fs.writeFileSync('src/JourneyAudit.jsx', journeyCnt);


console.log("Layout Widths Corrected.");
