import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';

import { Box, CircularProgress } from '@mui/material';

import { CONFIG } from 'src/config-global';

import { EmptyContent } from 'src/components/empty-content';

import { OverviewAppView } from 'src/sections/overview/app/view';

import AdminOverviewAppPage from './admin';

// ----------------------------------------------------------------------

const metadata = { title: `Dashboard - ${CONFIG.name}` };

export default function OverviewAppPage() {
  const currentAuthRole = useSelector((state) => state.auth.role);
  const currentAuthLoading = useSelector((state) => state.auth.isLoading);

  const renderContent = () => {
    if (currentAuthLoading) {
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
      case CONFIG.roles.dev:
        return <OverviewAppView />;

      case CONFIG.roles.super_admin:
        return <AdminOverviewAppPage />;

      case CONFIG.roles.admin:
      case CONFIG.roles.user:
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
