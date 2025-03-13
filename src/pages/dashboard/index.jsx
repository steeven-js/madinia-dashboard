import { Helmet } from 'react-helmet-async';

import { Box, CircularProgress } from '@mui/material';

import { useAuth } from 'src/hooks/use-auth';

import { CONFIG } from 'src/config-global';

import { EmptyContent } from 'src/components/empty-content';

import { OverviewAppView } from 'src/sections/overview/app/view';

import AdminOverviewAppPage from './admin';

// ----------------------------------------------------------------------

const metadata = { title: `Dashboard - ${CONFIG.name}` };

export default function OverviewAppPage() {
  const { currentAuthRole, loading } = useAuth();

  // const { currentAuthRole, isAuthenticated, loading } = useAuth();

  // console.log('currentAuthRole:', currentAuthRole);

  // console.log('Auth State:', {
  //   currentAuthRole,
  //   isAuthenticated,
  //   loading,
  // });

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      );
    }

    if (!currentAuthRole) {
      return <EmptyContent title="Aucun Overview" />;
    }

    // Récupérer le niveau du rôle actuel
    const roleLevel = CONFIG.roles[currentAuthRole]?.level || 0;

    // Logique pour déterminer quelle vue afficher selon le niveau du rôle
    if (roleLevel >= CONFIG.roles.super_admin.level) {
      return <OverviewAppView />;
    }

    if (roleLevel >= CONFIG.roles.admin.level) {
      return <AdminOverviewAppPage />;
    }

    if (roleLevel >= CONFIG.roles.user.level) {
      return <AdminOverviewAppPage />;
    }

    return <EmptyContent title="Accès non autorisé" />;
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      {renderContent()}
    </>
  );
}
