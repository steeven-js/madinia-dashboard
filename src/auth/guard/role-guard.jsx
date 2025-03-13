import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { ForbiddenIllustration } from 'src/assets/illustrations';
import { varBounce, MotionContainer } from 'src/components/animate';

import {
  selectCurrentUser,
  selectRoleLevel,
  selectUserRole,
  selectIsAuthenticated,
} from 'src/store/slices/authSlice';

// ----------------------------------------------------------------------

export function RoleGuard({ children, requiredLevel = 1, acceptRoles = [], hasContent = true }) {
  const user = useSelector(selectCurrentUser);
  const roleLevel = useSelector(selectRoleLevel);
  const userRole = useSelector(selectUserRole);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector((state) => state.auth.isLoading);
  const { pathname } = useLocation();

  // console.log('user:', user);

  if (isLoading) {
    return null; // Ou un composant de chargement
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!isAuthenticated || !user) {
    return <Navigate to={paths.auth.login} state={{ from: pathname }} replace />;
  }

  // Vérifier si l'utilisateur a un rôle accepté (si des rôles sont spécifiés)
  const hasAcceptableRole = !acceptRoles.length || acceptRoles.includes(userRole);

  // Vérifier si l'utilisateur a un niveau suffisant
  const hasRequiredLevel = roleLevel >= requiredLevel;

  // L'utilisateur doit satisfaire les deux conditions
  const isAllowed = hasAcceptableRole && hasRequiredLevel;

  // Si l'utilisateur n'a pas les permissions nécessaires, afficher l'écran d'accès refusé
  if (!isAllowed) {
    return hasContent ? (
      <Container component={MotionContainer} sx={{ textAlign: 'center' }}>
        <m.div variants={varBounce().in}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Accès refusé
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Typography sx={{ color: 'text.secondary' }}>
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <ForbiddenIllustration sx={{ my: { xs: 5, sm: 10 } }} />
        </m.div>
      </Container>
    ) : null;
  }

  return children;
}

RoleGuard.propTypes = {
  children: PropTypes.node,
  requiredLevel: PropTypes.number,
  acceptRoles: PropTypes.arrayOf(PropTypes.string),
  hasContent: PropTypes.bool,
};
