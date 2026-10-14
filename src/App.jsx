import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './components/layout/MainLayout';

import DashboardPage from './pages/DashboardPage';
import AuthorsPage from './pages/AuthorsPage';
import BookDetailPage from './pages/BookDetailPage';
import AuthorDetailPage from './pages/AuthorDetailPage';
import AddEditBookPage from './pages/AddEditBookPage';
import AddEditAuthorPage from './pages/AddEditAuthorPage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-16 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-lg flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-[40px] text-error">error</span>
          <h2 className="font-serif text-xl font-bold text-primary">Something went wrong</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
            {this.state.error?.message || 'An unexpected error occurred while loading this view.'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            className="mt-2 px-5 py-2.5 bg-primary text-on-primary text-xs font-semibold rounded-xl hover:bg-primary-container transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              {/* Books & Catalog */}
              <Route index element={<DashboardPage />} />
              <Route path="books/:id" element={<BookDetailPage />} />
              <Route path="add-book" element={<AddEditBookPage />} />
              <Route path="edit-book/:id" element={<AddEditBookPage />} />

              {/* Authors */}
              <Route path="authors" element={<AuthorsPage />} />
              <Route path="authors/:id" element={<AuthorDetailPage />} />
              <Route path="add-author" element={<AddEditAuthorPage />} />
              <Route path="edit-author/:id" element={<AddEditAuthorPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </ToastProvider>
  );
}
