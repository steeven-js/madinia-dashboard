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

// Définition des éléments de navigation de base
const navItems = {
  // Overview - accessible à tous les niveaux
  overview: {
    subheader: 'Dashboard',
    items: [{ title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard }],
  },

  // QR Scanner - accessible aux administrateurs et supérieurs
  qrScanner: {
    subheader: 'Outils',
    items: [{ title: 'Qr Scanner', path: paths.dashboard.qrScanner.root, icon: ICONS.dashboard }],
  },

  // Blog - accessible aux administrateurs et supérieurs
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

  // Event - accessible aux administrateurs et supérieurs
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

  // Event Orders - accessible aux administrateurs et supérieurs
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

  // Management - accessible uniquement aux développeurs et super admins
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
      { title: 'Calendrier', path: paths.dashboard.calendar, icon: ICONS.calendar },
      { title: 'Kanban', path: paths.dashboard.kanban, icon: ICONS.kanban },
    ],
  },
};

// Configuration de navigation basée sur les niveaux de rôles
const navConfigByLevel = {
  // Niveau 4 (super_admin) - Accès complet
  4: [
    navItems.overview,
    navItems.qrScanner,
    navItems.blog,
    navItems.event,
    navItems.eventOrders,
    navItems.management,
  ],

  // Niveau 3 (dev) - Accès complet
  3: [
    navItems.overview,
    navItems.qrScanner,
    navItems.blog,
    navItems.event,
    navItems.eventOrders,
    navItems.management,
  ],

  // Niveau 2 (admin) - Accès limité
  2: [navItems.overview, navItems.qrScanner, navItems.blog, navItems.event, navItems.eventOrders],

  // Niveau 1 (user) - Accès minimal
  1: [navItems.overview],

  // Niveau 0 (par défaut) - Accès minimal
  0: [navItems.overview],
};

/**
 * Obtient les données de navigation en fonction du rôle de l'utilisateur
 * @param {string} role - Le rôle de l'utilisateur
 * @returns {Array} - Les éléments de navigation correspondant au niveau du rôle
 */
export const getNavDataByRole = (role) => {
  const roleLevel = CONFIG.roles[role]?.level || 0;
  return navConfigByLevel[roleLevel] || navConfigByLevel[0];
};

// Pour la compatibilité avec le code existant
export const navData = navConfigByLevel[3]; // dev
export const navDataAdmin = navConfigByLevel[2]; // admin
export const navDataUser = navConfigByLevel[1]; // user
