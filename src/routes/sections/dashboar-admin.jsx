import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

// Overview
const IndexPage = lazy(() => import('src/pages/dashboard/admin'));
// Auto Ecole
// const UserProfilePage = lazy(() => import('src/pages/dashboard/user/profile'));
const AutoEcoleCardsPage = lazy(() => import('src/pages/dashboard/auto-ecole/cards'));
const AutoEcoleListPage = lazy(() => import('src/pages/dashboard/auto-ecole/list'));
const AutoEcoleCreatePage = lazy(() => import('src/pages/dashboard/auto-ecole/new'));
const AutoEcoleEditPage = lazy(() => import('src/pages/dashboard/auto-ecole/edit'));
// App
const CalendarPage = lazy(() => import('src/pages/dashboard/calendar'));
const KanbanPage = lazy(() => import('src/pages/dashboard/kanban'));

// ----------------------------------------------------------------------

const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);

export const dashboardAdminRoutes = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? <>{layoutContent}</> : <AuthGuard>{layoutContent}</AuthGuard>,
    children: [
      { element: <IndexPage />, index: true },
      {
        path: 'autoEcole',
        children: [
          { element: <AutoEcoleListPage />, index: true },
          // { path: 'profile/:id', element: <UserProfilePage /> },
          { path: 'cards', element: <AutoEcoleCardsPage /> },
          { path: 'list', element: <AutoEcoleListPage /> },
          { path: 'new', element: <AutoEcoleCreatePage /> },
          { path: ':id/edit', element: <AutoEcoleEditPage /> },
          // { path: 'account/:id', element: <UserAccountPage /> },
        ],
      },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'kanban', element: <KanbanPage /> },
    ],
  },
];
