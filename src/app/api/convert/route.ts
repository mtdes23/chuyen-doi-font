import { NextResponse } from 'next/server';
import { Font, woff2 } from 'fonteditor-core';

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

    if (extension === 'woff2') {
      // Initialize WOFF2 module before performing conversions
      await woff2.init();
    }

    // Create a font object by parsing the WOFF/WOFF2 buffer
    const font = Font.create(buffer, {
      type: extension as 'woff' | 'woff2',
      hinting: true               // Keep hinting
    });

    // Write to TTF
    const ttfBuffer = font.write({
      type: 'ttf',
      hinting: true
    });

    // Write to OTF
    const otfBuffer = font.write({
      type: 'otf',
      hinting: true
    });

    // We can return both as base64 in a JSON response
    // or return a zip file. Returning base64 is easier for standard REST
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
