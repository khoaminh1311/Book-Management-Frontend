import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState(null);
  const timeoutIdsRef = useRef(new Map());

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach(timerId => clearTimeout(timerId));
      timeoutIdsRef.current.clear();
    };
  }, []);

  const removeToast = useCallback((id) => {
    if (timeoutIdsRef.current.has(id)) {
      clearTimeout(timeoutIdsRef.current.get(id));
      timeoutIdsRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      const timerId = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        timeoutIdsRef.current.delete(id);
      }, duration);
      timeoutIdsRef.current.set(id, timerId);
    }
  }, []);

  const confirmAction = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false,
  }) => {
    return new Promise((resolve) => {
      setModalConfig({
        title,
        message,
        confirmText,
        cancelText,
        isDangerous,
        onConfirm: () => {
          setModalConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setModalConfig(null);
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* Floating Toasts matching Figma Tokens */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map(t => {
          const styles = {
            success: 'bg-primary text-on-primary border border-primary-container',
            error: 'bg-error-container text-on-error-container border border-error/20',
            warning: 'bg-[#FFEDD5] text-[#7C2D12] border border-secondary/20',
            info: 'bg-surface-container-lowest text-primary border border-outline-variant shadow-lg',
          }[t.type] || 'bg-surface-container-lowest text-primary';

          const icon = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info',
          }[t.type] || 'info';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 ${styles}`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">
                {icon}
              </span>
              <span className="text-sm font-medium flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded hover:opacity-75 transition-opacity text-current ml-1"
                aria-label="Dismiss"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal with Backdrop Blur matching Figma Design */}
      {modalConfig && (
        <div className="fixed inset-0 z-[10000] bg-primary/45 backdrop-blur-[4px] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-surface-container-lowest text-on-surface rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/40 flex flex-col gap-5 transform scale-100 transition-transform">
            <div className="flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                modalConfig.isDangerous ? 'bg-error-container/60 text-error' : 'bg-surface-container text-primary'
              }`}>
                <span className="material-symbols-outlined text-[22px]">
                  {modalConfig.isDangerous ? 'warning' : 'help'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-serif text-lg font-bold text-primary tracking-tight">
                  {modalConfig.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {modalConfig.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={modalConfig.onCancel}
                className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors"
              >
                {modalConfig.cancelText}
              </button>
              <button
                type="button"
                onClick={modalConfig.onConfirm}
                className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors ${
                  modalConfig.isDangerous
                    ? 'bg-error-container text-on-error-container hover:bg-error hover:text-white'
                    : 'bg-primary text-on-primary hover:bg-primary-container'
                }`}
              >
                {modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
