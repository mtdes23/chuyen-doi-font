import { NextResponse } from 'next/server';
import opentype from 'opentype.js';
// @ts-expect-error wawoff2 doesn't have type definitions
import wawoff2 from 'wawoff2';

export const runtime = 'nodejs';

type SupportedFormat = 'ttf' | 'otf' | 'woff' | 'woff2' | 'eot' | 'var-ttf' | 'svg' | 'afm';
type FontMetadata = {
  familyName?: string;
  styleName?: string;
  version?: string;
  copyrightNotice?: string;
  glyphCount?: number;
  unitsPerEm?: number;
  isVariable?: boolean;
};

const SUPPORTED_INPUT_FORMATS = ['ttf', 'otf', 'woff', 'woff2', 'var-ttf', 'eot', 'svg', 'afm'];
const SUPPORTED_OUTPUT_FORMATS: SupportedFormat[] = ['ttf', 'otf', 'woff', 'woff2', 'var-ttf', 'svg', 'afm'];

function extractFontMetadata(font: opentype.Font): FontMetadata {
  try {
    const names = font.names.fontFamily || [];
    const styleName = font.names.fontSubfamily || [];
    const version = font.names.version || [];
    const copyrightNotice = font.names.copyright || [];

    const familyName = Array.isArray(names) && names.length > 0
      ? names[0]
      : (typeof names === 'string' ? names : 'Unknown');

    const style = Array.isArray(styleName) && styleName.length > 0
      ? styleName[0]
      : (typeof styleName === 'string' ? styleName : 'Regular');

    const ver = Array.isArray(version) && version.length > 0
      ? version[0]
      : (typeof version === 'string' ? version : '1.0');

    const copy = Array.isArray(copyrightNotice) && copyrightNotice.length > 0
      ? copyrightNotice[0]
      : (typeof copyrightNotice === 'string' ? copyrightNotice : '');

    const isVariable = !!(font.tables && (font.tables.gvar || font.tables.avar));

    const glyphCount = Array.isArray(font.glyphs)
      ? font.glyphs.length
      : (font.glyphs && typeof font.glyphs === 'object'
        ? Object.keys(font.glyphs).length
        : 0);

    return {
      familyName: familyName as string,
      styleName: style as string,
      version: ver as string,
      copyrightNotice: copy as string,
      glyphCount,
      unitsPerEm: font.unitsPerEm || 1000,
      isVariable
    };
  } catch (err) {
    console.warn("Could not extract font metadata:", err);
    return { glyphCount: 0 };
  }
}

function fontToTTF(font: opentype.Font): Buffer {
  const arrayBuffer = font.toArrayBuffer();
  return Buffer.from(arrayBuffer);
}

function ttfToFormat(ttfBuffer: Buffer, format: SupportedFormat, metadata?: FontMetadata): Buffer {
  const font = opentype.parse(ttfBuffer.buffer);

  switch (format) {
    case 'ttf':
      return ttfBuffer;

    case 'var-ttf':
      const arrayBuffer = font.toArrayBuffer();
      return Buffer.from(arrayBuffer);

    case 'otf':
      const arrayBufferOtf = font.toArrayBuffer();
      return Buffer.from(arrayBufferOtf);

    case 'woff':
      return ttfBuffer;

    case 'woff2':
      return ttfBuffer;

    case 'svg':
      return createSVGFont(font, metadata);

    case 'afm':
      return createAFMFont(font, metadata);

    default:
      return ttfBuffer;
  }
}

