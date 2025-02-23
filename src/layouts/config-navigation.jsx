import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';

import { ROLES } from 'src/auth/roles-permissions';

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

export const navConfig = {
    // Routes communes à tous les rôles
    common: [
        {
            subheader: 'Overview',
            items: [
                { title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard },
            ],
        },
    ],

    // Routes spécifiques par rôle
    [ROLES.SUPER_ADMIN]: [
        {
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
                { title: 'Roles', path: paths.dashboard.roles.root, icon: ICONS.lock },
                { title: 'Calendar', path: paths.dashboard.calendar, icon: ICONS.calendar },
                { title: 'Kanban', path: paths.dashboard.kanban, icon: ICONS.kanban },
            ],
        },
    ],

    [ROLES.ADMIN]: [
        {
            subheader: 'Management',
            items: [
                {
                    title: 'User',
                    path: paths.dashboard.user.root,
                    icon: ICONS.user,
                    children: [
                        { title: 'List', path: paths.dashboard.user.list },
                    ],
                },
                { title: 'Calendar', path: paths.dashboard.calendar, icon: ICONS.calendar },
            ],
        },
    ],

    [ROLES.USER]: [
        {
            subheader: 'User',
            items: [
                { title: 'Profile', path: paths.dashboard.user.profile, icon: ICONS.user },
                { title: 'Calendar', path: paths.dashboard.calendar, icon: ICONS.calendar },
            ],
        },
    ],
};

// Fonction pour obtenir les routes en fonction du rôle
export function getNavDataByRole(role) {
    const userRole = role || ROLES.USER;
    return [...navConfig.common, ...(navConfig[userRole] || [])];
}
