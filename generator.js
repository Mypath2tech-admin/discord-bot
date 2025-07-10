// generator.js
import fs from 'fs';
import path from 'path';

const OUT = path.resolve('./cards');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const suits = [
  { name: 'clubs',    symbol: '♣', color: '#000' },
  { name: 'diamonds', symbol: '♦', color: '#d00' },
  { name: 'hearts',   symbol: '♥', color: '#d00' },
  { name: 'spades',   symbol: '♠', color: '#000' },
];

const ranks = [
  { short: 'A', name: 'a'   },
  { short: '2', name: '2'   },
  { short: '3', name: '3'   },
  { short: '4', name: '4'   },
  { short: '5', name: '5'   },
  { short: '6', name: '6'   },
  { short: '7', name: '7'   },
  { short: '8', name: '8'   },
  { short: '9', name: '9'   },
  { short: '10',name: '10'  },
  { short: 'J', name: 'j'   },
  { short: 'Q', name: 'q'   },
  { short: 'K', name: 'k'   },
];

// card dimensions and corner radius
const W = 400, H = 600, R = 20;

// 1) generate the 52 face cards + 2 jokers if you want (here we skip jokers)
for (const { name: suitName, symbol, color } of suits) {
  for (const { short, name: rankName } of ranks) {
    const filename = `${rankName}_of_${suitName}.svg`;
    const filePath = path.join(OUT, filename);

    const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${W}" height="${H}" rx="${R}" ry="${R}" fill="#fff" stroke="#000" stroke-width="8"/>
  <!-- corner rank -->
  <text x="20" y="60" font-size="60" font-family="sans-serif" fill="${color}">${short}</text>
  <!-- big suit symbol -->
  <text x="${W/2}" y="${H/2 + 60}" font-size="200" text-anchor="middle" font-family="sans-serif" fill="${color}">${symbol}</text>
</svg>`.trim();

    fs.writeFileSync(filePath, svg);
    console.log(`Generated ${filename}`);
  }
}

// 2) Generate exactly one back.svg
const backSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${W}" height="${H}" rx="${R}" ry="${R}" fill="#004080" stroke="#fff" stroke-width="8"/>
  <defs>
    <pattern id="stripe" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="20" stroke="#fff" stroke-width="5"/>
    </pattern>
  </defs>
  <rect x="10" y="10" width="${W-20}" height="${H-20}" rx="${R-5}" ry="${R-5}" fill="url(#stripe)"/>
</svg>`.trim();

fs.writeFileSync(path.join(OUT, 'back.svg'), backSvg);
console.log('Generated back.svg');
