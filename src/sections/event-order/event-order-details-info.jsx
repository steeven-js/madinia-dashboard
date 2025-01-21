import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function EventOrderDetailsInfo({ customerName, customerEmail, sessionId, qrCode }) {
  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader title="Informations client" />

        <Stack spacing={2} sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Nom
            </Typography>
            <Typography variant="body2">{customerName || 'N/A'}</Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Email
            </Typography>
            <Typography variant="body2">{customerEmail || 'N/A'}</Typography>
          </Stack>
        </Stack>
      </Card>

      {qrCode && (
        <Card>
          <CardHeader title="QR Code" />
          <Stack spacing={2} sx={{ p: 3 }}>
            <img src={qrCode} alt="QR Code" style={{ maxWidth: '100%', height: 'auto' }} />
          </Stack>
        </Card>
      )}

      {sessionId && (
        <Card>
          <CardHeader title="Informations de paiement" />
          <Stack spacing={2} sx={{ p: 3 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Session ID
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  wordBreak: 'break-all',
                  maxWidth: '100%',
                  overflowWrap: 'break-word'
                }}
              >
                {sessionId}
              </Typography>
            </Stack>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

EventOrderDetailsInfo.propTypes = {
  customerName: PropTypes.string,
  customerEmail: PropTypes.string,
  sessionId: PropTypes.string,
  qrCode: PropTypes.string,
};
