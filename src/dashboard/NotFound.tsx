import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Head } from '@/components/ui/Head';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Head title="Page not found" />
      <div className="flex w-full max-w-md flex-col items-center rounded border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <Compass className="size-6" />
        </div>
        <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Error 404</span>
        <h2 className="mt-1 text-lg font-semibold">Page not found</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
        <Button asChild className="mt-5">
          <Link to="/dashboard">Go to the dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
