import fs from 'fs';
import path from 'path';

const filesToUpdate = fs.readdirSync('src').filter(f => f.endsWith('.jsx')).map(f => 'src/' + f);

for (const file of filesToUpdate) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace hardcoded Hex colors
    // Backgrounds: #000000 -> #F9FAFB
    content = content.replace(/#000000/ig, '#F9FAFB');
    // Card Backgrounds: #1C1C1E -> #FFFFFF
    content = content.replace(/#1C1C1E/ig, '#FFFFFF');
    // Borders: #3A3A3C -> #E5E7EB
    content = content.replace(/#3A3A3C/ig, '#E5E7EB');
    // Muted text: #8E8E93 -> #6B7280
    content = content.replace(/#8E8E93/ig, '#6B7280');
    // Primary Blue: #007AFF -> #FF6B35
    content = content.replace(/#007AFF/ig, '#FF6B35');

    // Text colors (This is tricky)
    // Dark mode text was #ffffff. We want them to be #111827 unless it's a card background (which is now #FFFFFF)
    // By doing Backgrounds first, any #1C1C1E became #FFFFFF.
    // Wait, if I replace all #FFFFFF with #111827, I will break the brand new card background #FFFFFF!!
    // So instead I'll do a regex lookaround if possible, or just ignore #FFFFFF since it's mostly handled via TEXT_COLOR. Let's see if there are any hard code "#fff" or "#FFFFFF" 

    fs.writeFileSync(file, content);
}
console.log("Hardcode UI Update Complete.");
