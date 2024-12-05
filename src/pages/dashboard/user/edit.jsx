import { Helmet } from 'react-helmet-async';

import { Box, CircularProgress } from '@mui/material';

import { useParams } from 'src/routes/hooks';

import { useUserById } from 'src/hooks/use-users';

import { CONFIG } from 'src/config-global';

import { UserEditView } from 'src/sections/user/view';

// ----------------------------------------------------------------------

const metadata = { title: `User edit | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const { user, loading } = useUserById(id);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : (
        <UserEditView user={user} />
      )}
    </>
  );
}
