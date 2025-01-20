import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function EventOrderDetailsItems({ event, totalAmount }) {
  return (
    <Card>
      <CardHeader
        title="Détails de l'événement"
        action={
          <IconButton>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        }
      />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">{event?.title}</Typography>

          <Stack direction="row" justifyContent="space-between">
            <Box sx={{ color: 'text.secondary' }}>Date prévue</Box>
            <Typography>{fDateTime(event?.scheduled_date)}</Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between">
            <Box sx={{ color: 'text.secondary' }}>Prix de l'événement</Box>
            <Typography>{fCurrency(event?.price)}</Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between">
            <Box sx={{ color: 'text.secondary' }}>Statut de l'événement</Box>
            <Typography sx={{ textTransform: 'capitalize' }}>{event?.status}</Typography>
          </Stack>
        </Stack>

        <Stack
          spacing={2}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.neutral',
          }}
        >
          <Typography variant="subtitle1">Montant total</Typography>
          <Typography variant="subtitle1">{fCurrency(totalAmount)}</Typography>
        </Stack>
      </Stack>
    </Card>
  );
}
