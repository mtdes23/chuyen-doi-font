import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SENTIMENT_WORDS: Record<string, number> = {
  good: 2, great: 3, excellent: 4, amazing: 4, wonderful: 4, fantastic: 4, awesome: 4,
  nice: 2, happy: 3, love: 3, best: 3, beautiful: 3, perfect: 4, brilliant: 4,
  thanks: 1, thank: 1, helpful: 2, enjoy: 2, positive: 2, success: 2, win: 2,
  bad: -2, terrible: -4, horrible: -4, awful: -4, worst: -4, hate: -3, ugly: -2,
  sad: -2, angry: -3, fail: -2, error: -2, wrong: -2, negative: -2, lose: -2,
  poor: -2, boring: -2, slow: -1, broken: -2, waste: -2, problem: -1, issue: -1,
  difficult: -1, hard: -1, confused: -1, frustrated: -2, disappointed: -2, annoying: -2
};

function analyzeSentiment(text: string): { score: number; label: string; confidence: number } {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  let score = 0;
  let matches = 0;

  for (const word of words) {
    if (SENTIMENT_WORDS[word]) {
      score += SENTIMENT_WORDS[word];
      matches++;
    }
  }

  const normalizedScore = words.length > 0 ? score / Math.sqrt(words.length) : 0;
  const confidence = Math.min(matches / Math.max(words.length, 1) * 5, 1);

  let label = 'Neutral';
  if (normalizedScore > 0.5) label = 'Positive';
  else if (normalizedScore > 1.5) label = 'Very Positive';
  else if (normalizedScore < -0.5) label = 'Negative';
  else if (normalizedScore < -1.5) label = 'Very Negative';

  return { score: Math.round(normalizedScore * 100) / 100, label, confidence: Math.round(confidence * 100) / 100 };
}

function getTextStats(text: string) {
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const lines = text.split('\n').length;
  const avgWordLength = words > 0 ? Math.round(text.replace(/\s/g, '').length / words * 10) / 10 : 0;
  const avgSentenceLength = sentences > 0 ? Math.round(words / sentences * 10) / 10 : 0;

  const wordFreq: Record<string, number> = {};
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their']);

  text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).forEach(word => {
    if (word.length > 2 && !stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const topWords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  const readingTime = Math.ceil(words / 200);
  const speakingTime = Math.ceil(words / 150);

  return {
    chars,
    charsNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    avgWordLength,
    avgSentenceLength,
    topWords,
    readingTime: `${readingTime} min`,
    speakingTime: `${speakingTime} min`
  };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const text = formData.get('text') as string;
    const action = (formData.get('action') as string) || 'stats';

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    switch (action) {
      case 'stats': {
        const stats = getTextStats(text);
        return NextResponse.json({ success: true, stats });
      }

      case 'sentiment': {
        const result = analyzeSentiment(text);
        return NextResponse.json({ success: true, sentiment: result });
      }

      case 'wordcount': {
        const stats = getTextStats(text);
        return NextResponse.json({
          success: true,
          result: {
            words: stats.words,
            characters: stats.chars,
            sentences: stats.sentences,
            paragraphs: stats.paragraphs,
            lines: stats.lines,
            readingTime: stats.readingTime,
            speakingTime: stats.speakingTime
          }
        });
      }

      case 'slugify': {
        const slug = text
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_]+/g, '-')
          .replace(/-+/g, '-');
        return NextResponse.json({ success: true, result: slug });
      }

      case 'reverse': {
        const reversed = text.split('').reverse().join('');
        return NextResponse.json({ success: true, result: reversed });
      }

      case 'uppercase': {
        return NextResponse.json({ success: true, result: text.toUpperCase() });
      }

      case 'lowercase': {
        return NextResponse.json({ success: true, result: text.toLowerCase() });
      }

      case 'capitalize': {
        const result = text.replace(/\b\w/g, c => c.toUpperCase());
        return NextResponse.json({ success: true, result });
      }

      case 'titlecase': {
        const result = text.replace(/\w\S*/g, c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase());
        return NextResponse.json({ success: true, result });
      }

      case 'remove-duplicates': {
        const lines = text.split('\n');
        const unique = [...new Set(lines)];
        return NextResponse.json({ success: true, result: unique.join('\n'), removedCount: lines.length - unique.length });
      }

      case 'sort-lines': {
        const lines = text.split('\n');
        const sorted = [...lines].sort();
        return NextResponse.json({ success: true, result: sorted.join('\n') });
      }

      case 'trim-whitespace': {
        const result = text.split('\n').map(l => l.trim()).join('\n');
        return NextResponse.json({ success: true, result });
      }

      case 'lorem': {
        const count = parseInt(formData.get('count') as string) || 5;
        const loremWords = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'];
        const sentences: string[] = [];
        for (let i = 0; i < count; i++) {
          const len = 8 + Math.floor(Math.random() * 12);
          const words: string[] = [];
          for (let j = 0; j < len; j++) {
            words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
          }
          sentences.push(words.join(' ') + '.');
        }
        return NextResponse.json({ success: true, result: sentences.join(' ') });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to process text', details: errorMessage }, { status: 500 });
  }
}
