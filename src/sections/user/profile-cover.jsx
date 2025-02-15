import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
// import { useTheme } from '@mui/material/styles';
// import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { varAlpha, bgGradient } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ProfileCover({ name, avatarUrl, role, coverUrl }) {
  const theme = useTheme();
  const router = useRouter();

  const buttonStyles = {
    ml: 2,
    color: 'common.white',
    backgroundColor: alpha('#fff', 0.12),
    backdropFilter: 'blur(6px)',
    border: `1px solid ${alpha('#fff', 0.24)}`,
    boxShadow: `0 0 8px 0 ${alpha('#fff', 0.24)}`,
    '&:hover': {
      backgroundColor: alpha('#fff', 0.24),
      border: `1px solid ${alpha('#fff', 0.32)}`,
      boxShadow: `0 0 12px 0 ${alpha('#fff', 0.32)}`,
    },
    '&:active': {
      backgroundColor: alpha('#fff', 0.32),
    },
    width: 40,
    height: 40,
    transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color'], {
      duration: theme.transitions.duration.shorter,
    }),
  };

  return (
    <Box
      sx={{
        ...bgGradient({
          color: `0deg, ${varAlpha(
            theme.vars.palette.primary.darkerChannel,
            0.8
          )}, ${varAlpha(theme.vars.palette.primary.darkerChannel, 0.8)}`,
          imgUrl: coverUrl || '/assets/background/cover_1.jpg',
        }),
        height: 1,
        color: 'common.white',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{
          left: { xs: 16, md: 24 },
          bottom: { xs: 24, md: 24 },
          zIndex: { xs: 10, md: 10 },
          position: 'absolute',
          color: 'common.white',
        }}
      >
        <Avatar
          src={avatarUrl}
          alt={name}
          sx={{
            mx: 'auto',
            width: { xs: 64, md: 128 },
            height: { xs: 64, md: 128 },
            border: `solid 2px ${theme.palette.common.white}`,
          }}
        >
          {name?.charAt(0).toUpperCase()}
        </Avatar>

        <Stack
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ mt: { xs: 1, md: 'auto' }, ml: { xs: 0, md: 2 } }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h4">{name}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.72 }}>
              {role}
            </Typography>
          </Stack>

          <IconButton onClick={() => router.push(paths.dashboard.user.account)} sx={buttonStyles}>
            <Iconify
              icon="solar:pen-bold"
              width={20}
              sx={{
                filter: 'drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.4))',
              }}
            />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}

ProfileCover.propTypes = {
  avatarUrl: PropTypes.string,
  coverUrl: PropTypes.string,
  name: PropTypes.string,
  role: PropTypes.string,
};
