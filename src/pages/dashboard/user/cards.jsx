import { Helmet } from 'react-helmet-async';
import { Box, CircularProgress } from '@mui/material';

import { CONFIG } from 'src/config-global';
import { useUsers } from 'src/hooks/use-users';
import { EmptyContent } from 'src/components/empty-content';
import { UserCardsView } from 'src/sections/user/view';

// ----------------------------------------------------------------------

const metadata = { title: `Liste des utilisateurs | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { users, loading } = useUsers();

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <EmptyContent title="Aucun utilisateur" />
      ) : (
        <UserCardsView users={users} />
      )}
    </>
  );
}
