import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import MetricsGrid from '../components/books/MetricsGrid';
import SearchFilterBar from '../components/books/SearchFilterBar';
import BookCard from '../components/books/BookCard';
import Pagination from '../components/common/Pagination';
import Breadcrumb from '../components/common/Breadcrumb';
import { GENRE_OPTIONS } from '../utils/constants';

export default function DashboardPage() {
  const { showToast, confirmAction } = useToast();

  const [books, setBooks] = useState([]);
  const [totalAuthors, setTotalAuthors] = useState(0);
  const [totalCatalogValue, setTotalCatalogValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All Genres');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  const limit = 8;
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });

  const fetchCatalogData = useCallback(async (targetPage = 1, searchQuery = '', genreFilter = '', sortOption = 'recent') => {
    setLoading(true);
    setError(null);

    try {
      const [bookRes, authorRes] = await Promise.all([
        api.getBooks({
          page: targetPage,
          limit,
          genre: genreFilter === 'All Genres' ? '' : genreFilter,
          search: searchQuery,
          sort: sortOption,
        }),
        api.getAuthors({ page: 1, limit: 1 }).catch(() => null),
      ]);

      const fetchedBooks = bookRes?.data || [];
      setBooks(fetchedBooks);
      if (bookRes?.pagination) {
        setPagination(bookRes.pagination);
      }
      if (bookRes?.totalCatalogValue !== undefined) {
        setTotalCatalogValue(bookRes.totalCatalogValue);
      }
      if (authorRes?.pagination?.total !== undefined) {
        setTotalAuthors(authorRes.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching catalog data:', err);
      setError(err.message || 'Failed to connect to backend server');
      showToast(err.message || 'Failed to load books from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [limit, showToast]);

  // Debounced Search, Filter & Sort effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCatalogData(1, search, genre, sortBy);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, genre, sortBy, fetchCatalogData]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchCatalogData(newPage, search, genre, sortBy);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBook = async (book) => {
    const confirmed = await confirmAction({
      title: 'Delete Volume',
      message: `Are you sure you want to remove "${book.title}" from the catalog? This action cannot be undone.`,
      confirmText: 'Delete Record',
      cancelText: 'Cancel',
      isDangerous: true,
    });

    if (confirmed) {
      try {
        await api.deleteBook(book._id);
        showToast(`"${book.title}" deleted successfully`, 'success');

        // If last item on page > 1, retreat to previous page
        const isLastItemOnPage = books.length === 1 && page > 1;
        const targetPage = isLastItemOnPage ? page - 1 : page;
        if (isLastItemOnPage) {
          setPage(targetPage);
        }
        fetchCatalogData(targetPage, search, genre, sortBy);
      } catch (err) {
        showToast(err.message || 'Failed to delete volume', 'error');
      }
    }
  };

  const catalogValue = totalCatalogValue !== undefined
    ? totalCatalogValue
    : books.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto flex flex-col gap-6 sm:gap-8">
      {/* SECTION 1: EDITORIAL HEADER & METRICS SUMMARY (Figma #1:526) */}
      <section className="flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
          <div>
            <Breadcrumb
              items={[
                { label: 'Dashboard' },
                { label: 'Books' },
              ]}
              className="mb-1.5"
            />
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-primary tracking-tight font-normal">
              Library Catalog
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-xl font-sans">
              Manage, explore, and organize volumes in your personal collection.
            </p>
          </div>
        </div>

        {/* 4 Quick Metrics Summary Cards */}
        <MetricsGrid
          totalTitles={pagination.total}
          totalAuthors={totalAuthors}
          totalGenres={GENRE_OPTIONS.length}
          totalValue={catalogValue}
        />
      </section>

      {/* SECTION 2: SEARCH & TAXONOMIC FILTER BAR (Figma #1:577) */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        genre={genre}
        onGenreChange={setGenre}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* SECTION 3: BOOKS CATALOG GRID */}
      <section>
        {loading ? (
          <div className="py-16 sm:py-24 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm text-on-surface-variant">Loading catalog volumes...</p>
          </div>
        ) : error ? (
          <div className="py-16 sm:py-20 text-center flex flex-col items-center justify-center gap-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 sm:p-8">
            <div className="w-12 h-12 rounded-full bg-error-container/60 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">cloud_off</span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl text-primary font-medium">Unable to Connect to Server</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
              Please verify the backend server is running and accessible on port 5000.
            </p>
            <button
              type="button"
              onClick={() => fetchCatalogData(1, search, genre, sortBy)}
              className="mt-2 px-5 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-container transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : books.length === 0 ? (
          <div className="py-16 sm:py-20 text-center flex flex-col items-center justify-center gap-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 sm:p-8">
            <span className="material-symbols-outlined text-[48px] text-outline-variant">auto_stories</span>
            <h3 className="font-serif text-lg sm:text-xl text-primary font-medium">No volumes found</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm">
              {search || genre !== 'All Genres'
                ? 'Try adjusting your search query or filter.'
                : 'Start expanding your collection by cataloging a new volume.'}
            </p>
            <Link
              to="/add-book"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold shadow hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add New Volume
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {books.map((book) => (
              <BookCard key={book._id} book={book} onDelete={handleDeleteBook} />
            ))}
          </div>
        )}

        {/* SECTION 4: PAGINATION FOOTER */}
        {!loading && !error && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        )}
      </section>
    </div>
  );
}
