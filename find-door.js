const fs = require('fs');
const content = fs.readFileSync('work/main.pretty.js', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('getClickData') || (line.includes('type') && line.includes('"door"'))) {
    console.log(`Line ${i + 1}: ${line.trim().slice(0, 140)}`);
  }
}

