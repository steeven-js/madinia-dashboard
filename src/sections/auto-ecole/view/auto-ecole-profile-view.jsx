// ----------------------------------------------------------------------

import { Button } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { BlankView } from 'src/sections/blank/view';

export function AutolEcoleProfileView() {
  return (
    <DashboardContent>
        <CustomBreadcrumbs
          heading="Auto-école profile"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Auto-école', href: paths.dashboard.autoEcole.root },
            { name: 'Profile' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.autoEcole.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New auto-école
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <BlankView />
      </DashboardContent>
  );
}
