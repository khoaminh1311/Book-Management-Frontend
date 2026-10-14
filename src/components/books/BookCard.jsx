import React from 'react';
import { Link } from 'react-router-dom';
import BookCover from './BookCover';
import { formatPrice, normalizeAuthor } from '../../utils/helpers';

/**
 * BookCard Component
 * Strict Figma Design System Specs (Frame #1:599 / EL-cd277d04):
 * - Card: p-4 (16px), rounded-2xl (16px), bg-surface-container-lowest, border border-outline-variant/40, shadow-sm
 * - Cover Container: 2/3 aspect ratio, rounded-xl (12px), overflow-hidden, relative
 * - Genre Pill: top-2.5 right-2.5, px-2.5 py-1, rounded-full, bg-white/90 backdrop-blur, text-[#45474C], Plus Jakarta Sans 600 11px
 * - Floating Overlay: backdrop-blur-[1px] bg-primary/20, pill bg-white/95 backdrop-blur-md rounded-full shadow-lg p-1.5 gap-1.5
 * - Author & Year Row: Plus Jakarta Sans SemiBold 600, 11px, tracking 0.05em, text-[#45474C]
 * - Title: Newsreader Medium 500, 20px, leading 28px, text-primary, line-clamp-1 (style_90f8f5d7)
 * - Price: Plus Jakarta Sans SemiBold 600, 16px, leading 24px, tracking -0.005em, text-primary (style_75ddd075)
 */
export default function BookCard({ book, onDelete, variant = 'default' }) {
  const { authorName, authorId } = normalizeAuthor(book.author);
  const priceFormatted = formatPrice(book.price);
  const genre = book.genre || 'General';
  const year = book.publishedYear || '—';
  const isAuthorCatalog = variant === 'author';

  return (
    <div className={`group relative bg-surface-container-lowest ${isAuthorCatalog ? 'rounded-xl' : 'rounded-xl sm:rounded-2xl'} p-3 sm:p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-outline-variant/40`}>
      {/* Book Cover Artwork (2:3 Ratio) - Figma #1:60 / EL-af3a1dd2 */}
      <div className={`relative w-full aspect-[2/3] ${isAuthorCatalog ? 'rounded-lg' : 'rounded-lg sm:rounded-xl'} overflow-hidden bg-surface-container mb-2.5 sm:mb-3.5`}>
        <div className="w-full h-full overflow-hidden select-none">
          <BookCover
            book={book}
            size="md"
            className="transition-transform duration-300 group-hover:scale-105"
            imgClassName="transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Top-Right Badge: Published Year on Author Detail (Figma #1:62 - #1:64), Genre on Dashboard (Figma #1:616) */}
        <div className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 z-10 pointer-events-none">
          {isAuthorCatalog ? (
            <span className="px-1.5 sm:px-2 py-0.5 rounded bg-white/90 backdrop-blur-[2px] text-[#091426] text-[10px] sm:text-[11px] font-semibold tracking-[0.05em] shadow-sm font-sans">
              {year}
            </span>
          ) : (
            <span className="px-1.5 sm:px-2 py-0.5 rounded bg-white/90 backdrop-blur-[2px] text-[#1A1C1B] text-[10px] sm:text-[11px] font-semibold tracking-[0.05em] shadow-sm uppercase font-sans">
              {genre}
            </span>
          )}
        </div>

        {/* Glassmorphism Floating Action Overlay (Desktop Hover, NOT on Author Detail) */}
        {!isAuthorCatalog && (
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center p-3 cursor-default">
            <div className="flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg">
              <Link
                to={`/books/${book._id}`}
                className="p-2 rounded-full text-[#45474C] hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                title="View details"
                aria-label="View details"
              >
                <span className="material-symbols-outlined text-[18px] block">visibility</span>
              </Link>
              <Link
                to={`/edit-book/${book._id}`}
                className="p-2 rounded-full text-[#45474C] hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                title="Edit volume"
                aria-label="Edit volume"
              >
                <span className="material-symbols-outlined text-[18px] block">edit</span>
              </Link>
              <button
                type="button"
                onClick={() => onDelete(book)}
                className="p-2 rounded-full text-error hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer"
                title="Delete volume"
                aria-label="Delete volume"
              >
                <span className="material-symbols-outlined text-[18px] block">delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Book Metadata (Figma #1:65 - #1:77 / EL-1519dabc) */}
      <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 justify-between">
        <div>
          {/* Top Metadata Line */}
          {isAuthorCatalog ? (
            <div className="mb-1">
              <span className="inline-block px-1.5 sm:px-2 py-0.5 rounded-full bg-[rgba(255,217,176,0.4)] text-[#745939] text-[10px] sm:text-[11px] font-semibold tracking-[0.05em] uppercase font-sans">
                {genre}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[#45474C] text-[10px] sm:text-[11px] font-semibold tracking-[0.05em] mb-1 font-sans">
              <span className="truncate pr-1.5">
                {authorId ? (
                  <Link to={`/authors/${authorId}`} className="hover:text-primary hover:underline transition-colors">
                    {authorName}
                  </Link>
                ) : (
                  authorName
                )}
              </span>
              <span className="shrink-0 font-medium">{year}</span>
            </div>
          )}

          {/* Monumental Title: Newsreader Medium 500 (Figma #1:71 / #1:623) */}
          <h2 className="font-serif font-medium text-[16px] sm:text-[20px] leading-[22px] sm:leading-[28px] text-primary line-clamp-1">
            <Link to={`/books/${book._id}`} className="hover:text-secondary transition-colors" title={book.title}>
              {book.title}
            </Link>
          </h2>
        </div>

        {/* Price Row: Bold Price + Touch Actions for mobile / Arrow Icon for Author Catalog */}
        <div className="pt-1.5 sm:pt-2 flex items-center justify-between mt-auto">
          <span className="font-sans font-bold text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] tracking-[-0.005em] text-primary">
            {priceFormatted}
          </span>

          {/* Mobile Touch Actions (< md) */}
          {!isAuthorCatalog && (
            <div className="flex md:hidden items-center gap-0.5">
              <Link
                to={`/edit-book/${book._id}`}
                className="p-1 rounded-md text-[#45474C] hover:text-primary hover:bg-surface-container transition-colors"
                title="Edit volume"
                aria-label="Edit volume"
              >
                <span className="material-symbols-outlined text-[16px] block">edit</span>
              </Link>
              <button
                type="button"
                onClick={() => onDelete(book)}
                className="p-1 rounded-md text-error hover:bg-error-container transition-colors"
                title="Delete volume"
                aria-label="Delete volume"
              >
                <span className="material-symbols-outlined text-[16px] block">delete</span>
              </button>
            </div>
          )}

          {isAuthorCatalog && (
            <Link
              to={`/books/${book._id}`}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[#091426] hover:bg-[#EFEEEC] transition-colors"
              title="View volume details"
              aria-label="View volume details"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] block leading-none">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
