import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AutoEcoleNewEditForm } from '../auto-ecole-new-edit-form';

// ----------------------------------------------------------------------

export function AutolEcoleEditView({ currentAutoEcole }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Auto Ecole', href: paths.dashboard.autoEcole.root },
          { name: currentAutoEcole?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AutoEcoleNewEditForm currentAutoEcole={currentAutoEcole} />
    </DashboardContent>
  );
}
