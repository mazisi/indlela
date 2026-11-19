import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  title?: string;
  description?: string;
  /** Custom retry handler; defaults to a full page reload. */
  onRetry?: () => void;
}

// Reusable, corporate error state for error boundaries (and manual error UIs).
export default function ErrorFallback({
  title = 'Something went wrong',
  description = 'This page couldn’t be loaded. This is usually temporary — refreshing should put it right.',
  onRetry,
}: ErrorFallbackProps) {
  const retry = onRetry ?? (() => window.location.reload());

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center rounded border bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <Button className="mt-5" onClick={retry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload page
        </Button>
      </div>
    </div>
  );
}
