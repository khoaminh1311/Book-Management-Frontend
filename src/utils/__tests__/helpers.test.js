import { describe, it, expect } from 'vitest';
import {
  getInitials,
  formatPrice,
  getAvatarColor,
  normalizeAuthor,
  AVATAR_BG_COLORS,
} from '../helpers';

describe('helpers utility', () => {
  describe('getInitials', () => {
    it('returns up to 2 initials for multi-word names', () => {
      expect(getInitials('Arthur Conan Doyle')).toBe('AD');
      expect(getInitials('Jane Austen')).toBe('JA');
      expect(getInitials('George R. R. Martin')).toBe('GM');
    });

    it('returns first 2 letters for single-word names', () => {
      expect(getInitials('Plato')).toBe('PL');
      expect(getInitials('Homer')).toBe('HO');
      expect(getInitials('A')).toBe('A');
    });

    it('handles lowercase names by converting to uppercase', () => {
      expect(getInitials('george orwell')).toBe('GO');
      expect(getInitials('aristotle')).toBe('AR');
    });

    it('handles extra leading, trailing, and middle whitespace', () => {
      expect(getInitials('   Leo    Tolstoy   ')).toBe('LT');
    });

    it('returns default placeholder "??" for empty or missing names', () => {
      expect(getInitials('')).toBe('??');
      expect(getInitials(null)).toBe('??');
      expect(getInitials(undefined)).toBe('??');
    });

    describe('Unicode & Non-ASCII edge cases', () => {
      it('handles Vietnamese accented characters properly', () => {
        expect(getInitials('Nguyễn Nhật Ánh')).toBe('NÁ');
        expect(getInitials('Đỗ Nam Trung')).toBe('ĐT');
        expect(getInitials('Ánh')).toBe('ÁN');
      });

      it('handles hyphenated names (compound given/family names)', () => {
        expect(getInitials('Jean-Luc')).toBe('JL');
        expect(getInitials('Jean-Luc Godard')).toBe('JG');
        expect(getInitials('Mary-Jane Watson')).toBe('MW');
      });
    });

    describe('Defensive programming & type coercion', () => {
      it('handles whitespace-only strings safely returning "??"', () => {
        expect(getInitials('   ')).toBe('??');
        expect(getInitials('\t\n  ')).toBe('??');
      });

      it('safely handles non-string inputs without throwing TypeError', () => {
        expect(getInitials(12345)).toBe('??');
        expect(getInitials(true)).toBe('??');
        expect(getInitials({})).toBe('??');
        expect(getInitials(['Author', 'Name'])).toBe('??');
      });
    });
  });

  describe('formatPrice', () => {
    it('formats numeric prices as USD currency with 2 decimals', () => {
      expect(formatPrice(34.5)).toBe('$34.50');
      expect(formatPrice(19.99)).toBe('$19.99');
      expect(formatPrice(5)).toBe('$5.00');
    });

    it('formats string numbers correctly', () => {
      expect(formatPrice('24.95')).toBe('$24.95');
      expect(formatPrice('100')).toBe('$100.00');
    });

    it('returns "Free" for zero values', () => {
      expect(formatPrice(0)).toBe('Free');
      expect(formatPrice('0')).toBe('Free');
      expect(formatPrice('0.00')).toBe('Free');
    });

    it('returns "Free" for null, undefined, or NaN inputs', () => {
      expect(formatPrice(null)).toBe('Free');
      expect(formatPrice(undefined)).toBe('Free');
      expect(formatPrice('invalid')).toBe('Free');
      expect(formatPrice(NaN)).toBe('Free');
    });

    describe('Numeric & Float Edge Cases', () => {
      it('returns "Free" for negative prices to protect catalog integrity', () => {
        expect(formatPrice(-15)).toBe('Free');
        expect(formatPrice('-20.50')).toBe('Free');
      });

      it('handles comma-separated thousand format strings without reverting to Free', () => {
        expect(formatPrice('1,000')).toBe('$1000.00');
        expect(formatPrice('1,250.50')).toBe('$1250.50');
      });

      it('handles sub-cent values and rounding accurately', () => {
        expect(formatPrice(0.004)).toBe('Free');
        expect(formatPrice(0.005)).toBe('$0.01');
      });

      it('handles floating point arithmetic precision (0.1 + 0.2)', () => {
        expect(formatPrice(0.1 + 0.2)).toBe('$0.30');
      });

      it('returns "Free" for Infinity and -Infinity', () => {
        expect(formatPrice(Infinity)).toBe('Free');
        expect(formatPrice(-Infinity)).toBe('Free');
      });
    });

    describe('Defensive type coercion', () => {
      it('safely handles boolean and array inputs without coerced conversion', () => {
        expect(formatPrice(true)).toBe('Free');
        expect(formatPrice(false)).toBe('Free');
        expect(formatPrice([])).toBe('Free');
        expect(formatPrice([10])).toBe('Free');
        expect(formatPrice({})).toBe('Free');
      });
    });
  });

  describe('getAvatarColor', () => {
    it('returns a deterministic color class for the same author ID', () => {
      const color1 = getAvatarColor('auth-12345');
      const color2 = getAvatarColor('auth-12345');
      expect(color1).toBe(color2);
      expect(AVATAR_BG_COLORS).toContain(color1);
    });

    it('returns the default first color for empty or falsy ID', () => {
      expect(getAvatarColor('')).toBe(AVATAR_BG_COLORS[0]);
      expect(getAvatarColor(null)).toBe(AVATAR_BG_COLORS[0]);
      expect(getAvatarColor(undefined)).toBe(AVATAR_BG_COLORS[0]);
    });

    it('produces valid classes present in AVATAR_BG_COLORS', () => {
      const testIds = ['id_abc', 'id_xyz', '60d0fe4f5311236168a109ca', 'author-999'];
      testIds.forEach((id) => {
        expect(AVATAR_BG_COLORS).toContain(getAvatarColor(id));
      });
    });

    describe('Defensive extraction & type handling', () => {
      it('defensively extracts ID from author object without crashing', () => {
        const color = getAvatarColor({ _id: '507f1f77bcf86cd799439011' });
        expect(AVATAR_BG_COLORS).toContain(color);

        const colorId = getAvatarColor({ id: 'author-custom-id' });
        expect(AVATAR_BG_COLORS).toContain(colorId);
      });

      it('safely handles numbers and empty object without crashing', () => {
        expect(AVATAR_BG_COLORS).toContain(getAvatarColor(12345));
        expect(getAvatarColor({})).toBe(AVATAR_BG_COLORS[0]);
      });
    });
  });

  describe('normalizeAuthor', () => {
    it('normalizes author populated object correctly', () => {
      const authorObj = {
        _id: '507f1f77bcf86cd799439011',
        name: 'George Orwell',
      };
      expect(normalizeAuthor(authorObj)).toEqual({
        authorName: 'George Orwell',
        authorId: '507f1f77bcf86cd799439011',
      });
    });

    it('falls back to "Unknown Author" if author object lacks name', () => {
      const authorObj = { _id: '507f1f77bcf86cd799439011' };
      expect(normalizeAuthor(authorObj)).toEqual({
        authorName: 'Unknown Author',
        authorId: '507f1f77bcf86cd799439011',
      });
    });

    it('identifies valid 24-character hex ObjectId string', () => {
      const validObjectId = '507f1f77bcf86cd799439011';
      expect(normalizeAuthor(validObjectId)).toEqual({
        authorName: 'Referenced Author',
        authorId: validObjectId,
      });
    });

    it('treats regular non-ObjectId string as author name', () => {
      expect(normalizeAuthor('Virginia Woolf')).toEqual({
        authorName: 'Virginia Woolf',
        authorId: '',
      });
      expect(normalizeAuthor('  Franz Kafka  ')).toEqual({
        authorName: 'Franz Kafka',
        authorId: '',
      });
    });

    it('handles null, undefined, or empty string gracefully', () => {
      expect(normalizeAuthor(null)).toEqual({
        authorName: 'Unknown Author',
        authorId: '',
      });
      expect(normalizeAuthor(undefined)).toEqual({
        authorName: 'Unknown Author',
        authorId: '',
      });
      expect(normalizeAuthor('')).toEqual({
        authorName: 'Unknown Author',
        authorId: '',
      });
    });

    describe('MongoDB ObjectId False-Positives', () => {
      it('rejects 24-char string containing non-hex characters as ObjectId', () => {
        const nonHexId = '507f1f77bcf86cd79943901z'; // 'z' is not hex
        expect(normalizeAuthor(nonHexId)).toEqual({
          authorName: nonHexId,
          authorId: '',
        });

        const allZ = 'ZZZZZZZZZZZZZZZZZZZZZZZZ';
        expect(normalizeAuthor(allZ)).toEqual({
          authorName: allZ,
          authorId: '',
        });
      });

      it('rejects hex strings with length different from 24', () => {
        const shortHex = '507f1f77bcf86cd7994390'; // 22 chars
        expect(normalizeAuthor(shortHex)).toEqual({
          authorName: shortHex,
          authorId: '',
        });

        const longHex = '507f1f77bcf86cd799439011aa'; // 26 chars
        expect(normalizeAuthor(longHex)).toEqual({
          authorName: longHex,
          authorId: '',
        });
      });
    });

    describe('Defensive object & coercion handling', () => {
      it('trims whitespace and falls back if object name is whitespace only', () => {
        expect(normalizeAuthor({ name: '   ', _id: '507f1f77bcf86cd799439011' })).toEqual({
          authorName: 'Unknown Author',
          authorId: '507f1f77bcf86cd799439011',
        });
      });

      it('handles empty object, arrays, and numeric inputs safely', () => {
        expect(normalizeAuthor({})).toEqual({
          authorName: 'Unknown Author',
          authorId: '',
        });
        expect(normalizeAuthor(['Author Name'])).toEqual({
          authorName: 'Unknown Author',
          authorId: '',
        });
        expect(normalizeAuthor(12345)).toEqual({
          authorName: 'Unknown Author',
          authorId: '',
        });
      });
    });
  });
});
