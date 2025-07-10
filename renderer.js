// renderer.js
import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath }   from 'url';
import { dirname, join }    from 'path';

// emulate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/**
 * Renders a blackjack table with dealer and player hands.
 * @param {Object} options
 * @param {string[]} options.dealerFiles  Array of SVG filenames (in ./cards/)
 * @param {string[]} options.playerFiles  Array of SVG filenames (in ./cards/)
 * @returns {Buffer} PNG buffer
 */
export async function renderTable({ dealerFiles, playerFiles }) {
  const CARD_W    = 200;
  const CARD_H    = 280;
  const H_PAD     = 20;  // horizontal padding
  const V_PAD_TOP = 20;  // top padding
  const V_GAP     = 40;  // vertical gap between rows

  // how many columns we need
  const cols   = Math.max(dealerFiles.length, playerFiles.length);
  const width  = cols * (CARD_W + H_PAD) + H_PAD;
  const height = V_PAD_TOP + CARD_H + V_GAP + CARD_H + V_PAD_TOP;

  // create canvas
  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext('2d');

  // background
  ctx.fillStyle = '#2b2d31';
  ctx.fillRect(0, 0, width, height);

  // draw vertical divider
  ctx.strokeStyle = '#555';
  ctx.lineWidth   = 4;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  // helper to draw a row
  async function drawRow(files, y) {
    for (let i = 0; i < files.length; i++) {
      const filePath = join(__dirname, 'cards', files[i]);
      const img      = await loadImage(filePath);
      const x        = H_PAD + i * (CARD_W + H_PAD);
      ctx.drawImage(img, x, y, CARD_W, CARD_H);
    }
  }

  // draw dealer
  await drawRow(dealerFiles, V_PAD_TOP);

  // draw player
  await drawRow(playerFiles, V_PAD_TOP + CARD_H + V_GAP);

  return canvas.toBuffer(); // PNG buffer
}
