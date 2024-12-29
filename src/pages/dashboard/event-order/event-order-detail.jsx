import { Helmet } from 'react-helmet-async';

import { EventOrderDetailsView } from 'src/sections/event-order/view';

// ----------------------------------------------------------------------

export default function EventOrderDetailPage() {
  return (
    <>
      <Helmet>
        <title> Event Order Details | Madin.IA</title>
      </Helmet>

      <EventOrderDetailsView />
    </>
  );
}
