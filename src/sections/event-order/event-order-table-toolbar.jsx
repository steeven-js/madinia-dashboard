import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function EventOrderTableToolbar({ filters, onResetPage, dateError }) {
  const handleFilterName = useCallback(
    (event) => {
      filters.setState({ name: event.target.value });
      onResetPage();
    },
    [filters, onResetPage]
  );

  const handleFilterStartDate = useCallback(
    (newValue) => {
      filters.setState({ startDate: newValue });
      onResetPage();
    },
    [filters, onResetPage]
  );

  const handleFilterEndDate = useCallback(
    (newValue) => {
      filters.setState({ endDate: newValue });
      onResetPage();
    },
    [filters, onResetPage]
  );

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{
        xs: 'column',
        md: 'row',
      }}
      sx={{
        p: 2.5,
        pr: { xs: 2.5, md: 1 },
      }}
    >
      <DatePicker
        label="Start date"
        value={filters.state.startDate}
        onChange={handleFilterStartDate}
        slotProps={{
          textField: {
            error: dateError,
            helperText: dateError && 'End date must be later than start date',
          },
        }}
      />

      <DatePicker
        label="End date"
        value={filters.state.endDate}
        onChange={handleFilterEndDate}
        slotProps={{
          textField: {
            error: dateError,
            helperText: dateError && 'End date must be later than start date',
          },
        }}
      />

      <TextField
        fullWidth
        value={filters.state.name}
        onChange={handleFilterName}
        placeholder="Search customer or order..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  );
}

EventOrderTableToolbar.propTypes = {
  filters: PropTypes.shape({
    state: PropTypes.shape({
      name: PropTypes.string,
      status: PropTypes.string,
      startDate: PropTypes.oneOfType([PropTypes.object, PropTypes.instanceOf(Date)]),
      endDate: PropTypes.oneOfType([PropTypes.object, PropTypes.instanceOf(Date)]),
    }),
    setState: PropTypes.func,
  }),
  onResetPage: PropTypes.func,
  dateError: PropTypes.bool,
};
