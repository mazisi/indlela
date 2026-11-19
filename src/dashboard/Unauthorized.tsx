import { Link, useNavigate } from 'react-router';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Head } from '@/components/ui/Head';

// 403 page — styled to match ErrorFallback (centered card, icon-in-circle,
// heading, muted text, themed buttons).
export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Head title="Access denied" />
      <div className="flex w-full max-w-md flex-col items-center rounded border bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          Error 403
        </span>
        <h2 className="mt-1 text-lg font-semibold text-gray-800">Access denied</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You don’t have permission to view this page. If you think this is a
          mistake, contact your administrator.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
          <Button asChild>
            <Link to="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
