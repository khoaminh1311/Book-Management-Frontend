/**
 * BookCardSkeleton Component
 * Strict 1-to-1 visual mirror of BookCard.jsx (Figma #1:599):
 * - Card: p-3 sm:p-4, rounded-xl sm:rounded-2xl, bg-surface-container-lowest, border border-outline-variant/40, shadow-sm
 * - Cover Container: 2/3 aspect ratio, rounded-lg sm:rounded-xl, bg-surface-container
 * - Animated pulse placeholders for Title, Author, Year, Genre Badge, and Price
 */
export default function BookCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="relative bg-surface-container-lowest rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-outline-variant/40 flex flex-col justify-between select-none"
    >
      {/* Book Cover Placeholder (2:3 Aspect Ratio) */}
      <div className="relative w-full aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden bg-surface-container animate-pulse mb-2.5 sm:mb-3.5">
        {/* Top-Right Genre Badge Placeholder */}
        <div className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 z-10">
          <div className="w-12 sm:w-14 h-4 rounded bg-surface-container-high/70" />
        </div>
      </div>

      {/* Book Metadata Placeholders */}
      <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 justify-between animate-pulse">
        <div>
          {/* Top Metadata Line (Author & Year) */}
          <div className="flex items-center justify-between mb-1">
            <div className="h-3 w-20 sm:w-24 bg-surface-container-high rounded" />
            <div className="h-3 w-8 bg-surface-container-high rounded" />
          </div>

          {/* Book Title Placeholder (2 lines matching Newsreader font height) */}
          <div className="flex flex-col gap-1.5 pt-0.5">
            <div className="h-4 sm:h-5 w-4/5 bg-surface-container-highest rounded" />
            <div className="h-4 sm:h-5 w-3/5 bg-surface-container-highest rounded" />
          </div>
        </div>

        {/* Footer: Price Placeholder & Mobile Action Buttons */}
        <div className="pt-1.5 sm:pt-2 flex items-center justify-between mt-auto">
          <div className="h-4 sm:h-5 w-16 bg-surface-container-high rounded" />

          {/* Mobile Action Buttons Placeholder (< md) */}
          <div className="flex md:hidden items-center gap-1">
            <div className="w-6 h-6 rounded-md bg-surface-container-high/70" />
            <div className="w-6 h-6 rounded-md bg-surface-container-high/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
