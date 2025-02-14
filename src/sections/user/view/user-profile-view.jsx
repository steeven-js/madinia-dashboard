import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { useTabs } from 'src/hooks/use-tabs';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProfileHome } from '../profile-home';
import { ProfileCover } from '../profile-cover';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'profile', label: 'Profil', icon: <Iconify icon="solar:user-id-bold" width={24} /> },
];

// ----------------------------------------------------------------------

export function UserProfileView({ user }) {
  const tabs = useTabs('profile');

  // const handleSearchFriends = useCallback((event) => {
  //   setSearchFriends(event.target.value);
  // }, []);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Profil"
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: 'Utilisateur', href: paths.dashboard.user.root },
          { name: user?.displayName },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ mb: 3, height: 290 }}>
        <ProfileCover
          role={user?.role}
          name={user?.displayName}
          avatarUrl={user?.avatarUrl}
          coverUrl="/assets/background/cover_1.jpg"
        />

        <Box
          display="flex"
          justifyContent={{ xs: 'center', md: 'flex-end' }}
          sx={{
            width: 1,
            bottom: 0,
            zIndex: 9,
            px: { md: 3 },
            position: 'absolute',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs value={tabs.value} onChange={tabs.onChange}>
            {TABS.map((tab) => (
              <Tab key={tab.value} value={tab.value} icon={tab.icon} label={tab.label} />
            ))}
          </Tabs>
        </Box>
      </Card>

      {tabs.value === 'profile' && <ProfileHome info={user} />}
    </DashboardContent>
  );
}
