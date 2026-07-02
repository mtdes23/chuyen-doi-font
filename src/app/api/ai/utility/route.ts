import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function generateColorPalette(baseHex: string): string[] {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [];
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const palette: string[] = [];
  for (let i = 0; i < 10; i++) {
    const newH = (hsl.h + i * 36) % 360;
    const newS = Math.max(20, Math.min(100, hsl.s + (i % 2 === 0 ? 10 : -10)));
    const newL = Math.max(20, Math.min(90, hsl.l - 20 + i * 7));
    const rad = newH * Math.PI / 180;
    const c = (1 - Math.abs(2 * newL / 100 - 1)) * newS / 100;
    const x = c * (1 - Math.abs((newH / 60) % 2 - 1));
    const m = newL / 100 - c / 2;
    let r1 = 0, g1 = 0, b1 = 0;
    if (newH < 60) { r1 = c; g1 = x; }
    else if (newH < 120) { r1 = x; g1 = c; }
    else if (newH < 180) { g1 = c; b1 = x; }
    else if (newH < 240) { g1 = x; b1 = c; }
    else if (newH < 300) { r1 = x; b1 = c; }
    else { r1 = c; b1 = x; }
    palette.push(rgbToHex(Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)));
  }
  return palette;
}

function generateQRSVG(text: string): string {
  const size = 200;
  const modules = 21;
  const moduleSize = size / modules;

  let modules2D: boolean[][] = [];
  for (let i = 0; i < modules; i++) {
    modules2D[i] = [];
    for (let j = 0; j < modules; j++) {
      modules2D[i][j] = false;
    }
  }

  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
        modules2D[i][j] = true;
      }
    }
    for (let j = 0; j < 7; j++) {
      if (i + 14 < modules && j + 14 < modules) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          modules2D[i + 14][j + 14] = true;
        }
      }
    }
  }

  const data = Buffer.from(text, 'utf-8');
  for (let i = 0; i < Math.min(data.length, 50); i++) {
    const byte = data[i];
    for (let bit = 0; bit < 8; bit++) {
      const row = 9 + Math.floor(i / 5);
      const col = 9 + (i % 5) * 4 + bit;
      if (row < modules && col < modules) {
        modules2D[row][col] = ((byte >> (7 - bit)) & 1) === 1;
      }
    }
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;

  for (let i = 0; i < modules; i++) {
    for (let j = 0; j < modules; j++) {
      if (modules2D[i][j]) {
        svg += `<rect x="${j * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const action = (formData.get('action') as string) || 'color-convert';
    const text = formData.get('text') as string;

    if (!text) {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    switch (action) {
      case 'color-convert': {
        const rgb = hexToRgb(text);
        if (!rgb) return NextResponse.json({ error: 'Invalid hex color' }, { status: 400 });
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        return NextResponse.json({
          success: true,
          hex: text,
          rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
        });
      }
      case 'color-palette': {
        const palette = generateColorPalette(text);
        return NextResponse.json({ success: true, colors: palette });
      }
      case 'qr-generate': {
        const svg = generateQRSVG(text);
        return NextResponse.json({ success: true, data: Buffer.from(svg).toString('base64') });
      }
      case 'diff': {
        const text2 = formData.get('text2') as string;
        if (!text2) return NextResponse.json({ error: 'Second text required' }, { status: 400 });
        const lines1 = text.split('\n');
        const lines2 = text2.split('\n');
        const diff: { line: number; type: 'added' | 'removed' | 'same'; content: string }[] = [];
        const maxLen = Math.max(lines1.length, lines2.length);

        for (let i = 0; i < maxLen; i++) {
          if (i >= lines1.length) diff.push({ line: i + 1, type: 'added', content: lines2[i] });
          else if (i >= lines2.length) diff.push({ line: i + 1, type: 'removed', content: lines1[i] });
          else if (lines1[i] !== lines2[i]) {
            diff.push({ line: i + 1, type: 'removed', content: lines1[i] });
            diff.push({ line: i + 1, type: 'added', content: lines2[i] });
          } else {
            diff.push({ line: i + 1, type: 'same', content: lines1[i] });
          }
        }
        return NextResponse.json({ success: true, diff });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to process', details: errorMessage }, { status: 500 });
  }
}
