const fs = require('fs');
const path = require('path');

const pDefault = path.join(__dirname, 'standalone', 'data', 'maps', 'default.json');
const def = JSON.parse(fs.readFileSync(pDefault, 'utf8'));
const door = def.elements.find(e => e.to === 'school');
if (door) {
  door.x = 6580;
  door.y = 1620;
}
fs.writeFileSync(pDefault, JSON.stringify(def, null, 1), 'utf8');

const pSchool = path.join(__dirname, 'standalone', 'data', 'maps', 'school.json');
const sch = JSON.parse(fs.readFileSync(pSchool, 'utf8'));
const returnDoor = sch.elements.find(e => e.to === 'default');
if (returnDoor) {
  returnDoor.toX = 6500;
  returnDoor.toY = 1750;
}
fs.writeFileSync(pSchool, JSON.stringify(sch, null, 1), 'utf8');

console.log('Updated default and school maps');

