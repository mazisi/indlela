import { Link } from 'react-router';
import { Building2, Clock, ShieldCheck } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page/PageHeader';
import { LevelBadge } from '@/components/LevelBadge';
import { usePermissions } from '@/contexts/PermissionContextType';
import { MODULES } from '@/config/modules';
import { clientScopeLabel } from '@/features/auth/lib/userDisplay';
import { formatDateTime } from '@/utils/formatDate';

/**
 * Landing page after sign-in: who you are signed in as, in which workspace,
 * and what your role lets you do there. The SEO dashboard (`view_dashboard`)
 * replaces the top of it once Search Console lands.
 */
export default function Dashboard() {
  const { user, workspace, levelFor } = usePermissions();

  if (!user) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-6 w-64 rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          {/* The summary cards: icon, label, value. */}
          {['w-28', 'w-36', 'w-32'].map((w) => (
            <div key={w} className="flex items-start gap-3 rounded border bg-card p-4">
              <Skeleton className="size-9 shrink-0 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className={`h-4 rounded ${w}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Internal modules (Platform) are listed only for those who can open them.
  const modules = MODULES.filter((m) => m.key !== 'dashboard' && !(m.internal && levelFor(m.key) === 'none'));

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Head title="Dashboard" />
      <PageHeader
        eyebrow={workspace?.name ?? 'Dashboard'}
        title={`Welcome, ${user.fullName}`}
        description="These are the parts of Indlela your role opens in this workspace."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={ShieldCheck} label="Your role" value={user.role ?? '—'} />
        <SummaryCard icon={Building2} label="Clients" value={clientScopeLabel(user)} />
        <SummaryCard icon={Clock} label="Previous sign-in" value={user.previousLoginAt ? formatDateTime(user.previousLoginAt) : 'This is your first sign-in'} />
      </div>

      <Card className="rounded">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">What your role can do</CardTitle>
          <Link to="/dashboard/account" className="text-sm font-medium text-primary hover:underline">
            My account
          </Link>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => {
              const Icon = m.icon;
              const level = levelFor(m.key);
              return (
                <li key={m.key} className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-b-0">
                  <span className={`flex items-center gap-2 ${level === 'none' ? 'text-muted-foreground' : ''}`}>
                    <Icon className="size-4 text-muted-foreground" aria-hidden />
                    {m.label}
                  </span>
                  <LevelBadge level={level} />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <Card className="rounded">
      <CardContent className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded bg-accent text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-semibold" title={value}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
