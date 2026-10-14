import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import BookCard from '../components/books/BookCard';
import Breadcrumb from '../components/common/Breadcrumb';
import { getInitials, getAvatarColor } from '../utils/helpers';

/**
 * Screen 4: AuthorDetailPage (Author Profile & Associated Bibliography)
 * Strict Figma Design System Specs: Frame #1:2 ("Author Detail - Elena Rostova")
 * - Breadcrumbs (#1:5 - #1:11): Authors > {Author Name}
 * - Section 2: Author Profile Card (#1:12 - #1:44):
 *   - Avatar with initials (48x48px, Newsreader Bold 20px, bg #EFEEEC)
 *   - Author Name (Newsreader Regular 32px / 40px -0.025em)
 *   - Quick Actions: Edit Profile (#1:21) & Delete Author (#1:26)
 *   - Demographic Badges (#1:31): Nationality (globe) & Birth Year (calendar)
 *   - Biography block (#1:40): "BIOGRAPHY" label (11px bronze #745939) & bio text
 * - Section 3: "Books by this Author" Catalog Grid (#1:45 - #1:137):
 *   - Header Bar with title, book count pill (#1:50: bg #E9E8E6), and + Add Book CTA (#1:52)
 *   - 4-Column responsive grid using standard BookCard component (#1:58)
 */
