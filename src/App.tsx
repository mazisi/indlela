import { Suspense, useEffect } from 'react';
import { BrowserRouter, useLocation, useRoutes } from 'react-router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import routes from './routes';
import IdleTimer from './components/IdleTimer';
import { PermissionProvider } from './contexts/PermissionContextType';

NProgress.configure({ minimum: 0.3, speed: 500, trickleSpeed: 200, showSpinner: false });

function AppRoutes() {
  return useRoutes(routes);
}

/** A short progress bar on every route change. */
function RouteProgressBar() {
  const location = useLocation();

  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => NProgress.done(), 300);
    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [location]);

  return null;
}

/** Only the signed-in app needs permissions; auth pages must not fetch them. */
function ConditionalPermissionProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return location.pathname.startsWith('/dashboard') ? <PermissionProvider>{children}</PermissionProvider> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteProgressBar />
      <ConditionalPermissionProvider>
        <Suspense fallback={null}>
          <AppRoutes />
          <IdleTimer />
        </Suspense>
      </ConditionalPermissionProvider>
    </BrowserRouter>
  );
}
