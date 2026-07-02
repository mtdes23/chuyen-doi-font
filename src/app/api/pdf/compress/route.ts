import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const base64 = Buffer.from(compressedBytes).toString('base64');
    const originalSize = arrayBuffer.byteLength;
    const compressedSize = compressedBytes.byteLength;
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    return NextResponse.json({
      success: true,
      originalName: file.name,
      originalSize,
      compressedSize,
      compressionRatio: `${ratio}%`,
      data: base64
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to compress PDF', details: errorMessage }, { status: 500 });
  }
}
