import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard, RoleGuard } from 'src/auth/guard';
// import { ProfileGuard } from 'src/auth/guard/profile-guard';

// ----------------------------------------------------------------------

// Overview
const IndexPage = lazy(() => import('src/pages/dashboard'));
// const CompleteProfilePage = lazy(() => import('src/pages/dashboard/complete-profile'));
// User
const UserProfilePage = lazy(() => import('src/pages/dashboard/user/profile'));
const UserCardsPage = lazy(() => import('src/pages/dashboard/user/cards'));
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserAccountPage = lazy(() => import('src/pages/dashboard/user/account'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
// Auto Ecole
// const UserProfilePage = lazy(() => import('src/pages/dashboard/user/profile'));
const AutoEcoleCardsPage = lazy(() => import('src/pages/dashboard/auto-ecole/cards'));
const AutoEcoleListPage = lazy(() => import('src/pages/dashboard/auto-ecole/list'));
// const UserAccountPage = lazy(() => import('src/pages/dashboard/user/account'));
const AutoEcoleCreatePage = lazy(() => import('src/pages/dashboard/auto-ecole/new'));
const AutoEcoleEditPage = lazy(() => import('src/pages/dashboard/auto-ecole/edit'));
// Blog
const BlogPostsPage = lazy(() => import('src/pages/dashboard/post/list'));
const BlogPostPage = lazy(() => import('src/pages/dashboard/post/details'));
const BlogNewPostPage = lazy(() => import('src/pages/dashboard/post/new'));
const BlogEditPostPage = lazy(() => import('src/pages/dashboard/post/edit'));
const PostCategoryPage = lazy(() => import('src/pages/dashboard/post/categories/list'));
// Event
const EventListPage = lazy(() => import('src/pages/dashboard/event/list'));
const EventDetailsPage = lazy(() => import('src/pages/dashboard/event/details'));
const EventCreatePage = lazy(() => import('src/pages/dashboard/event/new'));
const EventEditPage = lazy(() => import('src/pages/dashboard/event/edit'));
// App
const CalendarPage = lazy(() => import('src/pages/dashboard/calendar'));
const KanbanPage = lazy(() => import('src/pages/dashboard/kanban'));
// Event Order
const EventOrderPage = lazy(() => import('src/pages/dashboard/event-order/event-order'));
const EventOrderDetailsPage = lazy(
  () => import('src/pages/dashboard/event-order/event-order-detail')
);
// Qr Scanner
const QrScannerPage = lazy(() => import('src/pages/dashboard/app/qr-coder-scanner'));
// Data Export
const DataExportPage = lazy(() => import('src/pages/dashboard/data-export'));
// File Manager
const FileManagerPage = lazy(() => import('src/pages/dashboard/file-manager'));

// ----------------------------------------------------------------------

const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? <>{layoutContent}</> : <AuthGuard>{layoutContent}</AuthGuard>,
    children: [
      { element: <IndexPage />, index: true },
      // { path: 'complete-profile', element: <CompleteProfilePage /> },
      {
        path: 'user',
        children: [
          {
            element: (
              <RoleGuard requiredLevel={0}>
                <UserProfilePage />
              </RoleGuard>
            ),
            index: true,
          },
          {
            path: 'cards',
            element: (
              <RoleGuard requiredLevel={3}>
                <UserCardsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'list',
            element: (
              <RoleGuard requiredLevel={4}>
                <UserListPage />
              </RoleGuard>
            ),
          },
          {
            path: 'new',
            element: (
              <RoleGuard requiredLevel={3}>
                <UserCreatePage />
              </RoleGuard>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <RoleGuard requiredLevel={3}>
                <UserEditPage />
              </RoleGuard>
            ),
          },
          {
            path: 'account',
            element: (
              <RoleGuard requiredLevel={1}>
                <UserAccountPage />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'event',
        children: [
          {
            element: (
              <RoleGuard requiredLevel={2}>
                <EventListPage />
              </RoleGuard>
            ),
            index: true,
          },
          {
            path: 'list',
            element: (
              <RoleGuard requiredLevel={2}>
                <EventListPage />
              </RoleGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleGuard requiredLevel={2}>
                <EventDetailsPage />
              </RoleGuard>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <RoleGuard requiredLevel={2}>
                <EventEditPage />
              </RoleGuard>
            ),
          },
          {
            path: 'new',
            element: (
              <RoleGuard requiredLevel={2}>
                <EventCreatePage />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'ev_order',
        children: [
          {
            element: (
              <RoleGuard requiredLevel={2}>
                <EventOrderPage />
              </RoleGuard>
            ),
            index: true,
          },
          {
            path: 'list',
            element: (
              <RoleGuard requiredLevel={2}>
                <EventOrderPage />
              </RoleGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleGuard requiredLevel={2}>
                <EventOrderDetailsPage />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'autoEcole',
        children: [
          {
            element: (
              <RoleGuard requiredLevel={3}>
                <AutoEcoleListPage />
              </RoleGuard>
            ),
            index: true,
          },
          // { path: 'profile/:id', element: <UserProfilePage /> },
          {
            path: 'cards',
            element: (
              <RoleGuard requiredLevel={3}>
                <AutoEcoleCardsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'list',
            element: (
              <RoleGuard requiredLevel={3}>
                <AutoEcoleListPage />
              </RoleGuard>
            ),
          },
          {
            path: 'new',
            element: (
              <RoleGuard requiredLevel={3}>
                <AutoEcoleCreatePage />
              </RoleGuard>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <RoleGuard requiredLevel={3}>
                <AutoEcoleEditPage />
              </RoleGuard>
            ),
          },
          // { path: 'account/:id', element: <UserAccountPage /> },
        ],
      },
      {
        path: 'post',
        children: [
          {
            element: (
              <RoleGuard requiredLevel={2}>
                <BlogPostsPage />
              </RoleGuard>
            ),
            index: true,
          },
          {
            path: 'posts',
            element: (
              <RoleGuard requiredLevel={2}>
                <BlogPostsPage />
              </RoleGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleGuard requiredLevel={2}>
                <BlogPostPage />
              </RoleGuard>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <RoleGuard requiredLevel={2}>
                <BlogEditPostPage />
              </RoleGuard>
            ),
          },
          {
            path: 'new',
            element: (
              <RoleGuard requiredLevel={2}>
                <BlogNewPostPage />
              </RoleGuard>
            ),
          },
          {
            path: 'categories',
            element: (
              <RoleGuard requiredLevel={2}>
                <PostCategoryPage />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'qr-scanner',
        children: [
          {
            element: (
              <RoleGuard requiredLevel={2}>
                <QrScannerPage />
              </RoleGuard>
            ),
            index: true,
          },
        ],
      },
      {
        path: 'calendar',
        element: (
          <RoleGuard requiredLevel={2}>
            <CalendarPage />
          </RoleGuard>
        ),
      },
      {
        path: 'kanban',
        element: (
          <RoleGuard requiredLevel={3}>
            <KanbanPage />
          </RoleGuard>
        ),
      },
      {
        path: 'data-export',
        element: (
          <RoleGuard requiredLevel={3}>
            <DataExportPage />
          </RoleGuard>
        ),
      },
      {
        path: 'file-manager',
        element: (
          <RoleGuard requiredLevel={3}>
            <FileManagerPage />
          </RoleGuard>
        ),
      },
    ],
  },
];
