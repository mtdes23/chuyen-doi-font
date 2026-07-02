import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const action = (formData.get('action') as string) || 'palette';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    switch (action) {
      case 'palette': {
        const { data: rawData, info } = await sharp(inputBuffer)
          .resize(100, 100, { fit: 'inside' })
          .raw()
          .toBuffer({ resolveWithObject: true });

        const channels = info.channels;
        const colorCounts: Record<string, number> = {};
        const step = channels;

        for (let i = 0; i < rawData.length; i += step * 10) {
          const r = rawData[i];
          const g = rawData[i + 1];
          const b = rawData[i + 2];
          const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
          colorCounts[key] = (colorCounts[key] || 0) + 1;
        }

        const sorted = Object.entries(colorCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([color]) => {
            const [r, g, b] = color.split(',').map(Number);
            const hex = '#' + [r, g, b].map(c => Math.min(255, c).toString(16).padStart(2, '0')).join('');
            return { hex, rgb: { r, g, b } };
          });

        return NextResponse.json({ success: true, colors: sorted });
      }

      case 'grayscale': {
        const output = await sharp(inputBuffer).grayscale().toBuffer();
        return NextResponse.json({ success: true, data: output.toString('base64') });
      }

      case 'sepia': {
        const output = await sharp(inputBuffer)
          .modulate({ brightness: 1.1 })
          .tint({ r: 255, g: 230, b: 190 })
          .toBuffer();
        return NextResponse.json({ success: true, data: output.toString('base64') });
      }

      case 'vintage': {
        const output = await sharp(inputBuffer)
          .modulate({ brightness: 0.9, saturation: 0.6 })
          .tint({ r: 240, g: 220, b: 180 })
          .toBuffer();
        return NextResponse.json({ success: true, data: output.toString('base64') });
      }

      case 'dramatic': {
        const output = await sharp(inputBuffer)
          .modulate({ brightness: 0.85, saturation: 1.4 })
          .sharpen({ sigma: 1.5 })
          .toBuffer();
        return NextResponse.json({ success: true, data: output.toString('base64') });
      }

      case 'invert': {
        const output = await sharp(inputBuffer).negate().toBuffer();
        return NextResponse.json({ success: true, data: output.toString('base64') });
      }

      case 'emboss': {
        const output = await sharp(inputBuffer)
          .convolve({
            width: 3,
            height: 3,
            kernel: [-2, -1, 0, -1, 1, 1, 0, 1, 2]
          })
          .toBuffer();
        return NextResponse.json({ success: true, data: output.toString('base64') });
      }

      case 'edge': {
        const output = await sharp(inputBuffer)
          .greyscale()
          .convolve({
            width: 3,
            height: 3,
            kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
          })
          .toBuffer();
        return NextResponse.json({ success: true, data: output.toString('base64') });
      }

      case 'pixelate': {
        const size = parseInt(formData.get('size') as string) || 8;
        const metadata = await sharp(inputBuffer).metadata();
        const w = metadata.width || 800;
        const h = metadata.height || 600;
        const output = await sharp(inputBuffer)
          .resize(Math.ceil(w / size), Math.ceil(h / size), { kernel: 'nearest' })
          .resize(w, h, { kernel: 'nearest' })
          .toBuffer();
        return NextResponse.json({ success: true, data: output.toString('base64') });
      }

      case 'blur-art': {
        const sigma = parseInt(formData.get('sigma') as string) || 8;
        const output = await sharp(inputBuffer).blur(sigma).toBuffer();
        return NextResponse.json({ success: true, data: output.toString('base64') });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to process image', details: errorMessage }, { status: 500 });
  }
}
