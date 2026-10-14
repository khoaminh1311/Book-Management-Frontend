import DOMPurify from 'dompurify';

export const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'b',
    'strong',
    'i',
    'em',
    's',
    'strike',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'br',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
};

/**
 * Sanitize rich text HTML to prevent XSS attacks while preserving legitimate formatting.
 * Works seamlessly in browser and test/SSR environments.
 * @param {string} dirty - Untrusted HTML string.
 * @returns {string} Sanitized HTML string.
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';

  try {
    let sanitizer = null;
    if (typeof DOMPurify?.sanitize === 'function') {
      sanitizer = DOMPurify;
    } else if (typeof window !== 'undefined' && typeof DOMPurify === 'function') {
      sanitizer = DOMPurify(window);
    }

    if (sanitizer && typeof sanitizer.sanitize === 'function') {
      return sanitizer.sanitize(dirty, SANITIZE_CONFIG);
    }
  } catch (err) {
    console.error('DOMPurify sanitization error:', err);
  }

  // Fallback basic sanitization for non-browser / non-DOM environments
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
}

/**
 * Validates whether a given URL string is a safe HTTP/HTTPS URL.
 * Rejects javascript:, data:, file:, and other unsafe protocols.
 * @param {string} urlString
 * @returns {boolean}
 */
export function isValidHttpUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}
