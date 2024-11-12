import { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import { useAuth } from 'src/hooks/use-auth';

import { CONFIG } from 'src/config-global';
import { MainLayout } from 'src/layouts/main';

import { SplashScreen } from 'src/components/loading-screen';

import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { authDemoRoutes } from './auth-demo';
import { dashboardRoutes } from './dashboard';
import { componentsRoutes } from './components';

const HomePage = lazy(() => import('src/pages/home'));

export function Router() {
  useAuth();

  const routes = [
    {
      path: '/',
      element: CONFIG.auth.skip ? (
        <Suspense fallback={<SplashScreen />}>
          <MainLayout>
            <HomePage />
          </MainLayout>
        </Suspense>
      ) : (
        <Navigate to={CONFIG.auth.redirectPath} replace />
      ),
    },

    // Auth routes
    ...authRoutes,
    ...authDemoRoutes,

    // Dashboard routes
    ...dashboardRoutes,

    // Main routes
    ...mainRoutes,

    // Components routes
    ...componentsRoutes,

    // No match route
    { path: '*', element: <Navigate to="/404" replace /> },
  ];

  return useRoutes(routes);
}
