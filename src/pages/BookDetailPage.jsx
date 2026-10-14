import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import BookCover from '../components/books/BookCover';
import Breadcrumb from '../components/common/Breadcrumb';
import { sanitizeHtml } from '../utils/sanitize';
import { getInitials, formatPrice, normalizeAuthor, getAvatarColor } from '../utils/helpers';

/**
 * Screen 3: BookDetailPage (Volume Overview & Technical Specs)
 * Strict Figma Specs: Frame #1:798 ("Book Detail - The Architecture of Silence")
 * - Top Breadcrumbs (#1:801): Books > {Title}
 * - Main 12-Column Editorial Split (#1:808):
 *   - LEFT COLUMN (5 Cols - #1:809): Physical Volume Mockup, ambient light gradients, archival seal tag, Quick Actions (Edit / Delete)
 *   - RIGHT COLUMN (7 Cols - #1:832):
 *     - Header Banner (#1:833): Genre badge, published year badge, Monumental title (Newsreader 48px), Author byline, Value badge
 *     - Description Card (#1:851): Icon menu_book, heading Description, curatorial text
 *     - Interactive Author Mini-Card (#1:867): Avatar circle initials, Demographics & bio, View Author Profile button
 */
export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, confirmAction } = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBookDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getBook(id);
        if (res?.data) {
          setBook(res.data);
        } else {
          setError('Volume not found');
        }
      } catch (err) {
        console.error('Error fetching book detail:', err);
        setError(err.message || 'Failed to load volume details');
        showToast(err.message || 'Failed to load volume details', 'error');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchBookDetail();
    }
  }, [id, showToast]);

  const handleDeleteBook = async () => {
    if (!book) return;
    const confirmed = await confirmAction({
      title: 'Delete Volume',
      message: `Are you sure you want to permanently delete "${book.title}" from the catalog? This action cannot be undone.`,
      confirmText: 'Delete Volume',
      cancelText: 'Cancel',
      isDangerous: true,
    });

    if (!confirmed) return;

    try {
      await api.deleteBook(book._id);
      showToast(`Volume "${book.title}" was deleted from catalog`, 'success');
      navigate('/');
    } catch (err) {
      console.error('Error deleting book:', err);
      showToast(err.message || 'Failed to delete volume', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 lg:p-12 max-w-7xl w-full mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant font-sans">
          Loading volume archival details...
        </p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="p-8 lg:p-12 max-w-7xl w-full mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined text-[48px] text-error">menu_book</span>
        <h2 className="font-serif text-2xl text-primary font-medium">Volume Not Found</h2>
        <p className="text-sm text-on-surface-variant max-w-md text-center">
          {error || 'The requested volume could not be located in the library catalog.'}
        </p>
        <Link
          to="/"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold shadow hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  const { authorName, authorId } = normalizeAuthor(book.author);
  const author = book.author && typeof book.author === 'object' ? book.author : null;
  const priceFormatted = formatPrice(book.price);
  const archivalNo = book._id
    ? `ARCHIVAL NO. ${book._id.slice(-4).toUpperCase()}`
    : 'ARCHIVAL NO. 492';

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto flex flex-col gap-6 sm:gap-8">
      {/* Top Breadcrumbs (Figma #1:801 - #1:807) */}
      <Breadcrumb items={[{ label: 'Books', to: '/' }, { label: book.title }]} />

      {/* Main Editorial Two-Column Split Canvas (Figma #1:808) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
        {/* LEFT COLUMN: Physical Volume Presentation (5 Columns - Figma #1:809) */}
        <section className="lg:col-span-5 bg-[#F4F3F1] rounded-xl p-6 sm:p-8 lg:p-12 relative overflow-hidden flex flex-col items-center shadow-sm border border-outline-variant/40">
          {/* Ambient subtle light gradients (Figma #1:810, #1:811) */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[rgba(255,221,184,0.35)] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-[rgba(216,227,251,0.45)] blur-3xl pointer-events-none" />

          {/* Physical Book Presentation Mockup (Figma #1:812 - #1:819) */}
          <div className="relative group max-w-[220px] sm:max-w-[260px] md:max-w-[272px] w-full aspect-[2/3] z-10">
            {/* Spine shadow simulation (Figma #1:813) */}
            <div className="absolute -inset-1.5 rounded-xl bg-gradient-to-r from-primary/30 via-transparent to-primary/10 blur-md pointer-events-none" />

            {/* Book Cover Container (Figma #1:814: borderRadius 8px) */}
            <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl bg-[#EFEEEC] border border-black/5">
              <BookCover book={book} size="lg" />

              {/* Archival Seal Tag Floating on Cover (Figma #1:818 - #1:819) */}
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-[#091426]/85 backdrop-blur px-2 sm:px-2.5 py-0.5 sm:py-1 rounded text-white text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase shadow-md font-sans z-10">
                {archivalNo}
              </div>
            </div>
          </div>

          {/* Quick Action Micro Bar under Cover (Figma #1:820 - #1:831) */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3 w-full z-10 max-w-[320px]">
            {/* Edit Book Button (Figma #1:822) */}
            <Link
              to={`/edit-book/${book._id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg bg-white border border-outline-variant/40 text-[#1A1C1B] font-semibold text-xs sm:text-sm shadow-sm hover:bg-surface-container transition-colors font-sans"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span className="leading-tight text-center">Edit Book</span>
            </Link>

            {/* Delete Book Button (Figma #1:827) */}
            <button
              type="button"
              onClick={handleDeleteBook}
              className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg bg-[#FFDAD6] text-[#BA1A1A] font-semibold text-xs sm:text-sm shadow-sm hover:bg-[#FFDAD6]/80 transition-colors font-sans cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span className="leading-tight text-center">Delete Book</span>
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: Catalog Content, Curatorial Summary & Author Card (7 Columns - Figma #1:832) */}
        <section className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 lg:gap-8">
          {/* Header Banner & Taxonomic Indicators (Figma #1:833 - #1:850) */}
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {/* Badges Row (Figma #1:834 - #1:838) */}
            <div className="flex items-center gap-2 flex-wrap">
              {book.genre && (
                <span className="inline-block px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-wider bg-[rgba(255,221,184,0.5)] text-[#745939] font-sans">
                  {book.genre}
                </span>
              )}
              {book.publishedYear && (
                <span className="inline-block px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-xs font-semibold bg-[#EFEEEC] text-[#45474C] font-sans">
                  Published {book.publishedYear}
                </span>
              )}
            </div>

            {/* Monumental Work Title (Figma #1:839 - #1:840: Newsreader Regular 48px/60px -0.02em) */}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-[44px] lg:leading-[54px] xl:text-[48px] xl:leading-[60px] tracking-[-0.02em] font-normal text-primary mt-1 break-words">
              {book.title}
            </h1>

            {/* Author Byline & Core Evaluation Metrics (Figma #1:841 - #1:850) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-1 sm:pt-2">
              <div className="flex items-baseline gap-1.5 text-sm sm:text-base text-[#45474C] font-sans">
                <span>by</span>
                {authorId ? (
                  <Link
                    to={`/authors/${authorId}`}
                    className="font-serif font-medium text-lg sm:text-xl text-primary hover:text-secondary underline decoration-1 underline-offset-4 transition-colors"
                  >
                    {authorName}
                  </Link>
                ) : (
                  <span className="font-serif font-medium text-lg sm:text-xl text-primary">
                    {authorName}
                  </span>
                )}
              </div>

              {/* Quantitative Appraisal Badge (Figma #1:847 - #1:850) */}
              <div className="bg-[#F4F3F1] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-baseline gap-2 border border-outline-variant/30 font-sans w-fit">
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-[#45474C] uppercase">
                  VALUE
                </span>
                <span className="font-serif font-medium text-[18px] sm:text-[20px] leading-[26px] sm:leading-[28px] text-[#1A1C1B]">
                  {priceFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Curatorial Overview & Thematic Description (Figma #1:851 - #1:866) */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 lg:p-8 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[20px] sm:text-[22px] text-[#745939]">
                menu_book
              </span>
              <h2 className="font-serif font-medium text-[18px] sm:text-[20px] leading-[26px] sm:leading-[28px]">
                Description
              </h2>
            </div>

            <div
              className="text-xs sm:text-sm md:text-[15px] leading-[22px] sm:leading-[26px] text-[#1A1C1B] font-sans prose prose-sm max-w-none break-words [&_blockquote]:border-l-2 [&_blockquote]:border-[#745939] [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-[#45474C] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_a]:text-[#745939] [&_a]:underline [&_strike]:line-through [&_s]:line-through [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic"
              dangerouslySetInnerHTML={{
                __html:
                  sanitizeHtml(book.description) ||
                  '<span class="italic text-[#75777D]">No detailed curatorial description has been recorded for this volume yet.</span>',
              }}
            />
          </div>

          {/* Interactive Author Mini-Card (Figma #1:867 - #1:885) */}
          {author && (
            <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col sm:flex-row sm:items-start lg:items-center gap-4 sm:gap-5">
              {/* Author Avatar circle (Figma #1:869 - #1:870: 48x48px, fill #E9E8E6, border #C5C6CD) */}
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-serif text-[15px] sm:text-[16px] leading-[24px] tracking-[0.05em] font-medium shrink-0 border border-[#C5C6CD] shadow-sm ${getAvatarColor(authorId)}`}
              >
                {getInitials(author.name)}
              </div>

              {/* Author Demographics, Link & Bio Stack (Figma #1:871 - #1:885) */}
              <div className="min-w-0 flex-1 flex flex-col gap-1.5 sm:gap-2">
                <div className="flex flex-col gap-0.5">
                  {/* Author Name (Figma #1:875: Newsreader Medium 500 20px) */}
                  <Link
                    to={`/authors/${author._id}`}
                    className="font-serif font-medium text-lg sm:text-[20px] leading-[26px] sm:leading-[28px] text-primary hover:text-secondary hover:underline transition-colors block truncate"
                  >
                    {author.name}
                  </Link>
                  {/* Demographics (Figma #1:877) */}
                  <p className="text-xs text-[#45474C] font-sans">
                    {[author.nationality, author.birthYear ? `Born ${author.birthYear}` : null]
                      .filter(Boolean)
                      .join(' • ') || 'Catalog Author'}
                  </p>
                </div>

                {/* View Author Profile link (Figma #1:878 - #1:882) */}
                <Link
                  to={`/authors/${author._id}`}
                  className="inline-flex items-center gap-1 text-[#745939] hover:underline font-semibold text-xs sm:text-[14px] leading-[20px] transition-colors w-fit font-sans"
                >
                  <span>View Author Profile</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>

                {/* Author Bio (Figma #1:883 - #1:885) */}
                {author.bio && (
                  <p className="text-xs sm:text-[14px] leading-[20px] sm:leading-[22px] text-[#1A1C1B] line-clamp-2 pt-0.5 font-sans">
                    {author.bio}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
