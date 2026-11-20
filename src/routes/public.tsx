import { lazy, type ReactNode } from 'react';
import type { RouteObject } from 'react-router';
import SimpleErrorBoundary from '@/components/SimpleErrorBoundary';

const PublicReportPage = lazy(() => import('@/features/reports/pages/PublicReportPage'));

const boundary = (element: ReactNode) => <SimpleErrorBoundary fallback={<p className="p-6 text-sm text-muted-foreground">This page could not be loaded. Refresh to try again.</p>}>{element}</SimpleErrorBoundary>;

/**
 * Pages anyone may open: no session, no guard, no app layout (a client
 * opening their agency's report link must never be sent to sign in).
 */
const routes: RouteObject[] = [{ path: '/r/:token', element: boundary(<PublicReportPage />) }];

export default routes;
