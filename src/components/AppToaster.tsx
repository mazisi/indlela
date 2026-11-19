import toast, { ToastBar, Toaster } from 'react-hot-toast';
import { X } from 'lucide-react';

/**
 * The app's toasts (react-hot-toast) in the house tones, each with a close
 * button: the library's own error icon is a ✕ in a circle that only looks
 * like one.
 */
export function AppToaster() {
  return (
    <Toaster
      toastOptions={{
        success: { style: { background: 'var(--ok)', color: 'white' } },
        error: { style: { background: 'var(--bad)', color: 'white' } },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              {t.type !== 'loading' && (
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="-mr-1 shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-current"
                  aria-label="Dismiss"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
