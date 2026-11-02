const fs = require('fs');

const content = fs.readFileSync('work/main.pretty.js', 'utf8');
const lines = content.split('\n');

// 1. Find all object types in maps
const mapElements = new Set();
const mapMatches = content.match(/"elements":\s*\[(.*?)\]/g) || [];
for (const mm of mapMatches) {
  const types = mm.match(/"type":\s*"([^"]+)"/g) || [];
  for (const t of types) {
    mapElements.add(t.replace(/"type":\s*"/, '').replace('"', ''));
  }
}
console.log('Map element types:', Array.from(mapElements));

// 2. Find physics objects & interactive mechanics
const physicsTerms = ['soccerBall', 'volleyball', 'tetherball', 'seesaw', 'merryGoRound', 'campfire', 'marshmallow', 'fire', 'watercan', 'plant', 'coal', 'water', 'cauldron', 'chilli', 'coffee', 'gatorade', 'orange', 'floatie', 'shock', 'radio', 'fan', 'metalDetector'];
console.log('\nChecking physics/mechanics modules:');
for (const term of physicsTerms) {
  const count = (content.match(new RegExp(term, 'gi')) || []).length;
  console.log(`  ${term}: ${count} references`);
}

