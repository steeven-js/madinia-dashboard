import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from 'src/hooks/use-auth';

import { CONFIG } from 'src/config-global';

import { EmptyContent } from 'src/components/empty-content';
import { UserProfileView } from 'src/sections/user/view';

// ----------------------------------------------------------------------

const metadata = { title: `Mon profil | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!userProfile) {
    return (
      <EmptyContent
        title="Profil non trouvé"
        description="Le profil que vous recherchez n'existe pas ou a été supprimé"
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <UserProfileView user={userProfile} />
    </>
  );
}
