const fs = require('fs');

let content = fs.readFileSync('src/JourneyAudit.jsx', 'utf8');

// The align script broke some JSX by replacing </b> with </span> but leaving <b> intact when doing regex,
// or replacing <strong/> tags incorrectly. Let's fix those syntax errors so Vite can render.
content = content.replace(/<b>/g, '<span>');
content = content.replace(/<strong>/g, '<span>');

fs.writeFileSync('src/JourneyAudit.jsx', content);
console.log("Fixed JSX Tag Mismatch");
