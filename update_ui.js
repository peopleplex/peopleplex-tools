import fs from 'fs';
import path from 'path';

const filesToUpdate = [
    'src/AuthScreen.jsx',
    'src/UserDashboard.jsx',
    'src/UserProfileSettings.jsx',
    'src/SharedReportView.jsx',
    'src/JourneyAudit.jsx',
    'src/ToolsDashboard.jsx',
    'src/CustomerPsychology.jsx',
    'src/App.jsx',
];

for (const file of filesToUpdate) {
    if (!fs.existsSync(file)) continue;

    let content = fs.readFileSync(file, 'utf8');

    // Replace definitions
    content = content.replace(/const DARK_MODE_BACKGROUND = ".*";/, 'const DARK_MODE_BACKGROUND = "#F9FAFB";');
    content = content.replace(/const CARD_BACKGROUND = ".*";/, 'const CARD_BACKGROUND = "#FFFFFF";');
    content = content.replace(/const BORDER_COLOR = ".*";/, 'const BORDER_COLOR = "#E5E7EB";');
    content = content.replace(/const MUTED_COLOR = ".*";/, 'const MUTED_COLOR = "#6B7280";');
    content = content.replace(/const TEXT_COLOR = ".*";/, 'const TEXT_COLOR = "#111827";');
    content = content.replace(/const PRIMARY_BLUE = ".*";/, 'const PRIMARY_BLUE = "#FF6B35";');

    // Some files use old naming conventions
    content = content.replace(/const DARK = ".*";/, 'const DARK = "#F9FAFB";');
    content = content.replace(/const CARD = ".*";/, 'const CARD = "#FFFFFF";');
    content = content.replace(/const BORDER = ".*";/, 'const BORDER = "#E5E7EB";');
    content = content.replace(/const MUTED = ".*";/, 'const MUTED = "#6B7280";');
    content = content.replace(/const WHITE = ".*";/, 'const WHITE = "#111827";');
    content = content.replace(/const ORANGE = ".*";/, 'const ORANGE = "#FF6B35";');

    // In AuthScreen specifically, we want to add classNames and inject a <style> block
    if (file === 'src/AuthScreen.jsx') {
        // Modify container padding
        content = content.replace(/padding: 40,/g, 'padding: 32,');
        content = content.replace(/borderRadius: 24,/g, 'borderRadius: 16, box-shadow: "0px 8px 24px rgba(0,0,0,0.06)",');

        // Inject className to elements
        content = content.replace(/<input\n\s*type="email"/g, '<input\n              type="email"\n              className="auth-input"');
        content = content.replace(/<input\n\s*type="password"/g, '<input\n                type="password"\n                className="auth-input"');
        content = content.replace(/<button\n\s*type="button"\n\s*onClick/g, '<button\n              type="button"\n              className="auth-btn"\n              onClick');
        content = content.replace(/<button\n\s*type="submit"/g, '<button\n              type="submit"\n              className="auth-btn"');
        content = content.replace(/<button\n\s*onClick=\{handleGoogleLogin\}/g, '<button\n              onClick={handleGoogleLogin}\n              className="google-btn"');

        // Add style block at the bottom of the return statement
        const styleBlock = `
        <style>{\`
          .auth-input {
            transition: all 0.2s ease-in-out;
          }
          .auth-input:focus {
            border-color: #FF6B35 !important;
            outline: none;
            box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
          }
          .auth-btn {
            transition: all 0.2s ease-in-out !important;
          }
          .auth-btn:hover {
            background: #E65A2A !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
          }
          .auth-btn:active {
            transform: translateY(0px);
          }
          .google-btn {
            transition: all 0.2s ease-in-out !important;
          }
          .google-btn:hover {
            background: #F9FAFB !important;
            border-color: #D1D5DB !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
        \`}</style>
      </div>
    </div>
  );
}`;

        // Replace the exact end of the file with the new style block
        content = content.replace(/<\/div>\n\s*<\/div>\n\s*\);\n\}/g, styleBlock);
    }

    // Same thing for UserDashboard, we want hover animations on buttons
    if (file === 'src/UserDashboard.jsx') {
        content = content.replace(/padding: "40px 24px"/g, 'padding: "32px 20px"');
    }

    fs.writeFileSync(file, content);
}

console.log("UI Update Complete.");
