import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EventNewEditForm } from '../event-new-edit-form';

// ----------------------------------------------------------------------

export function EventCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new event"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Event', href: paths.dashboard.event.root },
          { name: 'New event' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EventNewEditForm />
    </DashboardContent>
  );
}
