import type { RouteObject } from 'react-router';
import auth from './routes/auth';
import dashboard from './routes/dashboard';
import NotFound from './dashboard/NotFound';

const routes: RouteObject[] = [...auth, ...dashboard, { path: '*', element: <NotFound /> }];

export default routes;
