import { Box, CircularProgress } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { EmptyContent } from 'src/components/empty-content';

import { CONFIG } from 'src/config-global';
import { useUsersData } from 'src/hooks/use-users';
import { BlankView } from 'src/sections/blank/view';

import { UserListView } from 'src/sections/user/view';

// ----------------------------------------------------------------------

const metadata = { title: `User list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { users, loading: usersLoading } = useUsersData();

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {usersLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <EmptyContent title="Aucun post" />
      ) : (
        <UserListView users={users} />
      )}
    </>
  );
}