export default function AuthorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, confirmAction } = useToast();

  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAuthorDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getAuthor(id);
        if (res?.data) {
          setAuthor(res.data);
          setBooks(res.data.books || []);
        } else {
          setError('Author profile not found');
        }
      } catch (err) {
        console.error('Error fetching author detail:', err);
        setError(err.message || 'Failed to load author profile');
        showToast(err.message || 'Failed to load author profile', 'error');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchAuthorDetail();
    }
  }, [id, showToast]);

  const handleDeleteAuthor = async () => {
    if (!author) return;
    if (books.length > 0) {
      showToast(
        `Cannot delete ${author.name} because they have ${books.length} cataloged book${books.length > 1 ? 's' : ''}. Please remove or reassign their books first.`,
        'warning',
        5000
      );
      return;
    }

    const confirmed = await confirmAction({
      title: 'Delete Author',
      message: `Are you sure you want to permanently delete author "${author.name}" from the library catalog? This action cannot be undone.`,
      confirmText: 'Delete Record',
      cancelText: 'Cancel',
      isDangerous: true,
    });

    if (!confirmed) return;

    try {
      await api.deleteAuthor(author._id);
      showToast(`Author "${author.name}" was removed from the catalog.`, 'success');
      navigate('/authors');
    } catch (err) {
      console.error('Error deleting author:', err);
      showToast(err.message || 'Failed to delete author', 'error');
    }
  };

  const handleDeleteBook = async (book) => {
    if (!book) return;
    const confirmed = await confirmAction({
      title: 'Delete Volume',
      message: `Are you sure you want to permanently remove volume "${book.title}" from the catalog? This action cannot be undone.`,
      confirmText: 'Delete Record',
      cancelText: 'Cancel',
      isDangerous: true,
    });

    if (!confirmed) return;

    try {
      await api.deleteBook(book._id);
      setBooks((prev) => prev.filter((b) => b._id !== book._id));
      showToast(`Volume "${book.title}" was removed from the catalog.`, 'success');
    } catch (err) {
      console.error('Error deleting volume:', err);
      showToast(err.message || 'Failed to delete volume', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 lg:p-12 max-w-7xl w-full mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant font-sans">
          Loading author archival record...
        </p>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="p-8 lg:p-12 max-w-7xl w-full mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined text-[48px] text-error">person_off</span>
        <h2 className="font-serif text-2xl text-primary font-medium">Author Not Found</h2>
        <p className="text-sm text-on-surface-variant max-w-md text-center">
          {error || 'The requested author could not be located in the catalog.'}
        </p>
        <Link
          to="/authors"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold shadow hover:bg-primary/90 transition-colors font-sans"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Authors</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto flex flex-col gap-6 sm:gap-8">
      {/* Top Breadcrumb Nav (Figma #1:5 - #1:11) */}
      <Breadcrumb items={[{ label: 'Authors', to: '/authors' }, { label: author.name }]} />

      {/* Section 2: Author Profile Card (Figma #1:12 - #1:44) */}
      <section className="bg-surface-container-lowest p-4 sm:p-6 lg:p-10 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-5 sm:gap-6">
        {/* Header Row: Avatar, Name & Quick Actions (Figma #1:14 - #1:30) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-[#E9E8E6]">
          {/* Avatar & Author Name (Figma #1:15 - #1:19) */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {/* Avatar Circle (Figma #1:16 - #1:17) */}
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-serif text-[18px] sm:text-[20px] font-bold shrink-0 shadow-sm ${getAvatarColor(author._id)}`}
            >
              {getInitials(author.name)}
            </div>

            {/* Author Title (Figma #1:18 - #1:19) */}
            <h1 className="font-serif text-2xl sm:text-[32px] sm:leading-[40px] tracking-[-0.025em] font-normal text-primary break-words">
              {author.name}
            </h1>
          </div>

          {/* Quick Actions (Figma #1:20 - #1:30) */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            {/* Edit Profile Button (Figma #1:21 - #1:25) */}
            <Link
              to={`/edit-author/${author._id}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EFEEEC] hover:bg-[#E9E8E6] text-[#1A1C1B] font-semibold text-xs sm:text-sm leading-[20px] transition-colors shadow-sm font-sans"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Edit Profile</span>
            </Link>

            {/* Delete Author Button (Figma #1:26 - #1:30) */}
            <button
              type="button"
              onClick={handleDeleteAuthor}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FFDAD6]/60 hover:bg-[#FFDAD6] text-[#BA1A1A] font-semibold text-xs sm:text-sm leading-[20px] transition-colors shadow-sm font-sans cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>Delete Author</span>
            </button>
          </div>
        </div>

        {/* Demographic Badges Row (Figma #1:31 - #1:39) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Nationality Badge (Figma #1:32 - #1:35) */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4F3F1] text-[#45474C] text-[11px] sm:text-xs font-semibold font-sans">
            <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-[#75777D]">
              public
            </span>
            <span>{author.nationality || 'Nationality Not Specified'}</span>
          </div>

          {/* Birth Year Badge (Figma #1:36 - #1:39) */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4F3F1] text-[#45474C] text-[11px] sm:text-xs font-semibold font-sans">
            <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-[#75777D]">
              calendar_today
            </span>
            <span>{author.birthYear ? `Born ${author.birthYear}` : 'Birth Year Unknown'}</span>
          </div>
        </div>

        {/* Biography Block (Figma #1:40 - #1:44) */}
        <div className="flex flex-col gap-2 pt-1">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#745939] font-sans">
            BIOGRAPHY
          </h2>
          {/* Bio text */}
          <p className="text-sm sm:text-[16px] leading-[22px] sm:leading-[26px] text-[#45474C] font-sans whitespace-pre-line max-w-5xl break-words">
            {author.bio || 'No curatorial biography has been recorded for this author.'}
          </p>
        </div>
      </section>

      {/* Section 3: "Books by this Author" Catalog Section (Figma #1:45 - #1:137) */}
      <section className="flex flex-col gap-5 sm:gap-6">
        {/* Section Header Bar with Title & CTA (Figma #1:46 - #1:56) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-1 sm:pt-2">
          {/* Header & Books Count Pill (Figma #1:47 - #1:51) */}
          <div className="flex items-center gap-3 sm:gap-4">
            <h2 className="font-serif font-medium text-xl sm:text-[24px] leading-7 sm:leading-[32px] tracking-[-0.025em] text-primary">
              Books by {author.name}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E9E8E6] text-[#1A1C1B] text-xs font-semibold font-sans">
              {books.length} {books.length === 1 ? 'Book' : 'Books'}
            </span>
          </div>

          {/* Add Book CTA (Figma #1:52 - #1:56) */}
          <Link
            to={`/add-book?author=${author._id}`}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg bg-[#091426] text-white hover:bg-[#091426]/90 transition-colors text-xs sm:text-sm leading-[20px] font-semibold shadow-sm font-sans self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Book</span>
          </Link>
        </div>

        {/* Books Grid Container (Figma #1:57 - #1:137) */}
        {books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {books.map((book) => (
              <BookCard
                key={book._id}
                variant="author"
                book={{
                  ...book,
                  author: {
                    _id: author._id,
                    name: author.name,
                  },
                }}
                onDelete={handleDeleteBook}
              />
            ))}
          </div>
        ) : (
          /* Empty Catalog State for Author */
          <div className="bg-surface-container-lowest rounded-2xl p-12 border border-outline-variant/40 shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <span className="material-symbols-outlined text-[48px] text-outline">menu_book</span>
            <h3 className="font-serif text-xl font-medium text-primary">No Volumes Cataloged</h3>
            <p className="text-sm text-on-surface-variant max-w-sm font-sans">
              No bibliographic volumes have been registered under {author.name} yet.
            </p>
            <Link
              to={`/add-book?author=${author._id}`}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors font-sans"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add First Volume</span>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
