import dayjs from 'dayjs';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormHelperText from '@mui/material/FormHelperText';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

import { useResponsive } from 'src/hooks/use-responsive';

// ----------------------------------------------------------------------

export function CustomDateRangePicker({
  open,
  error,
  endDate,
  onClose,
  startDate,
  PaperProps,
  onChangeEndDate,
  variant = 'input',
  onChangeStartDate,
  title = 'Select date range',
  ...other
}) {
  const mdUp = useResponsive('up', 'md');

  const isCalendarView = variant === 'calendar';

  // Fonction pour gérer le changement de date de début sans conversion de fuseau horaire
  const handleStartDateChange = (newDate) => {
    // Formater la date sans conversion de fuseau horaire
    const formattedDate = newDate ? dayjs(newDate).format('YYYY-MM-DDTHH:mm:ss') : null;
    onChangeStartDate(dayjs(formattedDate));
  };

  // Fonction pour gérer le changement de date de fin sans conversion de fuseau horaire
  const handleEndDateChange = (newDate) => {
    // Formater la date sans conversion de fuseau horaire
    const formattedDate = newDate ? dayjs(newDate).format('YYYY-MM-DDTHH:mm:ss') : null;
    onChangeEndDate(dayjs(formattedDate));
  };

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={onClose}
      maxWidth={isCalendarView ? false : 'xs'}
      PaperProps={{
        ...PaperProps,
        sx: {
          ...(isCalendarView && { maxWidth: 720 }),
          ...PaperProps?.sx,
        },
      }}
      {...other}
    >
      <DialogTitle sx={{ pb: 2 }}>{title}</DialogTitle>

      <DialogContent sx={{ ...(isCalendarView && mdUp && { overflow: 'unset' }) }}>
        <Stack
          justifyContent="center"
          spacing={isCalendarView ? 3 : 2}
          direction={isCalendarView && mdUp ? 'row' : 'column'}
          sx={{ pt: 1 }}
        >
          {isCalendarView ? (
            <>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: 'divider',
                  borderStyle: 'dashed',
                }}
              >
                <DateCalendar
                  value={startDate}
                  onChange={handleStartDateChange}
                  // Retirer complètement la propriété timezone/timeZone
                />
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: 'divider',
                  borderStyle: 'dashed',
                }}
              >
                <DateCalendar value={endDate} onChange={handleEndDateChange} />
              </Paper>
            </>
          ) : (
            <>
              <DatePicker label="Start date" value={startDate} onChange={handleStartDateChange} />

              <DatePicker label="End date" value={endDate} onChange={handleEndDateChange} />
            </>
          )}
        </Stack>

        {error && (
          <FormHelperText error sx={{ px: 2 }}>
            End date must be later than start date
          </FormHelperText>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={error} variant="contained" onClick={onClose}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
