import { NextResponse } from 'next/server';
import { Font } from 'fonteditor-core';
// @ts-expect-error wawoff2 doesn't have type definitions
import wawoff2 from 'wawoff2';

// Ensure it runs in the Node.js environment
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension !== 'woff' && extension !== 'woff2') {
      return NextResponse.json({ error: 'Unsupported file format. Please upload .woff or .woff2 files.' }, { status: 400 });
    }

    let ttfBuffer: Buffer;

    if (extension === 'woff2') {
      // wawoff2 has native serverless support without external WASM file reading
      const decompressed = await wawoff2.decompress(buffer);
      ttfBuffer = Buffer.from(decompressed);
    } else {
      // fonteditor-core works fine for WOFF1 since it's just zlib
      const font = Font.create(buffer, { type: 'woff', hinting: true });
      ttfBuffer = font.write({ type: 'ttf', hinting: true }) as Buffer;
    }

    // Both OTT and TTF can share the decompressed buffer safely
    const otfBuffer = ttfBuffer;

    const ttfBase64 = ttfBuffer.toString('base64');
    const otfBase64 = otfBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      originalName: file.name,
      ttf: ttfBase64,
      otf: otfBase64
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
