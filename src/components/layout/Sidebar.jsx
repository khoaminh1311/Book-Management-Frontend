import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ isOpen = false, onClose }) {
  return (
    <>
      {/* Mobile Backdrop Overlay (< lg) */}
      {isOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-surface border-r border-outline-variant/50 z-40 p-4 select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 shadow-lg lg:shadow-none`}
      >
        <nav className="flex flex-col gap-1.5" aria-label="Catalog Navigation">
          <NavLink
            to="/"
            end
            onClick={() => onClose && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-surface-container text-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-primary font-medium'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">auto_stories</span>
            <span>Books</span>
          </NavLink>

          <NavLink
            to="/authors"
            onClick={() => onClose && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-surface-container text-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-primary font-medium'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span>Authors</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
