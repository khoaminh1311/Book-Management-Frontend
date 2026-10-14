/**
 * Shared utility functions
 */

/**
 * Extract up to 2 initials from a person or author name.
 * Handles single names, multi-word names, hyphenated names, and defensive fallback.
 * e.g. "Arthur Conan Doyle" -> "AD", "Jean-Luc" -> "JL", "Plato" -> "PL"
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name = '') {
  if (typeof name !== 'string') return '??';
  const cleanName = name.trim();
  if (!cleanName) return '??';

  const parts = cleanName.split(/[\s-]+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format book price as USD currency or 'Free'.
 * Defensively handles currency strings with commas, negative values, and non-numeric inputs.
 * @param {number|string|null|undefined} price
 * @returns {string}
 */
export function formatPrice(price) {
  if (price === undefined || price === null || typeof price === 'boolean' || Array.isArray(price)) {
    return 'Free';
  }
  const cleanedPrice = typeof price === 'string' ? price.replace(/,/g, '').trim() : price;
  const numPrice = Number(cleanedPrice);

  if (isNaN(numPrice) || !isFinite(numPrice) || numPrice <= 0 || numPrice < 0.005) {
    return 'Free';
  }
  return `$${numPrice.toFixed(2)}`;
}

/**
 * Color palette for author avatar initials matching Figma #1:226, #1:251, #1:276
 */
export const AVATAR_BG_COLORS = [
  'bg-[#D5E3FC] text-[#091426]',
  'bg-[#FFD9B0] text-[#745939]',
  'bg-[#BCC7DE] text-[#091426]',
  'bg-[#E4C099] text-[#745939]',
  'bg-[#E9E8E6] text-[#091426]',
  'bg-[#C5E8D8] text-[#1E523A]',
];

/**
 * Deterministically get an avatar background color class by author ID.
 * Defensively extracts author ID from objects and strings.
 * @param {string|object} id
 * @returns {string}
 */
export function getAvatarColor(id = '') {
  let targetId = '';
  if (typeof id === 'string') {
    targetId = id.trim();
  } else if (id && typeof id === 'object' && !Array.isArray(id)) {
    targetId =
      typeof id._id === 'string'
        ? id._id.trim()
        : typeof id.id === 'string'
          ? id.id.trim()
          : '';
  } else if (id !== null && id !== undefined && typeof id !== 'symbol') {
    targetId = String(id).trim();
  }

  if (!targetId || targetId === '[object Object]') return AVATAR_BG_COLORS[0];

  let hash = 0;
  for (let i = 0; i < targetId.length; i++) {
    hash = (hash << 5) - hash + targetId.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[idx];
}

/**
 * Normalize author representation across books (object, string ID, or name).
 * @param {Object|string|null|undefined} rawAuthor
 * @returns {{ authorName: string, authorId: string }}
 */
export function normalizeAuthor(rawAuthor) {
  if (rawAuthor && typeof rawAuthor === 'object' && !Array.isArray(rawAuthor)) {
    const authorName =
      typeof rawAuthor.name === 'string' && rawAuthor.name.trim()
        ? rawAuthor.name.trim()
        : 'Unknown Author';
    const authorId =
      typeof rawAuthor._id === 'string' && rawAuthor._id.trim() ? rawAuthor._id.trim() : '';

    return {
      authorName,
      authorId,
    };
  }
  if (typeof rawAuthor === 'string' && rawAuthor.trim()) {
    const trimmed = rawAuthor.trim();
    const isId = /^[0-9a-fA-F]{24}$/.test(trimmed);
    return {
      authorName: isId ? 'Referenced Author' : trimmed,
      authorId: isId ? trimmed : '',
    };
  }
  return {
    authorName: 'Unknown Author',
    authorId: '',
  };
}
