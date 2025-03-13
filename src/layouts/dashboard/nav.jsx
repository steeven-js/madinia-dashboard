import { getNavDataByRole } from 'src/layouts/config-nav-dashboard';

const renderContent = (
  <Scrollbar
    sx={{
      height: 1,
      '& .simplebar-content': {
        height: 1,
        display: 'flex',
        flexDirection: 'column',
      },
    }}
  >
    <Logo sx={{ mt: 3, ml: 4, mb: 1 }} />

    <NavSectionVertical
      data={getNavDataByRole(currentRole)}
      config={{
        currentRole,
      }}
    />

    <Box sx={{ flexGrow: 1 }} />

    {!isCollapse && <NavDocs />}
  </Scrollbar>
);
