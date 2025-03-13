import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AutoEcoleCardList } from '../auto-ecole-card-list';

// ----------------------------------------------------------------------

export function AutolEcoleCardsView({ autoEcoles, error }) {
  // console.log('autoEcoles', autoEcoles);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Auto écoles"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Auto-écoles', href: paths.dashboard.autoEcole.root },
          { name: 'Cards' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.autoEcole.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Créer une auto-école
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <AutoEcoleCardList autoEcoles={autoEcoles} error={error} />
    </DashboardContent>
  );
}
