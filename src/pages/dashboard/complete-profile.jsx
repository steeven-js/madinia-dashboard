import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import CompleteProfileView from 'src/sections/complete-profile/view/complete-profile-view';

// ----------------------------------------------------------------------

const metadata = { title: `Compléter votre profil | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <CompleteProfileView />
    </>
  );
}
