import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../hooks/useToast';
import Pagination from '../components/common/Pagination';
import Breadcrumb from '../components/common/Breadcrumb';
import { getInitials, getAvatarColor } from '../utils/helpers';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Last Updated' },
  { value: 'name-asc', label: 'Name (A - Z)' },
  { value: 'name-desc', label: 'Name (Z - A)' },
  { value: 'year-asc', label: 'Birth Year (Oldest)' },
  { value: 'year-desc', label: 'Birth Year (Youngest)' },
];

/**
 * Screen 2: AuthorsPage (Author Management)
 * Strict Figma Specs: Frame #1:167 ("Author Management - BookShelf")
 * - Editorial Header Section (#1:170): Breadcrumbs Dashboard > Authors, Title Newsreader 32px, Subtitle 14px, Button + Add Author
 * - Search & Filter Card (#1:191): bg-surface-container-lowest, inner input bg-[#F4F3F1] with exact 15x15 SVG magnifying glass
 * - Author Data Table Card (#1:198):
 *   - Table Subheader Bar (#1:199): All Catalog Authors, badge Showing X authors, inline text Sort by (NO rectangular box!)
 *   - Table Header (#1:214): AUTHOR, NATIONALITY, BIRTH YEAR, ACTIONS (Plus Jakarta Sans SemiBold 11px uppercase tracking 0.05em)
 *   - Table Body (#1:223): Avatar initials 12px bold, Author name 14px bold, bio 12px, nationality badge, birth year 14px, 3 action buttons
 *   - Table Footer / Pagination Controls (#1:474): Showing 1 to X of Y entries, Prev, Page numbers, Next
 */
