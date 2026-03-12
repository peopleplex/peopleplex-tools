import fs from 'fs';
import path from 'path';

const filesToUpdate = fs.readdirSync('src').filter(f => f.endsWith('.jsx')).map(f => 'src/' + f);

function getNewSize(oldSize) {
    // Convert based on user request:
    // Body/Labels: 14 to 15
    // Subheaders: 18
    // Headers: 22
    if (oldSize <= 13) return 14;
    if (oldSize >= 14 && oldSize <= 16) return 15;
    if (oldSize >= 17 && oldSize <= 20) return 18;
    if (oldSize >= 21 && oldSize <= 32) return 22;
    return oldSize; // leave > 32 alone (icons, huge scores)
}

for (const file of filesToUpdate) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace fontSize: XX,
    content = content.replace(/fontSize:\s*(\d+)/g, (match, sizeStr) => {
        const oldSize = parseInt(sizeStr, 10);
        const newSize = getNewSize(oldSize);
        return `fontSize: ${newSize}`;
    });

    // Replace font-size: XXpx in template literals or CSS injections
    content = content.replace(/font-size:\s*(\d+)px/g, (match, sizeStr) => {
        const oldSize = parseInt(sizeStr, 10);
        const newSize = getNewSize(oldSize);
        return `font-size: ${newSize}px`;
    });

    fs.writeFileSync(file, content);
}

console.log("Global Font Resizing Complete.");
