import { useEffect, useRef, useCallback } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';
import { useToast } from './useToast';

/**
 * Custom hook to guard against unintended data loss when leaving an unsaved form.
 * Handles:
 * 1. Form Cancel CTA: Direct graceful confirmation avoiding browser POP scroll restoration jerk.
 * 2. In-app client-side navigation (via React Router `useBlocker`).
 * 3. Browser tab/window unload/reload events (via `beforeunload`).
 *
 * @param {boolean} isDirty - Flag indicating if there are unsaved form changes
 * @returns {{ handleCancel: () => void }} Helper function for in-form Cancel button
 */
export function useUnsavedChangesWarning(isDirty) {
  const { confirmAction } = useToast();
  const navigate = useNavigate();
  const isPromptingRef = useRef(false);
  const bypassBlockerRef = useRef(false);

  // 1. React Router Blocker: Intercept in-app navigation when form is dirty (unless explicitly bypassed)
  const shouldBlock = useCallback(
    () => Boolean(isDirty) && !bypassBlockerRef.current,
    [isDirty]
  );
  const blocker = useBlocker(shouldBlock);

  // 2. Direct Cancel button handler: Ask confirmation BEFORE calling navigate(-1)
  // This avoids the browser executing a POP history navigation that triggers native scroll restoration
  // and protects against Chromium's off-screen active element focus-shift scroll behavior.
  const handleCancel = useCallback(
    (e) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!isDirty) {
        navigate(-1);
        return;
      }

      if (isPromptingRef.current) return;
      isPromptingRef.current = true;

      // Snapshot the current scroll position before focus change
      const savedScrollY = window.scrollY;

      // Blur active element cleanly if any
      if (
        document.activeElement &&
        document.activeElement !== document.body &&
        typeof document.activeElement.blur === 'function'
      ) {
        document.activeElement.blur();
      }

      // Instantly restore scroll if browser tried to jump during blur
      if (window.scrollY !== savedScrollY) {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' });
      }

      confirmAction({
        title: 'Unsaved Changes',
        message:
          'You have unsaved changes. Are you sure you want to leave? All your modifications will be lost.',
        confirmText: 'Leave Page',
        cancelText: 'Stay on Page',
        isDangerous: true,
      })
        .then((confirmed) => {
          if (confirmed) {
            bypassBlockerRef.current = true;
            navigate(-1);
          } else {
            if (window.scrollY !== savedScrollY) {
              window.scrollTo({ top: savedScrollY, behavior: 'instant' });
            }
          }
        })
        .catch(() => {
          if (window.scrollY !== savedScrollY) {
            window.scrollTo({ top: savedScrollY, behavior: 'instant' });
          }
        })
        .finally(() => {
          isPromptingRef.current = false;
        });
    },
    [isDirty, navigate, confirmAction]
  );

  // 3. Trigger Confirmation Modal on blocked navigation (for Links, browser Back button, etc.)
  useEffect(() => {
    if (blocker.state === 'blocked' && !isPromptingRef.current) {
      isPromptingRef.current = true;
      confirmAction({
        title: 'Unsaved Changes',
        message:
          'You have unsaved changes. Are you sure you want to leave? All your modifications will be lost.',
        confirmText: 'Leave Page',
        cancelText: 'Stay on Page',
        isDangerous: true,
      })
        .then((confirmed) => {
          if (confirmed) {
            blocker.proceed();
          } else {
            blocker.reset();
          }
        })
        .catch(() => {
          blocker.reset();
        })
        .finally(() => {
          isPromptingRef.current = false;
        });
    }
  }, [blocker.state, blocker, confirmAction]);

  // 4. Browser-level beforeunload event (tab close, browser refresh, typing URL in address bar)
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  return { handleCancel };
}

