import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { getAutoEcoles } from 'src/hooks/use-auto-ecole';
import { AutolEcoleListView } from 'src/sections/auto-ecole/view';
import { BlankView } from 'src/sections/blank/view';

// ----------------------------------------------------------------------

const metadata = {
  title: `Auto Ecole | Dashboard - ${CONFIG.name}`,
};

export default function Page() {
  const [autoEcoles, setAutoEcoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAutoEcoles = async () => {
      try {
        setLoading(true);
        const result = await getAutoEcoles();

        if (result.success) {
          setAutoEcoles(result.data);
        } else {
          setError(new Error('Échec du chargement des données'));
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAutoEcoles();
  }, []);

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AutolEcoleListView data={autoEcoles} loading={loading} error={error} />
    </>
  );
}
