const fs = require('fs');
const path = require('path');

const filesToUpdate = fs.readdirSync('src').filter(f => f.endsWith('.jsx')).map(f => 'src/' + f);

for (const file of filesToUpdate) {
    let content = fs.readFileSync(file, 'utf8');

    // Remove bold fonts
    content = content.replace(/fontWeight:\s*["']?bold["']?/g, 'fontWeight: 400');
    content = content.replace(/fontWeight:\s*\d{3}/g, 'fontWeight: 400');
    content = content.replace(/font-weight:\s*bold/g, 'font-weight: 400');
    content = content.replace(/font-weight:\s*\d{3}/g, 'font-weight: 400');
    content = content.replace(/<b>/g, '<span>');
    content = content.replace(/<\/b>/g, '</span>');
    content = content.replace(/<strong>/g, '<span>');
    content = content.replace(/<\/strong>/g, '</span>');

    // Change alignments to Center Center for main wrapper blocks if they exist
    // We can do this safely for CustomerPsychology, SharedReportView, ToolsDashboard, UserProfileSettings, UserDashboard
    if (file.includes('CustomerPsychology.jsx') || file.includes('UserProfileSettings.jsx') || file.includes('UserDashboard.jsx') || file.includes('ToolsDashboard.jsx')) {
        // Usually the outermost div has a style or className. We'll search for the first return ( <div or return <div style=
        // Actuall the safest way is to target specific files. 
        // In CustomerPsychology:
        content = content.replace(/<div style=\{\{ padding: "40px 20px 60px"[^}]*\}\}/, '<div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px" }}');
    }

    // Same for UserProfileSettings "max-width: 600" wrapper
    if (file.includes('UserProfileSettings.jsx')) {
        content = content.replace(/margin:\s*"0 auto",\n\s*padding:\s*"40px 24px",/, 'margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh",');
    }

    // Same for UserDashboard overarching wrapper
    if (file.includes('UserDashboard.jsx')) {
        content = content.replace(/maxWidth:\s*900,\n\s*margin:\s*"0 auto",\n\s*padding:\s*"32px 20px"/, 'maxWidth: 900, margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh"');
    }

    // Same for ToolsDashboard
    if (file.includes('ToolsDashboard.jsx')) {
        content = content.replace(/maxWidth:\s*1200,\n\s*margin:\s*"0 auto",\n\s*padding:\s*"40px 24px"/, 'maxWidth: 1200, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", width: "100%"');
    }

    fs.writeFileSync(file, content);
}

// In App.jsx, ensure main-content has flex capabilities if the child wants height 100%
let appContent = fs.readFileSync('src/App.jsx', 'utf8');
appContent = appContent.replace(/font-weight:\s*700/g, 'font-weight: 400');
appContent = appContent.replace(/\.main-content \{\n\s*flex: 1;\n\s*height: 100vh;\n\s*overflow-y: auto;\n\s*position: relative;\n\s*\}/,
    `.main-content {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }`);
fs.writeFileSync('src/App.jsx', appContent);

console.log("Fonts unbolded and pages centered.");
