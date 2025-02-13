import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';
import { ProfileGuard } from 'src/auth/guard/profile-guard';

// ----------------------------------------------------------------------

// Overview
const IndexPage = lazy(() => import('src/pages/dashboard'));
const CompleteProfilePage = lazy(() => import('src/pages/dashboard/complete-profile'));
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

// ----------------------------------------------------------------------

const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <ProfileGuard>
        <Outlet />
      </ProfileGuard>
    </Suspense>
  </DashboardLayout>
);

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? <>{layoutContent}</> : <AuthGuard>{layoutContent}</AuthGuard>,
    children: [
      { element: <IndexPage />, index: true },
      { path: 'complete-profile', element: <CompleteProfilePage /> },
      {
        path: 'user',
        children: [
          { element: <UserProfilePage />, index: true },
          { path: 'profile/:id', element: <UserProfilePage /> },
          { path: 'cards', element: <UserCardsPage /> },
          { path: 'list', element: <UserListPage /> },
          { path: 'new', element: <UserCreatePage /> },
          { path: ':id/edit', element: <UserEditPage /> },
          { path: 'account/:id', element: <UserAccountPage /> },
        ],
      },
      {
        path: 'event',
        children: [
          { element: <EventListPage />, index: true },
          { path: 'list', element: <EventListPage /> },
          { path: ':id', element: <EventDetailsPage /> },
          { path: ':id/edit', element: <EventEditPage /> },
          { path: 'new', element: <EventCreatePage /> },
        ],
      },
      {
        path: 'ev_order',
        children: [
          { element: <EventOrderPage />, index: true },
          { path: 'list', element: <EventOrderPage /> },
          { path: ':id', element: <EventOrderDetailsPage /> },
        ],
      },
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
      {
        path: 'post',
        children: [
          { element: <BlogPostsPage />, index: true },
          { path: 'posts', element: <BlogPostsPage /> },
          { path: ':id', element: <BlogPostPage /> },
          { path: ':id/edit', element: <BlogEditPostPage /> },
          { path: 'new', element: <BlogNewPostPage /> },
          { path: 'categories', element: <PostCategoryPage /> },
        ],
      },
      {
        path: 'qr-scanner',
        children: [{ element: <QrScannerPage />, index: true }],
      },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'kanban', element: <KanbanPage /> },
    ],
  },
];
