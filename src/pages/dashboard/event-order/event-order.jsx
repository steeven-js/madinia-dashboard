import { Helmet } from 'react-helmet-async';

import { EventOrderListView } from 'src/sections/event-order/view';

// ----------------------------------------------------------------------

export default function EventOrderPage() {
  return (
    <>
      <Helmet>
        <title> Event Orders | Madin.IA</title>
      </Helmet>

      <EventOrderListView />
    </>
  );
}
