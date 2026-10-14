import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { sanitizeHtml, isValidHttpUrl } from '../../utils/sanitize';

export default function RichTextEditor({
  value = '',
  onChange,
  error = '',
  initialLoading = false,
  wordCount = 0,
}) {
  const { showToast } = useToast();
  const editorRef = useRef(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    strikeThrough: false,
    blockquote: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  // Query formatting state of current text selection
  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current) return;
    try {
      const isBold = document.queryCommandState('bold');
      const isItalic = document.queryCommandState('italic');
      const isStrike = document.queryCommandState('strikeThrough');
      const isUl = document.queryCommandState('insertUnorderedList');
      const isOl = document.queryCommandState('insertOrderedList');

      // Check if selection is within a blockquote
      let isQuote = false;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        while (node && node !== editorRef.current && node !== document.body) {
          if (node.nodeName === 'BLOCKQUOTE') {
            isQuote = true;
            break;
          }
          node = node.parentNode;
        }
      }

      setActiveFormats({
        bold: Boolean(isBold),
        italic: Boolean(isItalic),
        strikeThrough: Boolean(isStrike),
        blockquote: isQuote,
        insertUnorderedList: Boolean(isUl),
        insertOrderedList: Boolean(isOl),
      });
    } catch {
      // ignore
    }
  }, []);

  // Listen for selection changes to update active buttons dynamically
  useEffect(() => {
    const handleSelectionChange = () => {
      if (
        editorRef.current &&
        (document.activeElement === editorRef.current || editorRef.current.contains(document.activeElement))
      ) {
        updateActiveFormats();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [updateActiveFormats]);

  // Sync editor content on initial load or edit book fetch
  useEffect(() => {
    if (!initialLoading && editorRef.current) {
      if (value && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [initialLoading]);

  // Sync editor content when toggling back from preview mode
  useEffect(() => {
    if (!isPreviewMode && editorRef.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [isPreviewMode, value]);

  // Handle rich editor input
  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (onChange) onChange(html);
      updateActiveFormats();
    }
  };

  // Execute formatting command on selected text in contentEditable
  const executeFormat = (command, val = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val);
    handleEditorInput();
    updateActiveFormats();
  };

  // Toggle Blockquote
  const handleToggleBlockquote = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (activeFormats.blockquote) {
      document.execCommand('formatBlock', false, 'p');
    } else {
      document.execCommand('formatBlock', false, 'blockquote');
    }
    handleEditorInput();
    updateActiveFormats();
  };

  // Insert Hyperlink
  const handleInsertLink = () => {
    if (!editorRef.current) return;
    const url = window.prompt('Enter link URL (https://...):', 'https://');
    if (!url || !url.trim()) return;
    const trimmedUrl = url.trim();
    if (!isValidHttpUrl(trimmedUrl)) {
      showToast('Only http:// and https:// URLs are allowed', 'error');
      return;
    }
    executeFormat('createLink', trimmedUrl);
  };

  return (
    <section className="bg-white p-5 sm:p-8 rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col gap-2">
      {/* Header: Title & Word Count (Figma #1:1003 - #1:1014) */}
      <div className="flex items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-[#E9E8E6]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E9E8E6] flex items-center justify-center shrink-0">
            <svg className="w-[15px] h-[10px] text-[#091426] fill-current" viewBox="0 0 15 10">
              <path d="M1.41667 10L3.33333 6.66667C2.41667 6.66667 1.63194 6.34028 0.979167 5.6875C0.326389 5.03472 0 4.25 0 3.33333C0 2.41667 0.326389 1.63194 0.979167 0.979167C1.63194 0.326389 2.41667 0 3.33333 0C4.25 0 5.03472 0.326389 5.6875 0.979167C6.34028 1.63194 6.66667 2.41667 6.66667 3.33333C6.66667 3.65278 6.62847 3.94792 6.55208 4.21875C6.47569 4.48958 6.36111 4.75 6.20833 5L3.33333 10H1.41667ZM8.91667 10L10.8333 6.66667C9.91667 6.66667 9.13194 6.34028 8.47917 5.6875C7.82639 5.03472 7.5 4.25 7.5 3.33333C7.5 2.41667 7.82639 1.63194 8.47917 0.979167C9.13194 0.326389 9.91667 0 10.8333 0C11.75 0 12.5347 0.326389 13.1875 0.979167C13.8403 1.63194 14.1667 2.41667 14.1667 3.33333C14.1667 3.65278 14.1285 3.94792 14.0521 4.21875C13.9757 4.48958 13.8611 4.75 13.7083 5L10.8333 10H8.91667ZM3.33333 4.58333C3.68056 4.58333 3.97569 4.46181 4.21875 4.21875C4.46181 3.97569 4.58333 3.68056 4.58333 3.33333C4.58333 2.98611 4.46181 2.69097 4.21875 2.44792C3.97569 2.20486 3.68056 2.08333 3.33333 2.08333C2.98611 2.08333 2.69097 2.20486 2.44792 2.44792C2.20486 2.69097 2.08333 2.98611 2.08333 3.33333C2.08333 3.68056 2.20486 3.97569 2.44792 4.21875C2.69097 4.46181 2.98611 4.58333 3.33333 4.58333ZM10.8333 4.58333C11.1806 4.58333 11.4757 4.46181 11.7188 4.21875C11.9618 3.97569 12.0833 3.68056 12.0833 3.33333C12.0833 2.98611 11.9618 2.69097 11.7188 2.44792C11.4757 2.20486 11.1806 2.08333 10.8333 2.08333C10.4861 2.08333 10.191 2.20486 9.94792 2.44792C9.70486 2.69097 9.58333 2.98611 9.58333 3.33333C9.58333 3.68056 9.70486 3.97569 9.94792 4.21875C10.191 4.46181 10.4861 4.58333 10.8333 4.58333Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-sans font-semibold text-[16px] leading-[24px] tracking-[-0.005em] text-[#091426]">
              Description
            </h2>
            <p className="font-sans text-[12px] leading-[18px] text-[#45474C]">
              Editorial abstract, historical context, or reader review summaries.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold tracking-[0.05em] text-[#45474C] font-sans">
          {wordCount} words
        </span>
      </div>

      {/* Formatting Toolbar (Figma #1:1015 - #1:1040) */}
      <div className="flex items-center gap-1 p-1 bg-[#F4F3F1] rounded-lg border-0 flex-wrap mt-2">
        {/* 1. Bold (Figma #1:1016 - #1:1018) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeFormat('bold');
          }}
          className={`w-7 h-7 inline-flex items-center justify-center rounded transition-all cursor-pointer ${
            activeFormats.bold
              ? 'bg-[#45474C] text-white shadow-xs'
              : 'text-[#45474C] hover:bg-white hover:text-primary'
          }`}
          title="Bold (Ctrl+B)"
          aria-pressed={activeFormats.bold}
        >
          <svg className="w-[8px] h-[11px] fill-current" viewBox="0 0 8 11">
            <path d="M0 10.7695V0H4.25011C5.08346 0 5.85271 0.256417 6.55786 0.76925C7.263 1.28208 7.61558 1.99364 7.61558 2.90392C7.61558 3.55778 7.46814 4.061 7.17326 4.41357C6.87838 4.76614 6.60273 5.01936 6.34631 5.17321C6.66683 5.31424 7.02261 5.57706 7.41365 5.96169C7.80468 6.34631 8.0002 6.92325 8.0002 7.6925C8.0002 8.83355 7.58352 9.63165 6.75017 10.0868C5.91682 10.5419 5.13474 10.7695 4.40396 10.7695H0ZM2.32698 8.6156H4.32703C4.94243 8.6156 5.31744 8.45854 5.45206 8.14443C5.58668 7.83032 5.65399 7.60275 5.65399 7.46173C5.65399 7.3207 5.58668 7.09313 5.45206 6.77902C5.31744 6.46491 4.9232 6.30785 4.26934 6.30785H2.32698V8.6156ZM2.32698 4.23088H4.11549C4.53857 4.23088 4.84628 4.1219 5.03859 3.90394C5.2309 3.68599 5.32706 3.44239 5.32706 3.17316C5.32706 2.86546 5.21808 2.61545 5.00013 2.42314C4.78217 2.23083 4.50011 2.13467 4.15395 2.13467H2.32698V4.23088Z" />
          </svg>
        </button>

        {/* 2. Italic (Figma #1:1019 - #1:1021) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeFormat('italic');
          }}
          className={`w-7 h-7 inline-flex items-center justify-center rounded transition-all cursor-pointer ${
            activeFormats.italic
              ? 'bg-[#45474C] text-white shadow-xs'
              : 'text-[#45474C] hover:bg-white hover:text-primary'
          }`}
          title="Italic (Ctrl+I)"
          aria-pressed={activeFormats.italic}
        >
          <svg className="w-[10px] h-[11px] fill-current" viewBox="0 0 10 11">
            <path d="M0 10.7692V8.84615H3.07692L5.38462 1.92308H2.30769V0H10V1.92308H7.30769L5 8.84615H7.69231V10.7692H0Z" />
          </svg>
        </button>

        {/* 3. Strikethrough (Figma #1:1022 - #1:1024) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeFormat('strikeThrough');
          }}
          className={`w-7 h-7 inline-flex items-center justify-center rounded transition-all cursor-pointer ${
            activeFormats.strikeThrough
              ? 'bg-[#45474C] text-white shadow-xs'
              : 'text-[#45474C] hover:bg-white hover:text-primary'
          }`}
          title="Strikethrough"
          aria-pressed={activeFormats.strikeThrough}
        >
          <svg className="w-[15px] h-[12px] fill-current" viewBox="0 0 15 12">
            <path d="M0 7.5V6H15V7.5H0ZM6.375 4.5V2.25H2.25V0H12.75V2.25H8.625V4.5H6.375ZM6.375 12V9H8.625V12H6.375Z" />
          </svg>
        </button>

        {/* Divider 1 (Figma #1:1026) */}
        <span className="w-[1px] h-4 bg-[#C5C6CD] mx-1"></span>

        {/* 4. Blockquote (Figma #1:1027 - #1:1029) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleToggleBlockquote();
          }}
          className={`w-7 h-7 inline-flex items-center justify-center rounded transition-all cursor-pointer ${
            activeFormats.blockquote
              ? 'bg-[#45474C] text-white shadow-xs'
              : 'text-[#45474C] hover:bg-white hover:text-primary'
          }`}
          title="Quote"
          aria-pressed={activeFormats.blockquote}
        >
          <svg className="w-[13px] h-[9px] fill-current" viewBox="0 0 13 9">
            <path d="M1.275 9L3 6C2.175 6 1.46875 5.70625 0.88125 5.11875C0.29375 4.53125 0 3.825 0 3C0 2.175 0.29375 1.46875 0.88125 0.88125C1.46875 0.29375 2.175 0 3 0C3.825 0 4.53125 0.29375 5.11875 0.88125C5.70625 1.46875 6 2.175 6 3C6 3.2875 5.96562 3.55312 5.89687 3.79688C5.82812 4.04063 5.725 4.275 5.5875 4.5L3 9H1.275ZM8.025 9L9.75 6C8.925 6 8.21875 5.70625 7.63125 5.11875C7.04375 4.53125 6.75 3.825 6.75 3C6.75 2.175 7.04375 1.46875 7.63125 0.88125C8.21875 0.29375 8.925 0 9.75 0C10.575 0 11.2812 0.29375 11.8687 0.88125C12.4562 1.46875 12.75 2.175 12.75 3C12.75 3.2875 12.7156 3.55312 12.6469 3.79688C12.5781 4.04063 12.475 4.275 12.3375 4.5L9.75 9H8.025ZM3 4.125C3.3125 4.125 3.57812 4.01562 3.79688 3.79688C4.01562 3.57812 4.125 3.3125 4.125 3C4.125 2.6875 4.01562 2.42188 3.79688 2.20312C3.57812 1.98438 3.3125 1.875 3 1.875C2.6875 1.875 2.42188 1.98438 2.20312 2.20312C1.98438 2.42188 1.875 2.6875 1.875 3C1.875 3.3125 1.98438 3.57812 2.20312 3.79688C2.42188 4.01562 2.6875 4.125 3 4.125ZM9.75 4.125C10.0625 4.125 10.3281 4.01562 10.5469 3.79688C10.7656 3.57812 10.875 3.3125 10.875 3C10.875 2.6875 10.7656 2.42188 10.5469 2.20312C10.3281 1.98438 10.0625 1.875 9.75 1.875C9.4375 1.875 9.17188 1.98438 8.95312 2.20312C8.73438 2.42188 8.625 2.6875 8.625 3C8.625 3.3125 8.73438 3.57812 8.95312 3.79688C9.17188 4.01562 9.4375 4.125 9.75 4.125Z" />
          </svg>
        </button>

        {/* 5. Bullet List (Figma #1:1030 - #1:1032) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeFormat('insertUnorderedList');
          }}
          className={`w-7 h-7 inline-flex items-center justify-center rounded transition-all cursor-pointer ${
            activeFormats.insertUnorderedList
              ? 'bg-[#45474C] text-white shadow-xs'
              : 'text-[#45474C] hover:bg-white hover:text-primary'
          }`}
          title="Bullet list"
          aria-pressed={activeFormats.insertUnorderedList}
        >
          <svg className="w-[14px] h-[12px] fill-current" viewBox="0 0 14 12">
            <path d="M4.5 11.25V9.75H13.5V11.25H4.5ZM4.5 6.75V5.25H13.5V6.75H4.5ZM4.5 2.25V0.75H13.5V2.25H4.5ZM1.5 12C1.0875 12 0.734375 11.8531 0.440625 11.5594C0.146875 11.2656 0 10.9125 0 10.5C0 10.0875 0.146875 9.73438 0.440625 9.44063C0.734375 9.14688 1.0875 9 1.5 9C1.9125 9 2.26562 9.14688 2.55938 9.44063C2.85313 9.73438 3 10.0875 3 10.5C3 10.9125 2.85313 11.2656 2.55938 11.5594C2.26562 11.8531 1.9125 12 1.5 12ZM1.5 7.5C1.0875 7.5 0.734375 7.35312 0.440625 7.05937C0.146875 6.76562 0 6.4125 0 6C0 5.5875 0.146875 5.23438 0.440625 4.94063C0.734375 4.64688 1.0875 4.5 1.5 4.5C1.9125 4.5 2.26562 4.64688 2.55938 4.94063C2.85313 5.23438 3 5.5875 3 6C3 6.4125 2.85313 6.76562 2.55938 7.05937C2.26562 7.35312 1.9125 7.5 1.5 7.5ZM1.5 3C1.0875 3 0.734375 2.85313 0.440625 2.55938C0.146875 2.26562 0 1.9125 0 1.5C0 1.0875 0.146875 0.734375 0.440625 0.440625C0.734375 0.146875 1.0875 0 1.5 0C1.9125 0 2.26562 0.146875 2.55938 0.440625C2.85313 0.734375 3 1.0875 3 1.5C3 1.9125 2.85313 2.26562 2.55938 2.55938C2.26562 2.85313 1.9125 3 1.5 3Z" />
          </svg>
        </button>

        {/* 6. Numbered List (Figma #1:1033 - #1:1035) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeFormat('insertOrderedList');
          }}
          className={`w-7 h-7 inline-flex items-center justify-center rounded transition-all cursor-pointer ${
            activeFormats.insertOrderedList
              ? 'bg-[#45474C] text-white shadow-xs'
              : 'text-[#45474C] hover:bg-white hover:text-primary'
          }`}
          title="Numbered list"
          aria-pressed={activeFormats.insertOrderedList}
        >
          <svg className="w-[14px] h-[15px] fill-current" viewBox="0 0 14 15">
            <path d="M0 15V13.875H1.875V13.3125H0.75V12.1875H1.875V11.625H0V10.5H2.25C2.4625 10.5 2.64062 10.5719 2.78437 10.7156C2.92812 10.8594 3 11.0375 3 11.25V12C3 12.2125 2.92812 12.3906 2.78437 12.5344C2.64062 12.6781 2.4625 12.75 2.25 12.75C2.4625 12.75 2.64062 12.8219 2.78437 12.9656C2.92812 13.1094 3 13.2875 3 13.5V14.25C3 14.4625 2.92812 14.6406 2.78437 14.7844C2.64062 14.9281 2.4625 15 2.25 15H0ZM0 9.75V7.6875C0 7.475 0.071875 7.29688 0.215625 7.15312C0.359375 7.00937 0.5375 6.9375 0.75 6.9375H1.875V6.375H0V5.25H2.25C2.4625 5.25 2.64062 5.32187 2.78437 5.46562C2.92812 5.60938 3 5.7875 3 6V7.3125C3 7.525 2.92812 7.70312 2.78437 7.84688C2.64062 7.99063 2.4625 8.0625 2.25 8.0625H1.125V8.625H3V9.75H0ZM1.125 4.5V1.125H0V0H2.25V4.5H1.125ZM4.5 12.75V11.25H13.5V12.75H4.5ZM4.5 8.25V6.75H13.5V8.25H4.5ZM4.5 3.75V2.25H13.5V3.75H4.5Z" />
          </svg>
        </button>

        {/* Divider 2 (Figma #1:1037) */}
        <span className="w-[1px] h-4 bg-[#C5C6CD] mx-1"></span>

        {/* 7. Hyperlink (Figma #1:1040) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleInsertLink();
          }}
          className="w-7 h-7 inline-flex items-center justify-center rounded transition-all cursor-pointer text-[#45474C] hover:bg-white hover:text-primary"
          title="Hyperlink"
        >
          <svg className="w-[15px] h-[8px] fill-current" viewBox="0 0 15 8">
            <path d="M6.75 7.5H3.75C2.7125 7.5 1.82812 7.13437 1.09687 6.40312C0.365625 5.67188 0 4.7875 0 3.75C0 2.7125 0.365625 1.82812 1.09687 1.09687C1.82812 0.365625 2.7125 0 3.75 0H6.75V1.5H3.75C3.125 1.5 2.59375 1.71875 2.15625 2.15625C1.71875 2.59375 1.5 3.125 1.5 3.75C1.5 4.375 1.71875 4.90625 2.15625 5.34375C2.59375 5.78125 3.125 6 3.75 6H6.75V7.5ZM4.5 4.5V3H10.5V4.5H4.5ZM8.25 7.5V6H11.25C11.875 6 12.4062 5.78125 12.8438 5.34375C13.2812 4.90625 13.5 4.375 13.5 3.75C13.5 3.125 13.2812 2.59375 12.8438 2.15625C12.4062 1.71875 11.875 1.5 11.25 1.5H8.25V0H11.25C12.2875 0 13.1719 0.365625 13.9031 1.09687C14.6344 1.82812 15 2.7125 15 3.75C15 4.7875 14.6344 5.67188 13.9031 6.40312C13.1719 7.13437 12.2875 7.5 11.25 7.5H8.25Z" />
          </svg>
        </button>
      </div>

      {/* Rich Visual Editor or Formatted Preview (Figma #1:1041 - #1:1043) */}
      {isPreviewMode ? (
        <div
          className="w-full min-h-[160px] p-4 rounded-lg bg-[#F4F3F1] border-0 text-sm text-[#1A1C1B] font-sans leading-[22.75px] overflow-y-auto prose prose-stone max-w-none [&_blockquote]:border-l-2 [&_blockquote]:border-[#745939] [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-[#45474C] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_a]:text-[#745939] [&_a]:underline [&_strike]:line-through [&_s]:line-through [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic mt-2"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(value) || '<p class="text-[#75777D] italic">No description entered yet.</p>',
          }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable={true}
          onInput={handleEditorInput}
          onBlur={handleEditorInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onSelect={updateActiveFormats}
          role="textbox"
          aria-multiline="true"
          data-placeholder="Provide a critical introduction or dust-jacket synopsis for catalog readers..."
          className="w-full min-h-[160px] p-4 rounded-lg bg-[#F4F3F1] border-0 text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#091426]/20 transition-all font-sans leading-[22.75px] outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[#45474C]/40 [&_blockquote]:border-l-2 [&_blockquote]:border-[#745939] [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-[#45474C] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_a]:text-[#745939] [&_a]:underline [&_strike]:line-through [&_s]:line-through [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic mt-2"
        />
      )}

      {error && <p className="text-xs text-error font-sans mt-0.5">{error}</p>}

      {/* Editor Footer: Formatting status & Preview Toggle (Figma #1:1044 - #1:1051) */}
      <div className="flex items-center justify-between text-xs font-sans text-[#45474C] pt-3">
        {/* Left: Icon + "Rich text formatting enabled" */}
        <div className="flex items-center gap-1.5 text-[#45474C]">
          <svg className="w-[14px] h-[11px] text-[#45474C] fill-current shrink-0" viewBox="0 0 14 11">
            <path d="M9.62504 7.56253L11.6875 5.50002L10.9657 4.76096L10.1407 5.58596V3.43751H9.10941V5.58596L8.28441 4.76096L7.56253 5.50002L9.62504 7.56253ZM1.37501 11C0.996879 11 0.67318 10.8654 0.403908 10.5961C0.134636 10.3269 0 10.0032 0 9.62504V1.37501C0 0.996879 0.134636 0.67318 0.403908 0.403908C0.67318 0.134636 0.996879 0 1.37501 0H12.375C12.7532 0 13.0769 0.134636 13.3461 0.403908C13.6154 0.67318 13.7501 0.996879 13.7501 1.37501V9.62504C13.7501 10.0032 13.6154 10.3269 13.3461 10.5961C13.0769 10.8654 12.7532 11 12.375 11H1.37501ZM1.37501 9.62504H12.375V1.37501H1.37501V9.62504ZM1.37501 9.62504V1.37501V9.62504ZM2.40626 7.56253H3.43751V4.46877H4.12502V6.53128H5.15627V4.46877H5.84377V7.56253H6.87503V4.12502C6.87503 3.93022 6.80914 3.76694 6.67737 3.63517C6.5456 3.5034 6.38232 3.43751 6.18752 3.43751H3.09376C2.89897 3.43751 2.73569 3.5034 2.60392 3.63517C2.47214 3.76694 2.40626 3.93022 2.40626 4.12502V7.56253Z" />
          </svg>
          <span className="text-[12px] leading-[18px]">Rich text formatting enabled</span>
        </div>

        {/* Right: "Preview" / "Edit Description" toggle button */}
        <button
          type="button"
          onClick={() => setIsPreviewMode((prev) => !prev)}
          className="text-sm font-semibold text-[#745939] hover:underline transition-colors font-sans cursor-pointer"
        >
          {isPreviewMode ? 'Edit Description' : 'Preview'}
        </button>
      </div>
    </section>
  );
}
