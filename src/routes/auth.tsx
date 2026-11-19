import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router';
import { RedirectIfSignedIn } from '@/utils/RequireAuth';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));

const guest = (element: React.ReactNode) => <RedirectIfSignedIn>{element}</RedirectIfSignedIn>;

const routes: RouteObject[] = [
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: guest(<LoginPage />) },
  { path: '/register', element: guest(<RegisterPage />) },
  { path: '/forgot-password', element: guest(<ForgotPasswordPage />) },
  // Not guarded: an emailed reset or invite link must work even in a browser
  // that is signed in as someone else.
  { path: '/reset-password', element: <ResetPasswordPage /> },
  // Invite wording for the same token flow (a user added to a workspace).
  { path: '/set-password', element: <ResetPasswordPage /> },
];

export default routes;
