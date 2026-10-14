import React, { useState } from 'react';
import { normalizeAuthor } from '../../utils/helpers';

/**
 * Curated editorial book cloth/binding palettes
 * Matches BookShelf's sophisticated architectural aesthetic
 */
const COVER_PALETTES = [
  {
    name: 'Midnight Navy',
    bg: 'from-[#0b1626] via-[#12233c] to-[#070e1a]',
    accentBg: 'bg-[#D4AF37]', // Warm Antique Gold
    tag: 'text-[#E6C687] bg-[#E6C687]/15',
    accentText: 'text-[#E6C687]',
    subText: 'text-slate-300',
  },
  {
    name: 'Imperial Crimson',
    bg: 'from-[#2b0f16] via-[#3d1621] to-[#1c080d]',
    accentBg: 'bg-[#F3C5A5]', // Warm Bronze Peach
    tag: 'text-[#F3C5A5] bg-[#F3C5A5]/15',
    accentText: 'text-[#F3C5A5]',
    subText: 'text-rose-200/80',
  },
  {
    name: 'Deep Emerald',
    bg: 'from-[#0a1e18] via-[#123126] to-[#061410]',
    accentBg: 'bg-[#A5D6B6]', // Sage Green
    tag: 'text-[#A5D6B6] bg-[#A5D6B6]/15',
    accentText: 'text-[#A5D6B6]',
    subText: 'text-emerald-200/80',
  },
  {
    name: 'Antique Espresso',
    bg: 'from-[#231610] via-[#332018] to-[#170e0a]',
    accentBg: 'bg-[#E6BA95]', // Warm Bronze
    tag: 'text-[#E6BA95] bg-[#E6BA95]/15',
    accentText: 'text-[#E6BA95]',
    subText: 'text-amber-200/80',
  },
  {
    name: 'Royal Plum',
    bg: 'from-[#1e1329] via-[#2c1c3c] to-[#140b1c]',
    accentBg: 'bg-[#DBB5EE]', // Lilac Silver
    tag: 'text-[#DBB5EE] bg-[#DBB5EE]/15',
    accentText: 'text-[#DBB5EE]',
    subText: 'text-purple-200/80',
  },
  {
    name: 'Oxford Charcoal',
    bg: 'from-[#141820] via-[#1e2430] to-[#0d1015]',
    accentBg: 'bg-[#9BB8DE]', // Slate Blue
    tag: 'text-[#9BB8DE] bg-[#9BB8DE]/15',
    accentText: 'text-[#9BB8DE]',
    subText: 'text-slate-300/80',
  },
];

/**
 * Deterministically pick an editorial palette based on book metadata
 */
function getPalette(title = '', genre = '', id = '') {
  const seed = `${title}_${genre}_${id}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COVER_PALETTES.length;
  return COVER_PALETTES[index];
}

/**
 * BookCover Component
 * Renders cover image with smooth zoom transition, OR an elegant dynamic
 * editorial folio cover if image is missing or fails to load.
 *
 * @param {Object} props
 * @param {Object} props.book - Book entity { title, coverImage, author, genre, publishedYear, _id }
 * @param {string} [props.size='md'] - 'sm' | 'md' | 'lg'
 * @param {string} [props.className=''] - Extra classes for the container
 * @param {string} [props.imgClassName=''] - Extra classes for the img tag
 */
export default function BookCover({
  book = {},
  size = 'md',
  className = '',
  imgClassName = '',
}) {
  const [imgError, setImgError] = useState(false);

  const title = book.title || 'Untitled Volume';
  const { authorName } = normalizeAuthor(book.author);
  const genre = book.genre || 'Folio';
  const year = book.publishedYear || '—';
  const bookId = book._id || '';
  const archivalCode = bookId ? bookId.slice(-4).toUpperCase() : 'FOLIO';

  const hasValidImage = Boolean(book.coverImage && book.coverImage.trim()) && !imgError;
  const palette = getPalette(title, genre, bookId);

  // If valid cover image URL is available and hasn't errored
  if (hasValidImage) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-surface-container ${className}`}>
        <img
          src={book.coverImage}
          alt={title}
          className={`w-full h-full object-cover ${imgClassName}`}
          onError={() => setImgError(true)}
        />
        {/* Subtle spine ridge overlay for physical book depth */}
        <div className="absolute inset-y-0 left-0 w-2.5 sm:w-3.5 bg-gradient-to-r from-black/30 via-white/5 to-transparent pointer-events-none" />
      </div>
    );
  }

  // Otherwise, render Dynamic Editorial Folio Cover
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden bg-gradient-to-br ${palette.bg} text-white flex flex-col justify-between border border-white/10 ${className} ${
        isLarge ? 'p-6 sm:p-7' : isSmall ? 'p-2.5' : 'p-3.5 sm:p-4'
      }`}
    >
      {/* Ambient Lighting Gradients */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/[0.06] blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-black/40 blur-xl pointer-events-none" />

      {/* 3D Physical Spine Simulation */}
      <div className="absolute inset-y-0 left-0 w-2.5 sm:w-3.5 bg-gradient-to-r from-black/50 via-white/10 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 left-[7px] sm:left-[9px] w-[1px] bg-white/15 pointer-events-none" />

      {/* Top Header Row (pr-16 to leave breathing room for floating badges) */}
      <div className="relative z-10 flex items-center justify-between gap-1 pl-1.5 sm:pl-2 pr-16 sm:pr-20">
        <span
          className={`font-sans font-semibold uppercase tracking-[0.12em] ${
            isLarge
              ? 'text-[11px] sm:text-xs'
              : isSmall
              ? 'text-[8px]'
              : 'text-[9px] sm:text-[10px]'
          } ${palette.accentText}`}
        >
          {isLarge ? `FOLIO · ${genre.toUpperCase()}` : 'FOLIO'}
        </span>
      </div>

      {/* Center: Book Title (Newsreader Typography) */}
      <div className="relative z-10 flex flex-col my-auto py-2 pl-1.5 sm:pl-2">
        <h3
          className={`font-serif font-medium tracking-tight text-white ${
            isLarge
              ? 'text-2xl sm:text-[28px] lg:text-[32px] leading-tight line-clamp-4'
              : isSmall
              ? 'text-[12px] leading-tight line-clamp-2'
              : 'text-[15px] sm:text-[17px] leading-[1.3] line-clamp-3'
          }`}
          title={title}
        >
          {title}
        </h3>
        {/* Editorial Accent Bar */}
        <div
          className={`mt-2 rounded-full ${palette.accentBg} ${
            isLarge ? 'w-8 h-[2.5px]' : 'w-6 h-[2px]'
          }`}
        />
      </div>

      {/* Bottom Footer: Author & Folio Catalog Info */}
      <div className="relative z-10 flex flex-col gap-0.5 pt-1 pl-1.5 sm:pl-2">
        <p
          className={`font-sans font-semibold tracking-wide text-white truncate ${
            isLarge
              ? 'text-sm sm:text-base'
              : isSmall
              ? 'text-[10px]'
              : 'text-[11px] sm:text-xs'
          }`}
          title={authorName}
        >
          {authorName}
        </p>
        <span
          className={`font-sans tracking-wider uppercase opacity-60 ${
            isLarge
              ? 'text-[11px] sm:text-xs'
              : isSmall
              ? 'text-[8px]'
              : 'text-[9px] sm:text-[10px]'
          }`}
        >
          {year !== '—' ? `EST. ${year} · ` : ''}VOL. {archivalCode}
        </span>
      </div>
    </div>
  );
}
