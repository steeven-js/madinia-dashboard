import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EventNewEditForm } from '../event-new-edit-form';

// ----------------------------------------------------------------------

export function EventEditView({ event }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modifier"
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: 'Événement', href: paths.dashboard.event.root },
          { name: event?.title },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EventNewEditForm event={event} />
    </DashboardContent>
  );
}
