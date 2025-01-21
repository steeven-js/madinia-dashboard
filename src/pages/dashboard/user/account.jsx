import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useUserById } from 'src/hooks/use-users';
import { useAuth } from 'src/hooks/use-auth';

import { CONFIG } from 'src/config-global';

import { AccountView } from 'src/sections/account/view';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

const metadata = { title: `Paramètres du compte | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();
  const { user, loading } = useUserById(id);
  const { user: userAuth } = useAuth();

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : !user ? (
        <EmptyContent
          title="Aucun utilisateur trouvé"
          description="L'utilisateur que vous recherchez n'existe pas ou a été supprimé"
        />
      ) : (
        <AccountView user={userAuth} userProfile={user} />
      )}
    </>
  );
}
