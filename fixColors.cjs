const fs = require('fs');

let cnt = fs.readFileSync('src/JourneyAudit.jsx', 'utf8');
cnt = cnt.replace(/color:\s*"#fff"/g, 'color: TEXT_COLOR');
cnt = cnt.replace(/color:\s*"#ccc"/g, 'color: MUTED_COLOR');
cnt = cnt.replace(/color:\s*"#aaa"/g, 'color: MUTED_COLOR');

fs.writeFileSync('src/JourneyAudit.jsx', cnt);
console.log("Colors unfixed");
