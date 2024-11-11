import { Helmet } from 'react-helmet-async';

import { Box, CircularProgress } from '@mui/material';

import { useUsers } from 'src/hooks/use-users';

import { CONFIG } from 'src/config-global';

import { EmptyContent } from 'src/components/empty-content';

import { UserListView } from 'src/sections/user/view';

// ----------------------------------------------------------------------

const metadata = { title: `User list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { users, loading } = useUsers();

  console.log('users:', users);

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
        <EmptyContent title="Aucun post" />
      ) : (
        <UserListView users={users} />
      )}
    </>
  );
}
