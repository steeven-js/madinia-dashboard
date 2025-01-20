import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function EventOrderDetailsInfo({ customerName, customerEmail, sessionId, qrCode }) {
  const renderCustomer = (
    <>
      <CardHeader
        title="Informations client"
        action={
          <IconButton>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        }
      />
      <Stack spacing={1.5} sx={{ p: 3, typography: 'body2' }}>
        <Stack direction="row">
          <Box component="span" sx={{ color: 'text.secondary', width: 120, flexShrink: 0 }}>
            Nom
          </Box>
          {customerName || 'N/A'}
        </Stack>

        <Stack direction="row">
          <Box component="span" sx={{ color: 'text.secondary', width: 120, flexShrink: 0 }}>
            Email
          </Box>
          {customerEmail || 'N/A'}
        </Stack>
      </Stack>
    </>
  );

  const renderPayment = (
    <>
      <CardHeader
        title="Informations de paiement"
        action={
          <IconButton>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        }
      />
      <Stack spacing={1.5} sx={{ p: 3, typography: 'body2' }}>
        <Stack direction="row">
          <Box component="span" sx={{ color: 'text.secondary', width: 120, flexShrink: 0 }}>
            Session ID
          </Box>
          {sessionId || 'N/A'}
        </Stack>
      </Stack>
    </>
  );

  const renderQRCode = qrCode && (
    <>
      <CardHeader
        title="QR Code"
        action={
          <IconButton>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        }
      />
      <Stack alignItems="center" sx={{ p: 3 }}>
        <Box
          component="img"
          src={qrCode}
          alt="QR Code"
          sx={{ width: 200, height: 200, borderRadius: 1.5 }}
        />
      </Stack>
    </>
  );

  return (
    <Card>
      {renderCustomer}

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderPayment}

      {qrCode && (
        <>
          <Divider sx={{ borderStyle: 'dashed' }} />
          {renderQRCode}
        </>
      )}
    </Card>
  );
}
