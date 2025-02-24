import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
};

// ----------------------------------------------------------------------

const baseNavItems = {
  overview: {
    subheader: 'Overview',
    items: [{ title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard }],
  },
  blog: {
    subheader: 'Blog',
    items: [
      {
        title: 'Blog',
        path: paths.dashboard.post.root,
        icon: ICONS.blog,
        children: [
          { title: 'Posts', path: paths.dashboard.post.root },
          { title: 'Create', path: paths.dashboard.post.new },
          { title: 'Categories', path: paths.dashboard.post.categories },
        ],
      },
    ],
  },
  event: {
    subheader: 'Event',
    items: [
      {
        title: 'Event',
        path: paths.dashboard.event.root,
        icon: ICONS.blog,
        children: [
          { title: 'List', path: paths.dashboard.event.root },
          { title: 'Create', path: paths.dashboard.event.new },
        ],
      },
    ],
  },
  eventOrders: {
    subheader: 'Event Orders',
    items: [
      {
        title: 'Event Orders',
        path: paths.dashboard.eventOrder.root,
        icon: ICONS.order,
        children: [{ title: 'List', path: paths.dashboard.eventOrder.root }],
      },
    ],
  },
  management: {
    subheader: 'Management',
    items: [
      {
        title: 'User',
        path: paths.dashboard.user.root,
        icon: ICONS.user,
        children: [
          { title: 'Cards', path: paths.dashboard.user.cards },
          { title: 'List', path: paths.dashboard.user.list },
        ],
      },
      {
        title: 'AutoEcole',
        path: paths.dashboard.autoEcole.root,
        icon: ICONS.user,
        children: [
          { title: 'Cards', path: paths.dashboard.autoEcole.cards },
          { title: 'List', path: paths.dashboard.autoEcole.list },
          { title: 'New', path: paths.dashboard.autoEcole.new },
        ],
      },
      { title: 'Calendar', path: paths.dashboard.calendar, icon: ICONS.calendar },
      { title: 'Kanban', path: paths.dashboard.kanban, icon: ICONS.kanban },
    ],
  },
};

// Role-based navigation configurations
const roleNavConfig = {
  super_admin: [
    baseNavItems.overview,
    baseNavItems.blog,
    baseNavItems.event,
    baseNavItems.eventOrders,
    baseNavItems.management,
  ],
  dev: [
    baseNavItems.overview,
    baseNavItems.blog,
    baseNavItems.event,
    baseNavItems.eventOrders,
    baseNavItems.management,
  ],
  admin: [
    baseNavItems.overview,
    baseNavItems.blog,
    baseNavItems.event,
    baseNavItems.eventOrders,
    baseNavItems.management,
  ],
  user: [baseNavItems.overview],
};

export const getNavDataByRole = (role) => roleNavConfig[role] || roleNavConfig.user;

// Pour la compatibilité avec le code existant
export const navData = roleNavConfig.dev;
export const navDataAdmin = roleNavConfig.admin;
export const navDataUser = roleNavConfig.user;
