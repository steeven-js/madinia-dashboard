import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { UploadView } from 'src/sections/_examples/extra/upload-view';

// ----------------------------------------------------------------------

const metadata = { title: `Upload | Components - ${CONFIG.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <UploadView />
    </>
  );
}
