const fs = require('fs');

const content = fs.readFileSync('work/main.pretty.js', 'utf8');
console.log('Original main.pretty.js size:', content.length, 'characters');

function search(regex, max = 8) {
  const lines = content.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) {
      out.push(`${i + 1}: ${lines[i].trim().slice(0, 160)}`);
      if (out.length >= max) break;
    }
  }
  return out;
}

console.log('\n=== POINTER / CURSOR / MOVEMENT ===');
console.log(search(/requestPointerLock|pointerLock|mousemove|onMouseMove|touchmove/i).join('\n'));

console.log('\n=== CLICK / TARGET MOVEMENT ===');
console.log(search(/targetX|destination|goTo|moveTo|clickToMove|walkTo/i).join('\n'));

console.log('\n=== DOOR CLASS / DOOR INTERACTION ===');
console.log(search(/class Door|Door\s*=|doorSound|toX|toY/i).join('\n'));

console.log('\n=== CAMPFIRE / FIRE / MARSHMALLOW ===');
console.log(search(/marshmallow|campfire|fire/i).join('\n'));

console.log('\n=== PHYSICS / OBJECTS ===');
console.log(search(/soccerBall|merryGoRound|seesaw|tetherball|volleyball/i).join('\n'));

