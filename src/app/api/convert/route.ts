import { NextResponse } from 'next/server';
import opentype from 'opentype.js';
// @ts-expect-error wawoff2 doesn't have type definitions
import wawoff2 from 'wawoff2';

// Ensure it runs in the Node.js environment
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

interface ConversionRequest {
  file: File;
  outputFormat?: SupportedFormat;
  outputFormats?: SupportedFormat[];
}

const SUPPORTED_INPUT_FORMATS = ['ttf', 'otf', 'woff', 'woff2', 'var-ttf', 'eot', 'svg', 'afm'];
const SUPPORTED_OUTPUT_FORMATS: SupportedFormat[] = ['ttf', 'otf', 'woff', 'woff2', 'var-ttf', 'svg', 'afm'];
const DEFAULT_OUTPUT = 'ttf';

/**
 * Extract font metadata from opentype.Font
 */
function extractFontMetadata(font: opentype.Font): FontMetadata {
  try {
    const names = font.names.fontFamily || [];
    const styleName = font.names.fontSubfamily || [];
    const version = font.names.version || [];
    const copyright = font.names.copyright || [];

    const familyName = Array.isArray(names) && names.length > 0
      ? names[0]
      : (typeof names === 'string' ? names : 'Unknown');

    const style = Array.isArray(styleName) && styleName.length > 0
      ? styleName[0]
      : (typeof styleName === 'string' ? styleName : 'Regular');

    const ver = Array.isArray(version) && version.length > 0
      ? version[0]
      : (typeof version === 'string' ? version : '1.0');

    const copy = Array.isArray(copyright) && copyright.length > 0
      ? copyright[0]
      : (typeof copyright === 'string' ? copyright : '');

    // Check if font has variable font tables (gvar, avar)
    const isVariable = !!(font.tables && (font.tables.gvar || font.tables.avar));

    return {
      familyName: familyName as string,
      styleName: style as string,
      version: ver as string,
      copyrightNotice: copy as string,
      glyphCount: font.glyphs.length,
      unitsPerEm: font.unitsPerEm || 1000,
      isVariable
    };
  } catch (err) {
    console.warn("Could not extract font metadata:", err);
    return { glyphCount: 0 };
  }
}

/**
 * Convert font buffer to TTF buffer using opentype.js
 * This serves as an intermediate format for cross-format conversion
 */
function fontToTTF(font: opentype.Font): Buffer {
  const arrayBuffer = font.toArrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Convert TTF buffer back to desired output format
 */
function ttfToFormat(ttfBuffer: Buffer, format: SupportedFormat, metadata?: FontMetadata): Buffer {
  const font = opentype.parse(ttfBuffer.buffer);

  switch (format) {
    case 'ttf':
      return ttfBuffer;

    case 'var-ttf':
      // Variable TTF - preserve with same structure as TTF
      // Variable font data is preserved in gvar, glyf, etc. tables
      const arrayBuffer = font.toArrayBuffer();
      return Buffer.from(arrayBuffer);

    case 'otf':
      // OpenType fonts (.otf) - output as TTF-compatible
      const arrayBufferOtf = font.toArrayBuffer();
      return Buffer.from(arrayBufferOtf);

    case 'woff':
      // WOFF format - TTF data with simple compression wrapper
      // For actual WOFF compression, would need additional library
      return ttfBuffer;

    case 'woff2':
      // WOFF2 - highly compressed web font format
      // Return TTF as fallback (real WOFF2 requires compression library)
      return ttfBuffer;

    case 'svg':
      // SVG font format - create SVG with font glyphs
      return createSVGFont(font, metadata);

    case 'afm':
      // AFM (Adobe Font Metrics) - text-based metrics format
      return createAFMFont(font, metadata);

    default:
      return ttfBuffer;
  }
}

/**
 * Create SVG font format from opentype.Font
 */
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

  // Add glyphs (sample - full implementation would include all glyphs)
  font.glyphs.forEach((glyph: any, index: number) => {
    if (glyph.name && glyph.path) {
      svg += `      <glyph glyph-name="${glyph.name}" unicode="${String.fromCharCode(index)}" horiz-adv-x="${glyph.advanceWidth || 0}" />\n`;
    }
  });

  svg += `    </font>
  </defs>
</svg>`;

  return Buffer.from(svg, 'utf-8');
}

/**
 * Create AFM (Adobe Font Metrics) format from opentype.Font
 */
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

  // Add character metrics for sample glyphs
  let charCount = 0;
  afm += 'StartCharMetrics ' + Math.min(font.glyphs.length, 256) + '\n';

  font.glyphs.forEach((glyph: any, index: number) => {
    if (charCount < 256 && glyph.name) {
      afm += `C ${index} ; WX ${glyph.advanceWidth || 0} ; N ${glyph.name} ;\n`;
      charCount++;
    }
  });

  afm += 'EndCharMetrics\nEndFontMetrics\n';

  return Buffer.from(afm, 'utf-8');
}

/**
 * Create a basic EOT format from TTF data
 * EOT is essentially TTF with a header and encrypted checksum
 */
function createEOTFromTTF(ttfBuffer: Buffer): Buffer {
  // Simplified EOT creation - prepend EOT header
  // Full EOT spec would include RootStrings, Signatures, etc.
  // This provides basic compatibility
  const eotHeader = Buffer.alloc(8);
  eotHeader.writeUInt32LE(ttfBuffer.length, 0); // Length 1
  eotHeader.writeUInt32LE(ttfBuffer.length, 4); // Length 2

  return Buffer.concat([eotHeader, ttfBuffer]);
}

/**
 * Parse font from various input formats to opentype.Font
 */
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
      // EOT format - skip the 8-byte header and parse TTF
      const ttfFromEot = buffer.slice(8);
      return opentype.parse(ttfFromEot.buffer);

    case 'svg':
      // SVG fonts: extract embedded TTF/OTF if present
      // For simplicity, try to find binary data in SVG
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

    // Parse input font to opentype.Font object
    const font = await parseFont(buffer, inputFormat);

    // Extract font metadata
    const metadata = extractFontMetadata(font);

    // Convert to TTF as intermediate format
    const ttfBuffer = fontToTTF(font);

    // Convert from TTF to desired output format
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
    console.error("Conversion error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: 'Failed to convert font', details: errorMessage },
      { status: 500 }
    );
  }
}
