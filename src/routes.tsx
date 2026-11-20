import type { RouteObject } from 'react-router';
import auth from './routes/auth';
import dashboard from './routes/dashboard';
import publicRoutes from './routes/public';
import NotFound from './dashboard/NotFound';

const routes: RouteObject[] = [...auth, ...dashboard, ...publicRoutes, { path: '*', element: <NotFound /> }];

export default routes;
