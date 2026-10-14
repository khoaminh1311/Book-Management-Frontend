/**
 * Shared utility functions
 */

/**
 * Extract up to 2 initials from a person or author name.
 * e.g. "Arthur Conan Doyle" -> "AD", "Plato" -> "PL"
 * @param {string} name 
 * @returns {string}
 */
export function getInitials(name = '') {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format book price as USD currency or 'Free'.
 * @param {number|string|null|undefined} price 
 * @returns {string}
 */
export function formatPrice(price) {
  const numPrice = Number(price);
  if (price === undefined || price === null || isNaN(numPrice) || numPrice === 0) {
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
 * @param {string} id 
 * @returns {string}
 */
export function getAvatarColor(id = '') {
  if (!id) return AVATAR_BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
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
  if (rawAuthor && typeof rawAuthor === 'object') {
    return {
      authorName: rawAuthor.name || 'Unknown Author',
      authorId: rawAuthor._id || '',
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
