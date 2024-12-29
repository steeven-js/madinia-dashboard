import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { QrScannerView } from 'src/sections/qr-scanner/view';

// ----------------------------------------------------------------------

const metadata = { title: `Qr Scanner | Dashboard - ${CONFIG.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <QrScannerView />
    </>
  );
}
