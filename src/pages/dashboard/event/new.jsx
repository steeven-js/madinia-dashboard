import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { EventCreateView } from 'src/sections/event/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new event | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <EventCreateView />
    </>
  );
}
