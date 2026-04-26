/**
 * Content Filter Module
 * Blocks slurs, sexual content, hate speech, and URLs.
 * Uses leetspeak normalization and space-stripping to catch evasions.
 */

// ============================================================
// BLOCKED WORD LISTS
// ============================================================
// NOTE: These are intentionally abbreviated/hashed where possible.
// In production, load from a separate file or database.

const SLURS_AND_HATE = [
  'nigger', 'nigga', 'nigg3r', 'n1gger', 'n1gga', 'negro', 'negr0',
  'faggot', 'fag', 'f4g', 'f4ggot', 'dyke', 'tranny',
  'chink', 'ch1nk', 'gook', 'g00k', 'spic', 'sp1c', 'wetback',
  'kike', 'k1ke', 'beaner', 'towelhead', 'sandnigger',
  'retard', 'retarded', 'r3tard',
  'coon', 'c00n', 'darkie', 'paki', 'pak1',
];

const SEXUAL_TERMS = [
  'sex', 's3x', 'porn', 'p0rn', 'pornhub', 'xvideos', 'xnxx',
  'hentai', 'h3ntai', 'nude', 'nud3', 'nudes', 'naked',
  'dick', 'd1ck', 'cock', 'c0ck', 'penis', 'p3nis',
  'pussy', 'pu55y', 'vagina', 'vag1na', 'cunt', 'c*nt',
  'boobs', 'b00bs', 'tits', 't1ts', 'titties',
  'fuck', 'fck', 'fuk', 'f*ck', 'fcking', 'fucking', 'fucker',
  'shit', 'sh1t', 'sht', 'bullshit',
  'ass', 'a55', 'asshole', 'a55hole',
  'bitch', 'b1tch', 'btch', 'whore', 'wh0re', 'slut', 'sl*t',
  'cum', 'cumming', 'jerkoff', 'jerk0ff', 'masturbat',
  'blowjob', 'bl0wjob', 'handjob', 'anal', 'an4l',
  'orgasm', '0rgasm', 'erection', 'horny', 'h0rny',
  'suck my', 'send nudes', 'show me', 'undress',
  'onlyfans', 'snapchat', 'insta',
];

const SEVERE_THREATS = [
  'kill yourself', 'kys', 'k.y.s', 'kms',
  'die', 'suicide', 'hang yourself', 'rape',
  'bomb', 'shoot', 'murder',
];

// Combine all into one set for efficient lookup
const ALL_BLOCKED = [...SLURS_AND_HATE, ...SEXUAL_TERMS, ...SEVERE_THREATS];

// ============================================================
// LEETSPEAK NORMALIZATION
// ============================================================
const LEET_MAP = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's',
  '!': 'i', '|': 'i', '+': 't',
};

function normalizeLeet(text) {
  let result = '';
  for (const char of text) {
    result += LEET_MAP[char] || char;
  }
  return result;
}

// Strip special chars/spaces between letters (catches "f u c k", "f.u.c.k", etc.)
function stripSpecialChars(text) {
  return text.replace(/[^a-zA-Z0-9]/g, '');
}

// ============================================================
// URL DETECTION
// ============================================================
const URL_REGEX = /(?:https?:\/\/|www\.|[\w-]+\.(?:com|org|net|io|gg|me|co|xyz|dev|app|link|ly|bit|discord|telegram|whatsapp|instagram|tiktok|snapchat|twitter|facebook))/i;

// ============================================================
// MAIN FILTER FUNCTION
// ============================================================

/**
 * Check if a message is clean.
 * @param {string} message - The raw message text
 * @returns {{ clean: boolean, reason?: string }}
 */
function isClean(message) {
  if (!message || typeof message !== 'string') {
    return { clean: false, reason: 'Empty message' };
  }

  // Check for URLs first
  if (URL_REGEX.test(message)) {
    return { clean: false, reason: 'Links are not allowed' };
  }

  // Normalize the message
  const lower = message.toLowerCase();
  const normalized = normalizeLeet(lower);
  const stripped = stripSpecialChars(normalized);

  // Check each blocked term
  for (const term of ALL_BLOCKED) {
    const termStripped = stripSpecialChars(term.toLowerCase());
    
    // Check in normalized text (preserves spaces — catches "send nudes")
    if (normalized.includes(term.toLowerCase())) {
      return { clean: false, reason: 'Inappropriate content' };
    }
    
    // Check in stripped text (catches "f u c k", "s.e.x", etc.)
    if (termStripped.length >= 3 && stripped.includes(termStripped)) {
      return { clean: false, reason: 'Inappropriate content' };
    }
  }

  return { clean: true };
}

module.exports = { isClean };
