import { Helmet } from 'react-helmet-async';

import { useAutoEcoles } from 'src/hooks/use-auto-ecole';

import { CONFIG } from 'src/config-global';

import { AutolEcoleListView } from 'src/sections/auto-ecole/view';

// ----------------------------------------------------------------------

const metadata = {
  title: `Auto Ecole | Dashboard - ${CONFIG.name}`,
};

export default function Page() {
  const { data, loading, error } = useAutoEcoles();

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AutolEcoleListView data={data} loading={loading} error={error} />
    </>
  );
}
