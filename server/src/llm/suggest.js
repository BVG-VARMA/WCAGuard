import dotenv from 'dotenv';
dotenv.config();

export const AI_DISCLOSURE_NOTICE =
  'NOTICE: When AI suggestions are enabled, element snippets (URLs, image tags, context) are sent to an external AI model. AI-generated text is never certified and always requires human review.';

export async function suggestAltText({ src = '', context = '' }, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (options.enableAi && apiKey) {
    try {
      if (process.env.GEMINI_API_KEY) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Suggest a concise, informative, WCAG-compliant alt text (under 15 words) for an image element with src "${src}" and context "${context}". Return ONLY the alt text string, with no quotes.`
              }]
            }]
          })
        });
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            return {
              suggestion: text,
              source: 'AI (Gemini)',
              status: 'NEEDS_REVIEW',
              confidence: 0.85,
              disclosure: AI_DISCLOSURE_NOTICE
            };
          }
        }
      }
    } catch {
      // Fallback on network or key issues
    }
  }

  let fallback = 'Illustration content';
  if (src) {
    const filename = src.split('/').pop().split('?')[0].replace(/\.[^/.]+$/, '');
    const readable = filename.replace(/[-_]/g, ' ').trim();
    if (readable && readable.length > 2) {
      fallback = readable.charAt(0).toUpperCase() + readable.slice(1);
    }
  }

  return {
    suggestion: fallback,
    source: 'Heuristic Rule',
    status: 'NEEDS_REVIEW',
    confidence: 0.80,
    disclosure: AI_DISCLOSURE_NOTICE
  };
}

export async function suggestLinkName({ href = '', context = '' }, options = {}) {
  let fallback = 'Learn more details';
  if (href) {
    const clean = href.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const segment = clean.split('/').pop();
    if (segment) {
      const readable = segment.replace(/[-_]/g, ' ').trim();
      if (readable) fallback = `Visit ${readable}`;
    }
  }

  return {
    suggestion: fallback,
    source: 'Heuristic Rule',
    status: 'NEEDS_REVIEW',
    confidence: 0.82,
    disclosure: AI_DISCLOSURE_NOTICE
  };
}
