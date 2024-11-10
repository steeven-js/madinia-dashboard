import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { AutolEcoleCreateView } from 'src/sections/auto-ecole/view';

// ----------------------------------------------------------------------

const metadata = { title: `New Auto Ecole | Dashboard - ${CONFIG.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AutolEcoleCreateView />
    </>
  );
}
