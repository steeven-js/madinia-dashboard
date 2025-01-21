import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Timeline from '@mui/lab/Timeline';
import { Typography } from '@mui/material';
import TimelineDot from '@mui/lab/TimelineDot';
import CardHeader from '@mui/material/CardHeader';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { fDateTime, fEuroDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export function EventOrderDetailsHistory({ createdAt, updatedAt, status }) {
  const renderSummary = (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        gap: 2,
        minWidth: 260,
        flexShrink: 0,
        borderRadius: 2,
        display: 'flex',
        typography: 'body2',
        borderStyle: 'dashed',
        flexDirection: 'column',
      }}
    >
      <Stack spacing={0.5}>
        <Box sx={{ color: 'text.disabled' }}>Date de création</Box>
        <Typography variant="body2">{fEuroDateTime(createdAt)}</Typography>
        </Stack>

      <Stack spacing={0.5}>
        <Box sx={{ color: 'text.disabled' }}>Dernière mise à jour</Box>
        <Typography variant="body2">{fEuroDateTime(updatedAt)}</Typography>
        </Stack>
    </Paper>
  );

  const renderTimeline = (
    <Timeline
      sx={{
        p: 0,
        m: 0,
        [`& .${timelineItemClasses.root}:before`]: {
          flex: 0,
          padding: 0,
        },
      }}
    >
      <TimelineItem>
        <TimelineSeparator>
          <TimelineDot color="primary" />
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          Commande créée
          <Box sx={{ color: 'text.disabled', typography: 'caption', mt: 0.5 }}>
            {fDateTime(createdAt)}
          </Box>
        </TimelineContent>
      </TimelineItem>

      <TimelineItem>
        <TimelineSeparator>
          <TimelineDot
            color={
              (status === 'paid' && 'success') ||
              (status === 'unpaid' && 'warning') ||
              (status === 'refunded' && 'error') ||
              'grey'
            }
          />
        </TimelineSeparator>
        <TimelineContent>
          Statut actuel: {status}
          <Box sx={{ color: 'text.disabled', typography: 'caption', mt: 0.5 }}>
            {fDateTime(updatedAt)}
          </Box>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );

  return (
    <Card>
      <CardHeader title="Historique" />
      <Stack
        spacing={3}
        alignItems={{ md: 'flex-start' }}
        direction={{ xs: 'column-reverse', md: 'row' }}
        sx={{ p: 3 }}
      >
        {renderTimeline}
        {renderSummary}
      </Stack>
    </Card>
  );
}
