import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { NavigationBarView } from 'src/sections/_examples/extra/navigation-bar-view';

// ----------------------------------------------------------------------

const metadata = { title: `Navigation bar | Components - ${CONFIG.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <NavigationBarView />
    </>
  );
}
