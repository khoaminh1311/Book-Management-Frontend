import { describe, it, expect } from 'vitest';
import { sanitizeHtml, isValidHttpUrl } from '../sanitize';

describe('sanitize utility', () => {
  describe('sanitizeHtml', () => {
    it('returns empty string for null, undefined, or empty string', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
    });

    it('preserves allowed HTML formatting tags', () => {
      const cleanHtml =
        '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>' +
        '<blockquote>A profound literary quote.</blockquote>' +
        '<ul><li>First item</li><li>Second item</li></ul>' +
        '<ol><li>Numbered step</li></ol>' +
        '<a href="https://example.com">Source Link</a>';

      const sanitized = sanitizeHtml(cleanHtml);
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>bold</strong>');
      expect(sanitized).toContain('<em>italic</em>');
      expect(sanitized).toContain('<blockquote>A profound literary quote.</blockquote>');
      expect(sanitized).toContain('<li>First item</li>');
      expect(sanitized).toContain('href="https://example.com"');
    });

    it('strips dangerous <script> tags completely', () => {
      const maliciousHtml = '<p>Safe content</p><script>alert("xss attack")</script>';
      const sanitized = sanitizeHtml(maliciousHtml);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert(');
      expect(sanitized).toContain('Safe content');
    });

    it('strips inline event handler attributes like onerror, onclick', () => {
      const maliciousHtml =
        '<img src="invalid-image" onerror="alert(\'XSS\')" /><span onclick="stealData()">Text</span>';
      const sanitized = sanitizeHtml(maliciousHtml);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('alert');
    });

    it('removes javascript: pseudo-protocol in links', () => {
      const maliciousHtml = '<a href="javascript:alert(\'pwned\')">Click here</a>';
      const sanitized = sanitizeHtml(maliciousHtml);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert(');
    });

    // --- SECURITY EDGE CASES & ATTACK VECTORS ---

    describe('Security Edge Cases & Bypass Filters', () => {
      it('blocks obfuscated javascript protocol via HTML entities (Bypass Filter)', () => {
        const entityPayload1 = '<a href="jav&#x09;ascript:alert(\'entity-xss\')">Click me</a>';
        const entityPayload2 =
          '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;:alert(1)">Claim</a>';

        const sanitized1 = sanitizeHtml(entityPayload1);
        const sanitized2 = sanitizeHtml(entityPayload2);

        expect(sanitized1).not.toContain('alert(');
        expect(sanitized1).not.toContain('javascript:');
        expect(sanitized2).not.toContain('alert(');
        expect(sanitized2).not.toContain('javascript:');
      });

      it('blocks javascript protocol obfuscated with newline or tab characters', () => {
        const newlinePayload = '<a href="java\nscript:alert(document.cookie)">Malicious</a>';
        const sanitized = sanitizeHtml(newlinePayload);

        expect(sanitized).not.toContain('alert(');
        expect(sanitized).not.toContain('cookie');
      });

      it('blocks SVG and MathML script execution vectors (Alternative Attack Vectors)', () => {
        const svgPayload = '<svg><script>alert("svg-xss")</script></svg>';
        const svgOnloadPayload = '<svg onload="alert(\'svg-onload\')"></svg>';
        const mathPayload = '<math><mtext><script>alert("math-xss")</script></mtext></math>';

        expect(sanitizeHtml(svgPayload)).not.toContain('<script>');
        expect(sanitizeHtml(svgPayload)).not.toContain('alert(');
        expect(sanitizeHtml(svgOnloadPayload)).not.toContain('onload');
        expect(sanitizeHtml(svgOnloadPayload)).not.toContain('alert(');
        expect(sanitizeHtml(mathPayload)).not.toContain('<script>');
      });

      it('prevents DOM Clobbering by stripping disallowed id/name attributes', () => {
        const clobberPayload = '<a id="showToast" name="location" href="https://example.com">Clobber</a>';
        const sanitized = sanitizeHtml(clobberPayload);

        expect(sanitized).not.toContain('id="showToast"');
        expect(sanitized).not.toContain('name="location"');
        expect(sanitized).toContain('href="https://example.com"');
      });

      it('handles nested recursive script tags safely (<scr<script>ipt>)', () => {
        const nestedPayload = '<scr<script>ipt>alert("nested-xss")</script>';
        const sanitized = sanitizeHtml(nestedPayload);

        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('</script>');
        expect(sanitized).not.toContain('<');
      });

      it('strips unquoted event handler attributes', () => {
        const unquotedPayload = '<span class=editorial onmouseover=alert("unquoted")>Hover</span>';
        const sanitized = sanitizeHtml(unquotedPayload);

        expect(sanitized).not.toContain('onmouseover');
        expect(sanitized).not.toContain('alert(');
        expect(sanitized).toContain('Hover');
      });

      it('blocks data: URI with HTML/SVG payloads in links (False Negative Prevention)', () => {
        const dataPayload = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Dangerous Data</a>';
        const sanitized = sanitizeHtml(dataPayload);

        expect(sanitized).not.toContain('data:text/html');
        expect(sanitized).toContain('Dangerous Data');
      });

      it('preserves user mathematical comparison operators safely (False Positive Prevention)', () => {
        const mathText = '<p>Volume evaluation: 5 &lt; 10 and 10 &gt; 7. Formula: a &lt; b + c.</p>';
        const sanitized = sanitizeHtml(mathText);

        expect(sanitized).toContain('5');
        expect(sanitized).toContain('10');
        expect(sanitized).toContain('7');
      });
    });
  });

  describe('isValidHttpUrl', () => {
    it('returns true for valid http and https URLs', () => {
      expect(isValidHttpUrl('https://res.cloudinary.com/demo/image/upload/book.jpg')).toBe(true);
      expect(isValidHttpUrl('http://localhost:5000/api/books')).toBe(true);
      expect(isValidHttpUrl('https://example.com/catalog/volume-1?sort=recent')).toBe(true);
    });

    it('handles extra leading or trailing whitespace', () => {
      expect(isValidHttpUrl('   https://example.com/trimmed   ')).toBe(true);
    });

    it('returns true for URLs with complex query parameters (False Positive Prevention)', () => {
      expect(isValidHttpUrl('https://books.org/view?query=C%2B%2B&filter=price<50')).toBe(true);
      expect(isValidHttpUrl('https://example.com/api/v1?tag=sci-fi&author=H%2EG%2E+Wells')).toBe(true);
    });

    it('returns false for unsafe protocols like javascript:, data:, ftp:, file:, vbscript:, blob:', () => {
      expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
      expect(isValidHttpUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(
        false
      );
      expect(isValidHttpUrl('ftp://example.com/file.txt')).toBe(false);
      expect(isValidHttpUrl('file:///C:/Windows/System32')).toBe(false);
      expect(isValidHttpUrl('vbscript:msgbox("hello")')).toBe(false);
      expect(isValidHttpUrl('blob:https://bookshelf.internal/uuid-123')).toBe(false);
    });

    it('returns false for malformed URLs and non-string inputs', () => {
      expect(isValidHttpUrl('not-a-valid-url')).toBe(false);
      expect(isValidHttpUrl('')).toBe(false);
      expect(isValidHttpUrl('   ')).toBe(false);
      expect(isValidHttpUrl(null)).toBe(false);
      expect(isValidHttpUrl(undefined)).toBe(false);
      expect(isValidHttpUrl(12345)).toBe(false);
    });
  });
});
