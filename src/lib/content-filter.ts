// src/lib/content-filter.ts

// ─── Blocked Words ───────────────────────────────────────

const BLOCKED_WORDS_EN = [
  'spam', 'scam', 'fake', 'counterfeit', 'phishing',
  'hack', 'crack', 'warez', 'torrent',
  'xxx', 'porn', 'adult', 'nsfw',
];

const BLOCKED_WORDS_TH = [
  'spam', 'หลอกลวง', 'ของปลอม', 'โกง',
  'มิจฉาชีพ', 'หลอก', 'ลวง',
];

const BLOCKED_WORDS = [...BLOCKED_WORDS_EN, ...BLOCKED_WORDS_TH];

// ─── Suspicious Patterns ─────────────────────────────────

const SUSPICIOUS_PATTERNS = [
  /free\s*money/i,
  /click\s*here/i,
  /100%\s*guaranteed/i,
  /act\s*now/i,
  /limited\s*time\s*offer/i,
  /buy\s*now/i,
  /earn\s*money/i,
  /work\s*from\s*home/i,
  /make\s*\$\d+/i,
  /whatsapp\s*:\s*\+?\d+/i,
  /telegram\s*:\s*@?\w+/i,
];

// ─── URL Patterns ────────────────────────────────────────

const SUSPICIOUS_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  't.co',
  'is.gd',
  'v.gd',
];

// ─── Content Check Result ────────────────────────────────

export interface ContentCheckResult {
  approved: boolean;
  flags: string[];
  score: number; // 0-1, higher = more suspicious
}

// ─── Check Text Content ──────────────────────────────────

export function checkContent(text: string): ContentCheckResult {
  const flags: string[] = [];
  let score = 0;

  if (!text) {
    return { approved: true, flags: [], score: 0 };
  }

  const lowerText = text.toLowerCase();

  // Check blocked words
  for (const word of BLOCKED_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      flags.push(`blocked_word:${word}`);
      score += 0.5;
    }
  }

  // Check suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      flags.push(`suspicious_pattern:${pattern.source.slice(0, 30)}`);
      score += 0.3;
    }
  }

  // Check for excessive caps (more than 70% uppercase)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 10) {
    flags.push('excessive_caps');
    score += 0.2;
  }

  // Check for excessive special characters
  const specialRatio = (text.match(/[!@#$%^&*()]{2,}/g) || []).length;
  if (specialRatio > 2) {
    flags.push('excessive_special_chars');
    score += 0.15;
  }

  // Check for repeated characters
  if (/(.)\1{4,}/.test(text)) {
    flags.push('repeated_chars');
    score += 0.1;
  }

  // Check for URLs in text
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlPattern);
  if (urls && urls.length > 3) {
    flags.push('too_many_urls');
    score += 0.2;
  }

  return {
    approved: score < 0.5,
    flags,
    score: Math.min(1, score),
  };
}

// ─── Check Deal Content ──────────────────────────────────

export function checkDealContent(deal: {
  title: string;
  description?: string | null;
  shortDescription?: string | null;
  discountText?: string;
  conditions?: string | null;
}): ContentCheckResult {
  const texts = [
    deal.title,
    deal.description,
    deal.shortDescription,
    deal.discountText,
    deal.conditions,
  ].filter(Boolean) as string[];

  const allFlags: string[] = [];
  let maxScore = 0;

  for (const text of texts) {
    const result = checkContent(text);
    allFlags.push(...result.flags);
    maxScore = Math.max(maxScore, result.score);
  }

  return {
    approved: maxScore < 0.5,
    flags: [...new Set(allFlags)], // Deduplicate
    score: maxScore,
  };
}

// ─── Check Shop Content ──────────────────────────────────

export function checkShopContent(shop: {
  name: string;
  description?: string | null;
  address?: string | null;
}): ContentCheckResult {
  const texts = [
    shop.name,
    shop.description,
    shop.address,
  ].filter(Boolean) as string[];

  const allFlags: string[] = [];
  let maxScore = 0;

  for (const text of texts) {
    const result = checkContent(text);
    allFlags.push(...result.flags);
    maxScore = Math.max(maxScore, result.score);
  }

  return {
    approved: maxScore < 0.5,
    flags: [...new Set(allFlags)],
    score: maxScore,
  };
}

// ─── Validate URLs ───────────────────────────────────────

export function validateUrls(urls: string[]): {
  valid: string[];
  suspicious: string[];
} {
  const valid: string[] = [];
  const suspicious: string[] = [];

  for (const url of urls) {
    if (!url) continue;

    try {
      const parsed = new URL(url);

      // Check for suspicious domains
      if (SUSPICIOUS_DOMAINS.includes(parsed.hostname)) {
        suspicious.push(url);
        continue;
      }

      // Check for non-HTTPS
      if (parsed.protocol !== 'https:') {
        suspicious.push(url);
        continue;
      }

      valid.push(url);
    } catch {
      // Invalid URL
      suspicious.push(url);
    }
  }

  return { valid, suspicious };
}

// ─── Auto-Moderation Decision ────────────────────────────

export type ModerationDecision = 'approved' | 'review' | 'rejected';

export function autoModerate(score: number): ModerationDecision {
  if (score >= 0.7) return 'rejected';
  if (score >= 0.3) return 'review';
  return 'approved';
}
