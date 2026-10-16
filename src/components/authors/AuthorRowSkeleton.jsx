/**
 * AuthorRowSkeleton Component
 * Strict 1-to-1 visual mirror of AuthorsPage.jsx (Figma #1:170):
 * - Desktop (default): <tr> and <td> table structure with 4 columns matching table headers
 * - Mobile (isMobile={true}): Card layout in divide-y container matching mobile author cards
 */
export default function AuthorRowSkeleton({ isMobile = false }) {
  if (isMobile) {
    return (
      <div className="p-4 flex flex-col gap-2.5 animate-pulse select-none" aria-hidden="true">
        {/* Top: Avatar, Name, Bio */}
        <div className="flex items-start gap-3">
          <div className="w-[40px] h-[40px] rounded-full bg-surface-container shrink-0 border border-outline-variant/30 shadow-sm" />
          <div className="min-w-0 flex-1 flex flex-col gap-1.5">
            <div className="h-4 w-32 bg-surface-container-high rounded" />
            <div className="h-3 w-full max-w-[200px] bg-surface-container rounded mt-0.5" />
          </div>
        </div>

        {/* Bottom: Nationality, Birth Year & Action buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10">
          <div className="flex items-center gap-2">
            <div className="w-16 h-5 rounded bg-surface-container" />
            <div className="w-14 h-4 rounded bg-surface-container/80" />
          </div>
          <div className="inline-flex items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-surface-container/60" />
            <div className="w-8 h-8 rounded-lg bg-surface-container/60" />
            <div className="w-8 h-8 rounded-lg bg-surface-container/60" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr className="animate-pulse select-none" aria-hidden="true">
      {/* Author Column (Avatar, Name, Bio) */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3.5">
          <div className="w-[38px] h-[38px] rounded-full bg-surface-container shrink-0 border border-outline-variant/30 shadow-sm" />
          <div className="min-w-0 flex-1 flex flex-col gap-1.5">
            <div className="h-4 w-36 bg-surface-container-high rounded" />
            <div className="h-3 w-48 bg-surface-container rounded" />
          </div>
        </div>
      </td>

      {/* Nationality Column */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="w-20 h-5 rounded-full bg-surface-container" />
      </td>

      {/* Birth Year Column */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="w-14 h-4 rounded bg-surface-container" />
      </td>

      {/* Actions Column */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="inline-flex items-center justify-end gap-1">
          <div className="w-8 h-8 rounded-lg bg-surface-container/60 inline-block" />
          <div className="w-8 h-8 rounded-lg bg-surface-container/60 inline-block" />
          <div className="w-8 h-8 rounded-lg bg-surface-container/60 inline-block" />
        </div>
      </td>
    </tr>
  );
}
