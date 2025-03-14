import PropTypes from 'prop-types';

import { RoleGuard } from './role-guard';

// ----------------------------------------------------------------------

// Ce composant est maintenu pour la compatibilité avec le code existant
// Il réutilise simplement le RoleGuard avec les props appropriés
export function RoleBasedGuard({ children, hasContent = false, currentRole, acceptRoles, sx }) {
  return (
    <RoleGuard hasContent={hasContent} acceptRoles={acceptRoles} sx={sx}>
      {children}
    </RoleGuard>
  );
}

RoleBasedGuard.propTypes = {
  children: PropTypes.node,
  hasContent: PropTypes.bool,
  currentRole: PropTypes.string, // Maintenu pour la compatibilité, mais non utilisé
  acceptRoles: PropTypes.arrayOf(PropTypes.string),
  sx: PropTypes.shape({}),
};
