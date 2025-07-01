/**
 * Custom hook for showing toast notifications using the sonner library.
 * Provides success, error, info, loading, and dismiss methods.
 */
import { toast } from 'sonner';

export function useNotify() {
  return {
    /** Show a success notification */
    success: (message: string, options?: Record<string, unknown>) => toast.success(message, options),
    /** Show an error notification */
    error: (message: string, options?: Record<string, unknown>) => toast.error(message, options),
    /** Show an info notification */
    info: (message: string, options?: Record<string, unknown>) => toast.info(message, options),
    /** Show a loading notification */
    loading: (message: string, options?: Record<string, unknown>) => toast.loading(message, options),
    /** Dismiss a notification by ID */
    dismiss: (toastId?: string | number) => toast.dismiss(toastId),
  };
} 