import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

function formatJSON(text: string, indent: number = 2): string {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, indent);
  } catch {
    throw new Error('Invalid JSON');
  }
}

function minifyJSON(text: string): string {
  const parsed = JSON.parse(text);
  return JSON.stringify(parsed);
}

function formatXML(text: string): string {
  let formatted = '';
  let indent = 0;
  const lines = text.replace(/>\s*</g, '><').split(/(<[^>]+>)/);

  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.match(/^<\/\w/)) indent--;
    formatted += '  '.repeat(Math.max(0, indent)) + line + '\n';
    if (line.match(/^<\w[^>]*[^\/]>$/)) indent++;
  }
  return formatted.trim();
}

function base64Encode(text: string): string {
  return Buffer.from(text).toString('base64');
}

function base64Decode(text: string): string {
  return Buffer.from(text, 'base64').toString('utf-8');
}

function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

function urlDecode(text: string): string {
  return decodeURIComponent(text);
}

function htmlEncode(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function htmlDecode(text: string): string {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent || '';
}

function hashText(text: string, algorithm: string): string {
  return crypto.createHash(algorithm).update(text).digest('hex');
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function generatePassword(length: number = 16, options: { uppercase?: boolean; lowercase?: boolean; numbers?: boolean; symbols?: boolean } = {}): string {
  const { uppercase = true, lowercase = true, numbers = true, symbols = true } = options;
  let chars = '';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const text = formData.get('text') as string;
    const action = (formData.get('action') as string) || 'json-format';

    if (!text && action !== 'uuid' && action !== 'password') {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    switch (action) {
      case 'json-format': {
        const indent = parseInt(formData.get('indent') as string) || 2;
        return NextResponse.json({ success: true, result: formatJSON(text, indent) });
      }
      case 'json-minify': {
        return NextResponse.json({ success: true, result: minifyJSON(text) });
      }
      case 'json-validate': {
        try {
          JSON.parse(text);
          return NextResponse.json({ success: true, valid: true, message: 'Valid JSON' });
        } catch (e) {
          return NextResponse.json({ success: true, valid: false, message: (e as Error).message });
        }
      }
      case 'xml-format': {
        return NextResponse.json({ success: true, result: formatXML(text) });
      }
      case 'base64-encode': {
        return NextResponse.json({ success: true, result: base64Encode(text) });
      }
      case 'base64-decode': {
        return NextResponse.json({ success: true, result: base64Decode(text) });
      }
      case 'url-encode': {
        return NextResponse.json({ success: true, result: urlEncode(text) });
      }
      case 'url-decode': {
        return NextResponse.json({ success: true, result: urlDecode(text) });
      }
      case 'html-encode': {
        return NextResponse.json({ success: true, result: htmlEncode(text) });
      }
      case 'html-decode': {
        return NextResponse.json({ success: true, result: text });
      }
      case 'hash': {
        const algo = (formData.get('algorithm') as string) || 'sha256';
        return NextResponse.json({
          success: true,
          md5: hashText(text, 'md5'),
          sha1: hashText(text, 'sha1'),
          sha256: hashText(text, 'sha256'),
          sha512: hashText(text, 'sha512')
        });
      }
      case 'uuid': {
        const count = parseInt(text || '1');
        const uuids = Array.from({ length: Math.min(count, 50) }, () => generateUUID());
        return NextResponse.json({ success: true, result: uuids.join('\n') });
      }
      case 'password': {
        const length = parseInt(formData.get('length') as string) || 16;
        const count = parseInt(formData.get('count') as string) || 5;
        const passwords = Array.from({ length: Math.min(count, 20) }, () => generatePassword(length));
        return NextResponse.json({ success: true, result: passwords.join('\n') });
      }
      case 'markdown-html': {
        let html = text
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^# (.+)$/gm, '<h1>$1</h1>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code>$1</code>')
          .replace(/^- (.+)$/gm, '<li>$1</li>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>');
        html = '<p>' + html + '</p>';
        return NextResponse.json({ success: true, result: html });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to process', details: errorMessage }, { status: 500 });
  }
}
