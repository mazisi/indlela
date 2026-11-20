import { lazy, type ReactNode } from 'react';
import { Navigate, useLocation, type RouteObject } from 'react-router';
import { RequireAuth } from '@/utils/RequireAuth';
import Unauthorized from '@/dashboard/Unauthorized';
import SimpleErrorBoundary from '@/components/SimpleErrorBoundary';
import ErrorFallback from '@/components/ErrorFallback';
import { ProtectedRoute } from '@/routes/protectedRoute';
import { MODULES, permissionFor } from '@/config/modules';
import ModuleIndexRedirect from '@/dashboard/ModuleIndexRedirect';

const AuthenticatedLayout = lazy(() => import('@/components/layouts/AuthenticatedLayout'));
const Dashboard = lazy(() => import('@/dashboard/Dashboard'));
const ModulePlaceholder = lazy(() => import('@/dashboard/ModulePlaceholder'));
const AccountPage = lazy(() => import('@/features/auth/pages/AccountPage'));
const LoginHistoryPage = lazy(() => import('@/features/users/pages/LoginHistoryPage'));
const RolesPage = lazy(() => import('@/features/roles/pages/RolesPage'));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const EmailTemplatesPage = lazy(() => import('@/features/email-templates/pages/EmailTemplatesPage'));
const WorkspacePage = lazy(() => import('@/features/workspaces/pages/WorkspacePage'));
const ClientsPage = lazy(() => import('@/features/clients/pages/ClientsPage'));
const SitesPage = lazy(() => import('@/features/sites/pages/SitesPage'));
const SearchConsolePage = lazy(() => import('@/features/search-console/pages/SearchConsolePage'));
const SiteAuditPage = lazy(() => import('@/features/site-audit/pages/SiteAuditPage'));
const SiteAuditDetailPage = lazy(() => import('@/features/site-audit/pages/SiteAuditDetailPage'));
const RankTrackingPage = lazy(() => import('@/features/rank-tracking/pages/RankTrackingPage'));
const RankTrackingSitePage = lazy(() => import('@/features/rank-tracking/pages/RankTrackingSitePage'));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));
const ReportsSitePage = lazy(() => import('@/features/reports/pages/ReportsSitePage'));
const ReportPreviewPage = lazy(() => import('@/features/reports/pages/ReportPreviewPage'));
const PlatformUsagePage = lazy(() => import('@/features/platform/pages/PlatformUsagePage'));

// Friendly fallback when a lazy route chunk fails to load (network/deploy mismatch).
const boundary = (element: ReactNode) => <SimpleErrorBoundary fallback={<ErrorFallback />}>{element}</SimpleErrorBoundary>;
const guarded = (permission: string, element: ReactNode) => boundary(<ProtectedRoute permission={permission}>{element}</ProtectedRoute>);

/** Menu items (`module.item`, or `module` for one without items) that have a real page; everything else shows the placeholder. */
const PAGES: Record<string, ReactNode> = {
  'clients.clients': <ClientsPage />,
  'clients.sites': <SitesPage />,
  search_console: <SearchConsolePage />,
  site_audit: <SiteAuditPage />,
  rank_tracking: <RankTrackingPage />,
  reports: <ReportsPage />,
  'settings.users': <UsersPage />,
  'settings.roles': <RolesPage />,
  'settings.login-history': <LoginHistoryPage />,
  'settings.email-templates': <EmailTemplatesPage />,
  'settings.workspace': <WorkspacePage />,
  'platform.usage': <PlatformUsagePage />,
};

/** Pages under a module without sub-items (e.g. a site's audit), guarded like the module itself. */
const SUB_PAGES: Record<string, { path: string; element: ReactNode }[]> = {
  site_audit: [{ path: ':siteId', element: <SiteAuditDetailPage /> }],
  rank_tracking: [{ path: ':siteId', element: <RankTrackingSitePage /> }],
  reports: [
    { path: ':siteId', element: <ReportsSitePage /> },
    { path: ':siteId/:reportId', element: <ReportPreviewPage /> },
  ],
};

// Every menu entry from the catalogue becomes a permission-guarded route.
const moduleRoutes: RouteObject[] = MODULES.filter((m) => m.path !== '').map((m) =>
  SUB_PAGES[m.key]
    ? {
        path: m.path,
        children: [
          { index: true, element: guarded(permissionFor(m), PAGES[m.key] ?? <ModulePlaceholder moduleKey={m.key} />) },
          ...SUB_PAGES[m.key].map((sub) => ({ path: sub.path, element: guarded(permissionFor(m), sub.element) })),
        ],
      }
    : m.items
    ? {
        path: m.path,
        children: [
          { index: true, element: <ModuleIndexRedirect moduleKey={m.key} /> },
          ...m.items.map((item) => ({
            path: item.key,
            element: guarded(
              permissionFor(m, item),
              PAGES[`${m.key}.${item.key}`] ?? <ModulePlaceholder moduleKey={m.key} itemKey={item.key} />,
            ),
          })),
        ],
      }
    : { path: m.path, element: guarded(permissionFor(m), PAGES[m.key] ?? <ModulePlaceholder moduleKey={m.key} />) },
);

/** Google's OAuth return lands on `/search-console?google=…` (the API's FRONTEND_URL + path); keep the params. */
function SearchConsoleReturn() {
  const { search } = useLocation();
  return <Navigate to={`/dashboard/search-console${search}`} replace />;
}

const routes: RouteObject[] = [
  { path: '/search-console', element: <SearchConsoleReturn /> },
  {
    path: '/dashboard',
    element: (
      <RequireAuth>
        <AuthenticatedLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: boundary(<Dashboard />) },
      { path: 'account', element: boundary(<AccountPage />) },
      ...moduleRoutes,
      { path: 'unauthorized', element: <Unauthorized /> },
    ],
  },
];

export default routes;
