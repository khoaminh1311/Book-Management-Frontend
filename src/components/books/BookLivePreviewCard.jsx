import React from 'react';

export default function BookLivePreviewCard({
  formData = {},
  selectedAuthor = null,
}) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col items-center gap-4">
      {/* Header: LIVE VOLUME PREVIEW & Proportion Badge (Figma #1:1054 - #1:1059) */}
      <div className="w-full flex items-center justify-between pb-3.5 sm:pb-4 border-b border-[#E9E8E6]">
        <div className="text-[11px] font-semibold leading-[14px] tracking-[0.05em] text-[#45474C] uppercase font-sans">
          LIVE VOLUME<br />PREVIEW
        </div>
        <div className="px-2 py-0.5 rounded bg-[#FFDDB8]/40 text-[#745939] text-[11px] font-semibold leading-[14px] tracking-[0.05em] font-sans text-right">
          Proportion 1 :<br />1.5
        </div>
      </div>

      {/* Simulated 3D Physical Book Spine & Cover Mockup (Figma #1:1061 - #1:1076) */}
      <div className="relative w-44 sm:w-48 h-64 sm:h-72 rounded-r-[6px] overflow-hidden shadow-2xl shadow-black/25 flex flex-col justify-between p-4 sm:p-5 bg-[#091426] text-white">
        {/* Background Artwork */}
        {formData.coverImage ? (
          <img
            src={formData.coverImage}
            alt="Cover preview"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B2A4A] to-[#091426]" />
        )}

        {/* Left Spine Ridge Highlight Gradient (Figma #1:1063) */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
        {/* Vertical Spine Groove Divider (Figma #1:1064) */}
        <div className="absolute left-[10px] top-0 bottom-0 w-[1px] bg-white/20 pointer-events-none" />

        {/* Front Cover Typography Stack (Figma #1:1065 - #1:1076) */}
        <div className="relative z-10 flex flex-col gap-1">
          <span className="text-[10px] sm:text-[11px] font-semibold leading-[14px] tracking-[0.1em] text-white/75 uppercase font-sans">
            ARCHIVAL EDITION
          </span>
          <h3 className="font-serif font-medium text-[20px] sm:text-[24px] leading-[28px] sm:leading-[33px] tracking-[-0.025em] text-white line-clamp-3">
            {formData.title || 'The\nArchitecture of\nSilence'}
          </h3>
        </div>

        <div className="relative z-10 flex flex-col gap-1 sm:gap-1.5 pt-3 sm:pt-4">
          <div className="w-6 h-[2px] bg-[#745939]" />
          <span className="font-sans font-medium text-xs sm:text-[14px] leading-[18px] sm:leading-[22px] tracking-[0.025em] text-white truncate pt-1">
            {selectedAuthor ? selectedAuthor.name : 'Elena Rostova'}
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold leading-[14px] tracking-[0.05em] text-white/60 font-sans">
            EST. {formData.publishedYear || '2023'} · FOLIO
          </span>
        </div>
      </div>
    </div>
  );
}
