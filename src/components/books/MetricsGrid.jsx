import React from 'react';
import { GENRE_OPTIONS } from '../../utils/constants';

/**
 * Quick Metrics Summary Cards
 * Strict Figma Design System Specs (Frame #1:540):
 * - Label: Plus Jakarta Sans SemiBold 600, 11px, leading 14px, tracking 0.05em, color #45474C (style_ccb18673)
 * - Value: Newsreader Regular 400, 24px, leading 32px, tracking -0.01em, color #091426 (style_d01431e5)
 * - Icon: Bronze #745939 (fill_afdf7c66), 18px
 * - Spacing: pt-3 (12px) margin between label and value (EL-8e175aae)
 */
export default function MetricsGrid({ totalTitles, totalAuthors, totalGenres, totalValue, valueLabel = 'TOTAL CATALOG VALUE' }) {
  const metrics = [
    {
      label: 'TOTAL TITLES',
      value: Number(totalTitles || 0).toLocaleString(),
      icon: 'auto_stories',
    },
    {
      label: 'TOTAL AUTHORS',
      value: Number(totalAuthors || 0).toLocaleString(),
      icon: 'group',
    },
    {
      label: 'TOTAL GENRES',
      value: totalGenres ?? GENRE_OPTIONS.length,
      icon: 'category',
    },
    {
      label: valueLabel,
      value: `$${Number(totalValue || 0).toFixed(2)}`,
      icon: 'payments',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-surface-container-lowest p-3.5 sm:p-5 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col justify-between"
        >
          {/* Header Row: Label & Bronze Icon */}
          <div className="flex items-center justify-between text-[#45474C] gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold leading-[13px] sm:leading-[14px] tracking-[0.05em] uppercase truncate">
              {m.label}
            </span>
            {m.label.includes('VALUE') ? (
              <span className="material-symbols-outlined text-secondary text-[20px]">
                attach_money
              </span>
            ) : (
              <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#745939] shrink-0">
                {m.icon}
              </span>
            )}
          </div>

          {/* Value: Newsreader Regular (400) 20px-24px */}
          <div className="pt-2 sm:pt-3">
            <span className="font-serif font-normal text-[19px] sm:text-[24px] leading-7 sm:leading-8 tracking-[-0.01em] text-primary block truncate">
              {m.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