export default function AuthorsPage() {
  const { showToast, confirmAction } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Search Params (Single Source of Truth)
  const urlSearch = searchParams.get('search') || '';
  const urlSort = searchParams.get('sort') || 'recent';
  const rawPage = searchParams.get('page');
  const isInvalidPage = rawPage !== null && !/^[1-9]\d*$/.test(rawPage.trim());
  const urlPage = isInvalidPage ? 1 : Math.max(1, parseInt(rawPage || '1', 10));

  // Local state for smooth instant search typing
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);

  // Sync local search input when URL search changes externally (e.g. Back/Forward)
  if (prevUrlSearch !== urlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearchInput(urlSearch);
  }

  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const limit = 10;
  const [pagination, setPagination] = useState({ page: urlPage, limit: 10, total: 0, totalPages: 1 });

  // Debounced search input sync to URL search params
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      const currentUrlSearch = searchParams.get('search') || '';

      if (trimmed !== currentUrlSearch) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (trimmed) {
              next.set('search', trimmed);
            } else {
              next.delete('search');
            }
            next.delete('page'); // Reset to page 1 on new search
            return next;
          },
          { replace: true }
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchParams, setSearchParams]);

  // Handle Sort order change
  const handleSortChange = (newSort) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSort && newSort !== 'recent') {
        next.set('sort', newSort);
      } else {
        next.delete('sort');
      }
      next.delete('page'); // Reset to page 1
      return next;
    });
  };

  // Handle Page navigation
  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newPage > 1) {
        next.set('page', String(newPage));
      } else {
        next.delete('page');
      }
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchAuthors = useCallback(
    async (targetPage = 1, searchQuery = '', sortOption = 'recent', signal) => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.getAuthors({
          page: targetPage,
          limit,
          search: searchQuery,
          sort: sortOption,
          signal,
        });
        const fetched = res?.data || [];
        setAuthors(fetched);
        if (res?.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Error fetching authors:', err);
        setError(err.message || 'Failed to connect to backend server');
        showToast(err.message || 'Failed to load authors', 'error');
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [limit, showToast]
  );

  // Trigger data fetching whenever URL parameters change (handles initial load, search/filter, and Back/Forward)
  useEffect(() => {
    if (isInvalidPage) {
      const timer = setTimeout(() => {
        setAuthors([]);
        setPagination({ page: 1, limit: 10, total: 0, totalPages: 1 });
        setLoading(false);
        setError(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      fetchAuthors(urlPage, urlSearch, urlSort, controller.signal);
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isInvalidPage, urlPage, urlSearch, urlSort, fetchAuthors]);

  const handleDeleteAuthor = async (author) => {
    if (!author) return;
    const confirmed = await confirmAction({
      title: 'Delete Author',
      message: `Are you sure you want to remove "${author.name}" from the catalog? This action cannot be undone.`,
      confirmText: 'Delete Record',
      cancelText: 'Cancel',
      isDangerous: true,
    });

    if (!confirmed) return;

    try {
      await api.deleteAuthor(author._id);
      showToast(`Author "${author.name}" deleted successfully`, 'success');

      // If last item on page > 1, retreat to previous page
      const isLastItemOnPage = authors.length === 1 && urlPage > 1;
      const targetPage = isLastItemOnPage ? urlPage - 1 : urlPage;
      if (targetPage !== urlPage) {
        handlePageChange(targetPage);
      } else {
        fetchAuthors(targetPage, urlSearch, urlSort);
      }
    } catch (err) {
      console.error('Error deleting author:', err);
      showToast(err.message || 'Failed to delete author', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto flex flex-col gap-6 sm:gap-8">
      {/* SECTION 1: EDITORIAL HEADER (Figma #1:170) */}
      <section className="flex flex-col gap-1.5">
        <div>
          {/* Breadcrumbs (Figma #1:173) */}
          <Breadcrumb
            items={[{ label: 'Dashboard', to: '/' }, { label: 'Authors' }]}
            className="mb-1.5"
          />

          {/* Heading 1 (Figma #1:181 - style_8c587107: Newsreader Regular 32px/40px) */}
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-primary font-normal tracking-tight">
            Author Management
          </h1>

          {/* Subtitle (Figma #1:183 - style_46e80e82: Plus Jakarta Sans 14px/22px) */}
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-xl font-sans">
            Manage authors, biographies, and bibliographic affiliations.
          </p>
        </div>
      </section>

      {/* SECTION 2: SEARCH & FILTER CARD (Figma #1:191 - #1:197) */}
      <section className="bg-surface-container-lowest p-3 sm:p-4 rounded-2xl border border-outline-variant/40 shadow-sm">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search authors by name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-outline-variant/60 text-sm text-[#1A1C1B] placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
          />
        </div>
      </section>

      {/* SECTION 3: AUTHOR DATA TABLE CARD (Figma #1:198) */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden flex flex-col">
        {/* Table Subheader Bar (Figma #1:199 - template EL-10ebdc0c: padding 16px 24px) */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-outline-variant/30">
          {/* Left: Heading & Badge (Figma #1:200 - #1:204) */}
          <div className="flex items-center gap-2.5">
            <h2 className="font-sans font-semibold text-sm text-primary">All Catalog Authors</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E9E8E6] text-[#45474C] font-sans tracking-[0.05em]">
              Showing {authors.length} authors
            </span>
          </div>

          {/* Right: Inline Sort by (Figma #1:205 - #1:212: gap 4px between text and caret!) */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-xs text-[#45474C] font-sans">Sort by:</span>
            <div className="relative inline-flex items-center cursor-pointer group">
              <div className="flex items-center gap-1 text-sm font-semibold text-primary select-none">
                <span>{SORT_OPTIONS.find((o) => o.value === urlSort)?.label || 'Last Updated'}</span>
                {/* Exact downward triangle caret matching Figma #1:212 (width 6.67, height 3.33, color #091426) */}
                <svg
                  className="w-[7px] h-[4px] fill-current shrink-0 text-primary"
                  viewBox="0 0 7 4"
                >
                  <path d="M0 0L3.5 3.5L7 0H0Z" />
                </svg>
              </div>
              <select
                value={urlSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer font-sans"
                aria-label="Sort authors by"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content: Loading / Error / Empty States */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-xs text-on-surface-variant font-sans">Loading authors catalog...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2 p-6">
            <span className="material-symbols-outlined text-[36px] text-error">cloud_off</span>
            <p className="text-sm font-medium text-primary font-sans">Failed to load authors</p>
            <p className="text-xs text-on-surface-variant max-w-sm font-sans">{error}</p>
            <button
              type="button"
              onClick={() => fetchAuthors(urlPage, urlSearch, urlSort)}
              className="mt-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold font-sans"
            >
              Retry
            </button>
          </div>
        ) : authors.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2 p-6">
            <span className="material-symbols-outlined text-[40px] text-outline-variant">
              person_off
            </span>
            <p className="text-sm font-medium text-primary font-sans">No authors found</p>
            <p className="text-xs text-on-surface-variant font-sans">
              {urlSearch || isInvalidPage
                ? 'Try adjusting your search criteria.'
                : 'Start adding authors to your catalog.'}
            </p>
            <Link
              to="/add-author"
              className="mt-2 inline-flex items-center gap-1 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold font-sans"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>Add First Author</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-outline-variant/20">
              {authors.map((author) => {
                const avatarColor = getAvatarColor(author._id);
                const initials = getInitials(author.name);

                return (
                  <div key={author._id} className="p-4 flex flex-col gap-2.5">
                    {/* Top: Avatar, Name, Bio */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-[12px] font-bold tracking-[-0.025em] shrink-0 shadow-sm border border-outline-variant/30 font-sans ${avatarColor}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/authors/${author._id}`}
                          className="font-sans font-bold text-[14px] leading-[20px] text-primary hover:text-secondary hover:underline transition-colors block truncate"
                        >
                          {author.name}
                        </Link>
                        {author.bio ? (
                          <p className="text-[12px] leading-[18px] text-[#45474C] line-clamp-2 mt-0.5 font-sans">
                            {author.bio}
                          </p>
                        ) : (
                          <p className="text-[12px] text-on-surface-variant/50 italic mt-0.5 font-sans">
                            No bio provided
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Nationality, Birth Year & Action buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10">
                      <div className="flex items-center gap-2">
                        {author.nationality ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-[#F4F3F1] text-[10px] font-semibold tracking-[0.05em] text-[#45474C] font-sans">
                            {author.nationality}
                          </span>
                        ) : null}
                        <span className="text-[12px] text-[#45474C] font-sans">
                          {author.birthYear ? `Born: ${author.birthYear}` : ''}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/authors/${author._id}`}
                          className="w-8 h-8 rounded-lg text-[#45474C] hover:text-primary hover:bg-[#F4F3F1] transition-colors inline-flex items-center justify-center"
                          title="View author profile"
                          aria-label={`View ${author.name}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </Link>
                        <Link
                          to={`/edit-author/${author._id}`}
                          className="w-8 h-8 rounded-lg text-[#45474C] hover:text-primary hover:bg-[#F4F3F1] transition-colors inline-flex items-center justify-center"
                          title="Edit author"
                          aria-label={`Edit ${author.name}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteAuthor(author)}
                          className="w-8 h-8 rounded-lg text-[#BA1A1A] hover:bg-error-container/60 hover:text-on-error-container transition-colors inline-flex items-center justify-center"
                          title="Delete author"
                          aria-label={`Delete ${author.name}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop / Tablet Full Data Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                {/* Table Header (Figma #1:214: bg rgba(244, 243, 241, 0.7), Plus Jakarta Sans SemiBold 11px uppercase tracking 0.05em) */}
                <thead>
                  <tr className="bg-[rgba(244,243,241,0.7)] border-b border-outline-variant/30 text-[11px] font-semibold tracking-[0.05em] text-[#45474C] uppercase font-sans">
                    <th scope="col" className="px-6 py-3.5 w-5/12 font-semibold">
                      AUTHOR
                    </th>
                    <th scope="col" className="px-4 py-3.5 w-3/12 font-semibold">
                      NATIONALITY
                    </th>
                    <th scope="col" className="px-4 py-3.5 w-2/12 font-semibold">
                      BIRTH YEAR
                    </th>
                    <th scope="col" className="px-6 py-3.5 w-2/12 font-semibold text-right">
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                {/* Table Body (Figma #1:223) */}
                <tbody className="divide-y divide-outline-variant/20">
                  {authors.map((author) => {
                    const avatarColor = getAvatarColor(author._id);
                    const initials = getInitials(author.name);

                    return (
                      <tr
                        key={author._id}
                        className="hover:bg-surface-container/30 transition-colors group"
                      >
                        {/* Author Column (Figma #1:225 - #1:232) */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            {/* Circular Avatar Pill with initials (Figma #1:226: style_5481847a: Plus Jakarta Sans Bold 12px) */}
                            <div
                              className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-[12px] font-bold tracking-[-0.025em] shrink-0 shadow-sm border border-outline-variant/30 font-sans ${avatarColor}`}
                            >
                              {initials}
                            </div>

                            <div className="min-w-0">
                              {/* Author Name: style_f7b50b4b (Plus Jakarta Sans Bold 14px/20px) */}
                              <Link
                                to={`/authors/${author._id}`}
                                className="font-sans font-bold text-[14px] leading-[20px] text-primary hover:text-secondary hover:underline transition-colors block truncate"
                              >
                                {author.name}
                              </Link>

                              {/* Author Bio: style_adc113b5 (Plus Jakarta Sans Regular 12px/18px) */}
                              {author.bio ? (
                                <p className="text-[12px] leading-[18px] text-[#45474C] line-clamp-1 max-w-md mt-0.5 font-sans">
                                  {author.bio}
                                </p>
                              ) : (
                                <p className="text-[12px] text-on-surface-variant/50 italic mt-0.5 font-sans">
                                  No bio provided
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Nationality Column (Figma #1:233 - #1:235: template EL-fe02f149, style_20059e61) */}
                        <td className="px-4 py-4">
                          {author.nationality ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-[#F4F3F1] text-[11px] font-semibold tracking-[0.05em] text-[#45474C] font-sans">
                              {author.nationality}
                            </span>
                          ) : (
                            <span className="text-xs text-on-surface-variant/40">—</span>
                          )}
                        </td>

                        {/* Birth Year Column (Figma #1:236 - #1:237: style_46e80e82: Plus Jakarta Sans Regular 14px/22px) */}
                        <td className="px-4 py-4 text-[14px] leading-[22px] text-[#1A1C1B] font-sans">
                          {author.birthYear || '—'}
                        </td>

                        {/* Actions Column (Figma #1:238 - #1:248) */}
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* View details (#1:240) */}
                            <Link
                              to={`/authors/${author._id}`}
                              className="w-8 h-8 rounded-lg text-[#45474C] hover:text-primary hover:bg-[#F4F3F1] transition-colors inline-flex items-center justify-center"
                              title="View author profile"
                              aria-label={`View ${author.name}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                visibility
                              </span>
                            </Link>

                            {/* Edit author (#1:243) */}
                            <Link
                              to={`/edit-author/${author._id}`}
                              className="w-8 h-8 rounded-lg text-[#45474C] hover:text-primary hover:bg-[#F4F3F1] transition-colors inline-flex items-center justify-center"
                              title="Edit author"
                              aria-label={`Edit ${author.name}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </Link>

                            {/* Delete author (#1:246) */}
                            <button
                              type="button"
                              onClick={() => handleDeleteAuthor(author)}
                              className="w-8 h-8 rounded-lg text-[#BA1A1A] hover:bg-error-container/60 hover:text-on-error-container transition-colors inline-flex items-center justify-center"
                              title="Delete author"
                              aria-label={`Delete ${author.name}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* SECTION 4: PAGINATION FOOTER */}
      {!loading && !error && authors.length > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
