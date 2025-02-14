import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from 'src/hooks/use-auth';
import { useUserById } from 'src/hooks/use-users';

import { CONFIG } from 'src/config-global';

import { EmptyContent } from 'src/components/empty-content';

import { AccountView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

const metadata = { title: `Paramètres du compte | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { user: userAuth, loading: authLoading } = useAuth();
  const { user, loading: userLoading } = useUserById(userAuth?.uid);

  // console.log('Auth Debug:', {
  //   authLoading,
  //   userAuth,
  //   userAuthId: userAuth?.uid,
  //   userLoading,
  //   user,
  // });

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!userAuth) {
    return (
      <EmptyContent
        title="Accès non autorisé"
        description="Vous devez être connecté pour accéder à cette page"
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      {userLoading ? (
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
