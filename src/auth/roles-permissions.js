// Définition des rôles par ordre hiérarchique (du plus élevé au plus bas)
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    USER: 'user',
};

// Définition des permissions par rôle
export const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: [
        'manage_all',
        'manage_admins',
        'manage_roles',
        'access_all_features',
        'manage_users',
        'manage_content',
        'view_analytics',
        'manage_settings',
        'manage_auto_ecoles',
        'manage_events',
        'manage_blog',
    ],
    [ROLES.ADMIN]: [
        'manage_users',
        'manage_content',
        'view_analytics',
        'manage_settings',
        'manage_auto_ecoles',
        'manage_events',
        'manage_blog',
    ],
    [ROLES.MANAGER]: [
        'manage_content',
        'view_analytics',
        'manage_auto_ecoles',
        'manage_events',
        'manage_blog',
    ],
    [ROLES.USER]: [
        'view_content',
        'manage_profile',
    ],
};

// Fonction pour vérifier si un rôle a une permission spécifique
export const hasPermission = (role, permission) => {
    if (!role || !permission) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

// Fonction pour vérifier si un rôle peut accéder à un autre rôle (hiérarchie)
export const canManageRole = (currentRole, targetRole) => {
    const roleHierarchy = Object.values(ROLES);
    const currentRoleIndex = roleHierarchy.indexOf(currentRole);
    const targetRoleIndex = roleHierarchy.indexOf(targetRole);
    return currentRoleIndex < targetRoleIndex;
};

// Configuration des routes par rôle
export const ROLE_ROUTES = {
    [ROLES.SUPER_ADMIN]: [
        'dashboard',
        'users',
        'roles',
        'settings',
        'analytics',
        'auto-ecoles',
        'events',
        'blog',
    ],
    [ROLES.ADMIN]: [
        'dashboard',
        'users',
        'settings',
        'analytics',
        'auto-ecoles',
        'events',
        'blog',
    ],
    [ROLES.MANAGER]: [
        'dashboard',
        'auto-ecoles',
        'events',
        'blog',
    ],
    [ROLES.USER]: [
        'dashboard',
        'profile',
    ],
};

// Hook personnalisé pour la gestion des permissions
export const usePermissions = (userRole) => ({
        hasPermission: (permission) => hasPermission(userRole, permission),
        canManageRole: (targetRole) => canManageRole(userRole, targetRole),
        allowedRoutes: ROLE_ROUTES[userRole] || ROLE_ROUTES[ROLES.USER],
        role: userRole,
    });
