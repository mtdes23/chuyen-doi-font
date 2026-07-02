import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const action = (formData.get('action') as string) || 'resize';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';

    let outputBuffer: Buffer;
    let outputFormat = ext;

    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    switch (action) {
      case 'resize': {
        const width = parseInt(formData.get('width') as string) || 800;
        const height = parseInt(formData.get('height') as string) || 600;
        outputBuffer = await image.resize(width, height, { fit: 'inside' }).toBuffer();
        break;
      }
      case 'compress': {
        const quality = parseInt(formData.get('quality') as string) || 80;
        if (ext === 'png') {
          outputBuffer = await image.png({ quality, compressionLevel: 9 }).toBuffer();
        } else if (ext === 'webp') {
          outputBuffer = await image.webp({ quality }).toBuffer();
          outputFormat = 'webp';
        } else {
          outputBuffer = await image.jpeg({ quality }).toBuffer();
          outputFormat = 'jpg';
        }
        break;
      }
      case 'convert': {
        const format = (formData.get('format') as string) || 'png';
        const quality = parseInt(formData.get('quality') as string) || 80;
        switch (format) {
          case 'png':
            outputBuffer = await image.png({ quality }).toBuffer();
            break;
          case 'jpeg':
          case 'jpg':
            outputBuffer = await image.jpeg({ quality }).toBuffer();
            outputFormat = 'jpg';
            break;
          case 'webp':
            outputBuffer = await image.webp({ quality }).toBuffer();
            outputFormat = 'webp';
            break;
          case 'avif':
            outputBuffer = await image.avif({ quality }).toBuffer();
            outputFormat = 'avif';
            break;
          default:
            outputBuffer = await image.png().toBuffer();
        }
        break;
      }
      case 'sharpen': {
        outputBuffer = await image.sharpen({ sigma: 1.5 }).toBuffer();
        break;
      }
      case 'grayscale': {
        outputBuffer = await image.grayscale().toBuffer();
        break;
      }
      case 'blur': {
        const sigma = parseInt(formData.get('sigma') as string) || 5;
        outputBuffer = await image.blur(sigma).toBuffer();
        break;
      }
      case 'upscale': {
        const scale = parseInt(formData.get('scale') as string) || 2;
        const width = (metadata.width || 800) * scale;
        const height = (metadata.height || 600) * scale;
        outputBuffer = await image.resize(width, height, { kernel: 'lanczos3' }).toBuffer();
        break;
      }
      case 'denoise': {
        outputBuffer = await image.sharpen({ sigma: 0.5 }).toBuffer();
        break;
      }
      case 'enhance': {
        outputBuffer = await image
          .sharpen({ sigma: 0.8 })
          .modulate({ brightness: 1.05 })
          .toBuffer();
        break;
      }
      default:
        outputBuffer = await image.toBuffer();
    }

    const base64 = outputBuffer.toString('base64');
    const originalSize = inputBuffer.length;
    const processedSize = outputBuffer.length;

    return NextResponse.json({
      success: true,
      originalName: file.name,
      action,
      originalSize,
      processedSize,
      format: outputFormat,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      },
      data: base64
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to process image', details: errorMessage }, { status: 500 });
  }
}
