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
  // console.log('role:', currentAuthRole);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {currentAuthLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : currentAuthRole.length === 0 ? (
        <EmptyContent title="Aucun Overview" />
      ) : currentAuthRole === CONFIG.roles.admin || CONFIG.roles.user ? (
        <AdminOverviewAppPage />
      ) : (
        <OverviewAppPage />
      )}
    </>
  );
}
