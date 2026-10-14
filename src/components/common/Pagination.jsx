import React from 'react';

/**
 * Pagination Component
 * Strict Figma Design System Specs (Frame #1:747 - SECTION 4: PAGINATION BAR):
 * - Container: bg-surface-container-lowest, rounded-2xl (16px), p-4 (16px), shadow-sm, border border-outline-variant/40, flex justify-between items-center
 * - Left Text (#1:749): Plus Jakarta Sans Regular 400 12px/18px text-[#45474C], bold numbers in text-primary (#091426)
 * - Navigation Cluster (#1:750): flex items-center gap-1.5
 * - Previous & Next buttons (#1:751, #1:766): 32x32px (w-8 h-8), rounded-lg (8px), chevron icon
 * - Active Page Button (#1:754): 32x32px, rounded-lg, bg-primary (#091426), text-white, Plus Jakarta Sans 600 12px
 * - Inactive Page Buttons (#1:756, #1:758, etc.): 32x32px, rounded-lg, text-[#45474C], hover:bg-surface-container
 * - Ellipsis (#1:762): px-1 text-[#75777D] 12px
 */
export default function Pagination({ page = 1, totalPages = 1, total = 0, limit = 8, onPageChange }) {
  const safeTotal = Math.max(0, total);
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page || 1), safeTotalPages);

  const start = safeTotal === 0 ? 0 : (safePage - 1) * limit + 1;
  const end = Math.min(safePage * limit, safeTotal);

  const getPages = () => {
    if (safeTotalPages <= 5) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }
    if (safePage <= 3) {
      return [1, 2, 3, 4, '...', safeTotalPages];
    }
    if (safePage >= safeTotalPages - 2) {
      return [1, '...', safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages];
    }
    return [1, '...', safePage - 1, safePage, safePage + 1, '...', safeTotalPages];
  };

  const pages = getPages();

  return (
    <div className="mt-6 sm:mt-8 bg-surface-container-lowest rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
      {/* Left: Entries Counter (Figma #1:749) */}
      <div className="text-[11px] sm:text-[12px] leading-[16px] sm:leading-[18px] text-[#45474C] font-sans text-center sm:text-left">
        Showing <span className="font-semibold text-primary">{start}</span> to{' '}
        <span className="font-semibold text-primary">{end}</span> of{' '}
        <span className="font-semibold text-primary">{safeTotal.toLocaleString()}</span> entries
      </div>

      {/* Right: Pagination Navigation (Figma #1:750) */}
      <nav aria-label="Pagination Navigation" className="flex items-center gap-1.5">
        {/* Previous Page Button (Figma #1:751) */}
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange && onPageChange(safePage - 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#45474C] hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {/* Mobile-only compact Page indicator (< sm) */}
        <span className="sm:hidden text-xs font-semibold px-2 text-primary font-sans">
          Page {safePage} / {safeTotalPages}
        </span>

        {/* Desktop-only individual Page Buttons (>= sm) */}
        <div className="hidden sm:flex items-center gap-1.5">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <div key={`ellipsis-${idx}`} className="px-1 text-[12px] text-[#75777D] select-none">
                  ...
                </div>
              );
            }

            const isActive = p === safePage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange && onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-[12px] font-semibold tracking-[0.04em] flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm font-bold'
                    : 'text-[#45474C] hover:bg-surface-container hover:text-primary'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={isActive ? `Page ${p}, current page` : `Go to page ${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page Button (Figma #1:766) */}
        <button
          type="button"
          disabled={safePage >= safeTotalPages}
          onClick={() => onPageChange && onPageChange(safePage + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#45474C] hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </nav>
    </div>
  );
}
