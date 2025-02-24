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

    // Logique pour déterminer quelle vue afficher selon le rôle
    switch (currentAuthRole) {
      case 'super_admin':
        return <OverviewAppView />;

      case 'admin':
      case 'dev':
        return <AdminOverviewAppPage />;

      case 'user':
        return <AdminOverviewAppPage />;

      default:
        return <EmptyContent title="Accès non autorisé" />;
    }
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