function createSVGFont(font: opentype.Font, metadata?: FontMetadata): Buffer {
  const fontFamily = metadata?.familyName || 'CustomFont';
  const fontStyle = metadata?.styleName || 'Regular';
  const unitsPerEm = metadata?.unitsPerEm || 1000;

  let svg = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <font id="${fontFamily.replace(/\s+/g, '_')}" horiz-adv-x="${unitsPerEm}">
      <font-face font-family="${fontFamily}" font-style="${fontStyle}" units-per-em="${unitsPerEm}" />
`;

  try {
    const glyphArray = Array.isArray(font.glyphs) ? font.glyphs : Object.values(font.glyphs || {});
    glyphArray.forEach((glyph: opentype.Glyph, index: number) => {
      if (glyph && glyph.name) {
        svg += `      <glyph glyph-name="${glyph.name}" unicode="${String.fromCharCode(index)}" horiz-adv-x="${glyph.advanceWidth || 0}" />\n`;
      }
    });
  } catch (err) {
    console.warn('Error iterating glyphs for SVG:', err);
  }

  svg += `    </font>
  </defs>
</svg>`;

  return Buffer.from(svg, 'utf-8');
}

function createAFMFont(font: opentype.Font, metadata?: FontMetadata): Buffer {
  const fontFamily = metadata?.familyName || 'CustomFont';
  const fontStyle = metadata?.styleName || 'Regular';
  const unitsPerEm = metadata?.unitsPerEm || 1000;

  let afm = `StartFontMetrics 4.1
Comment Generated from font conversion
FontName ${fontFamily}-${fontStyle}
FullName ${fontFamily} ${fontStyle}
FamilyName ${fontFamily}
Weight ${fontStyle.includes('Bold') ? 'Bold' : 'Regular'}
FontBBox 0 0 ${unitsPerEm} ${unitsPerEm}
UnitsPerEm ${unitsPerEm}
IsFixedPitch false
CharacterSet ISO8859-1
`;

  let charCount = 0;
  try {
    const glyphArray = Array.isArray(font.glyphs) ? font.glyphs : Object.values(font.glyphs || {});
    afm += 'StartCharMetrics ' + Math.min(glyphArray.length, 256) + '\n';

    glyphArray.forEach((glyph: opentype.Glyph, index: number) => {
      if (charCount < 256 && glyph && glyph.name) {
        afm += `C ${index} ; WX ${glyph.advanceWidth || 0} ; N ${glyph.name} ;\n`;
        charCount++;
      }
    });
  } catch (err) {
    console.warn('Error iterating glyphs for AFM:', err);
  }

  afm += 'EndCharMetrics\nEndFontMetrics\n';

  return Buffer.from(afm, 'utf-8');
}

async function parseFont(buffer: Buffer, inputFormat: string): Promise<opentype.Font> {
  switch (inputFormat.toLowerCase()) {
    case 'woff2':
      const decompressed = await wawoff2.decompress(buffer);
      return opentype.parse(Buffer.from(decompressed).buffer);

    case 'woff':
    case 'ttf':
    case 'otf':
    case 'var-ttf':
      return opentype.parse(buffer.buffer);

    case 'eot':
      const ttfFromEot = buffer.slice(8);
      return opentype.parse(ttfFromEot.buffer);

    case 'svg':
      const svgStr = buffer.toString('utf-8');
      const match = svgStr.match(/base64,(.+?)['"]/);
      if (match && match[1]) {
        const fontBuffer = Buffer.from(match[1], 'base64');
        return opentype.parse(fontBuffer.buffer);
      }
      throw new Error('Could not find embedded font in SVG file');

    case 'afm':
      throw new Error('AFM files contain only metrics, not font data. Please provide a TTF, OTF, WOFF, or WOFF2 file.');

    default:
      throw new Error(`Unsupported input format: ${inputFormat}`);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const outputFormatRaw = (formData.get('outputFormat') as string) || 'ttf';
    const outputFormat = outputFormatRaw.toLowerCase() as SupportedFormat;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const inputFormat = file.name.split('.').pop()?.toLowerCase() || '';

    if (!SUPPORTED_INPUT_FORMATS.includes(inputFormat)) {
      return NextResponse.json({
        error: 'Unsupported file format',
        details: `Please upload ${SUPPORTED_INPUT_FORMATS.join(', ').toUpperCase()} files. Received: ${inputFormat.toUpperCase()}`
      }, { status: 400 });
    }

    if (!SUPPORTED_OUTPUT_FORMATS.includes(outputFormat)) {
      return NextResponse.json({
        error: 'Unsupported output format',
        details: `Available formats: ${SUPPORTED_OUTPUT_FORMATS.join(', ').toUpperCase()}`
      }, { status: 400 });
    }

    const font = await parseFont(buffer, inputFormat);
    const metadata = extractFontMetadata(font);
    const ttfBuffer = fontToTTF(font);
    const outputBuffer = ttfToFormat(ttfBuffer, outputFormat, metadata);
    const outputBase64 = outputBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      originalName: file.name,
      outputFormat: outputFormat,
      data: outputBase64,
      metadata: metadata
    });
  } catch (error: unknown) {
    console.error('Conversion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to convert font', details: errorMessage },
      { status: 500 }
    );
  }
}
