import fs from 'fs';
import path from 'path';

const filesToUpdate = fs.readdirSync('src').filter(f => f.endsWith('.jsx')).map(f => 'src/' + f);

for (const file of filesToUpdate) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace all varying usages of font families
    content = content.replace(/'SF Pro Display'[^\n;}"]*/ig, "'Inter Tight', system-ui, sans-serif");
    content = content.replace(/'DM Sans'[^\n;}"]*/ig, "'Inter Tight', system-ui, sans-serif");
    content = content.replace(/"SF Pro Display"[^\n;}"]*/ig, '"Inter Tight", system-ui, sans-serif');

    fs.writeFileSync(file, content);
}

console.log("Font Update Complete.");
