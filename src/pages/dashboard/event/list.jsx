import { Helmet } from 'react-helmet-async';

import { Box, CircularProgress } from '@mui/material';

import { useEvents } from 'src/hooks/use-event';

import { CONFIG } from 'src/config-global';

import { EventListView } from 'src/sections/event/view';

// ----------------------------------------------------------------------

const metadata = { title: `Événementss Madin.IA | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { events, loading } = useEvents();
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : (
        <EventListView events={events} />
      )}
    </>
  );
}
