import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { _mock } from 'src/_mock';
import { varAlpha } from 'src/theme/styles';
import { AvatarShape } from 'src/assets/illustrations';

import { Image } from 'src/components/image';

// ----------------------------------------------------------------------

export function UserCard({ user, index, sx, ...other }) {
  return (
    <Card sx={{ textAlign: 'center', ...sx }} {...other}>
      <Box sx={{ position: 'relative' }}>
        <AvatarShape
          sx={{
            left: 0,
            right: 0,
            zIndex: 10,
            mx: 'auto',
            bottom: -26,
            position: 'absolute',
          }}
        />

        <Avatar
          alt={user.displayName}
          src={user.avatarUrl}
          sx={{
            width: 64,
            height: 64,
            zIndex: 11,
            left: 0,
            right: 0,
            bottom: -32,
            mx: 'auto',
            position: 'absolute',
          }}
        />

        <Image
          src={user.coverUrl || _mock.image.cover(index)}
          alt={user.displayName}
          ratio="16/9"
          slotProps={{
            overlay: {
              bgcolor: (theme) => varAlpha(theme.vars.palette.common.blackChannel, 0.48),
            },
          }}
        />
      </Box>

      <ListItemText
        sx={{ mt: 7, mb: 1 }}
        primary={user.displayName}
        secondary={user.about || user.role}
        primaryTypographyProps={{ typography: 'subtitle1' }}
        secondaryTypographyProps={{ component: 'span', mt: 0.5 }}
      />

      <Stack direction="row" alignItems="center" justifyContent="center" sx={{ mb: 2.5 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {user.email}
        </Typography>
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        display="grid"
        gridTemplateColumns="repeat(2, 1fr)"
        sx={{ py: 3, typography: 'subtitle1' }}
      >
        <div>
          <Typography variant="caption" component="div" sx={{ mb: 0.5, color: 'text.secondary' }}>
            Ville
          </Typography>
          <Typography
            variant="body2"
            sx={{
              textTransform: 'lowercase',
              fontSize: '0.875rem',
            }}
          >
            {user.city || 'Non renseigné'}
          </Typography>
        </div>

        <div>
          <Typography variant="caption" component="div" sx={{ mb: 0.5, color: 'text.secondary' }}>
            Entreprise
          </Typography>
          <Typography
            variant="body2"
            sx={{
              textTransform: 'lowercase',
              fontSize: '0.875rem',
            }}
          >
            {user.company || 'Non renseigné'}
          </Typography>
        </div>
      </Box>
    </Card>
  );
}
