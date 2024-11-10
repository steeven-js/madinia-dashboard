import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AutoEcoleNewEditForm } from '../auto-ecole-new-edit-form';

// ----------------------------------------------------------------------

export function AutolEcoleCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Enregistrer une nouvelle auto-école"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Auto Ecoles', href: paths.dashboard.user.root },
          { name: 'Nouvelle auto école' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AutoEcoleNewEditForm />
    </DashboardContent>
  );
}
