import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

/**
 * Custom hook to access the Toast context (showToast, confirmAction).
 * Must be used within a ToastProvider.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
