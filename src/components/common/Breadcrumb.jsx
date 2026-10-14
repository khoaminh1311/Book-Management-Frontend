import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Standardized Breadcrumb Navigation Component
 * Adheres to WAI-ARIA breadcrumb accessibility pattern & BookShelf design tokens.
 *
 * @param {Array<{ label: string, to?: string }>} items - Breadcrumb items list
 * @param {string} className - Optional container styling / margin override
 */
export default function Breadcrumb({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-xs sm:text-sm font-sans text-on-surface-variant ${className}`}
    >
      <ol className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5 sm:gap-2">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="text-on-surface-variant hover:text-primary transition-colors shrink-0 font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? 'text-primary font-semibold truncate max-w-[150px] xs:max-w-[220px] sm:max-w-md'
                      : 'text-on-surface-variant shrink-0 font-medium'
                  }
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <span
                  className="material-symbols-outlined text-[14px] text-on-surface-variant/60 shrink-0 select-none"
                  aria-hidden="true"
                >
                  chevron_right
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
