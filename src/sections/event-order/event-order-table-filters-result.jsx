import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function EventOrderTableFiltersResult({ filters, totalResults, onResetPage, sx }) {
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters?.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    filters?.setState({ status: 'all' });
  }, [filters, onResetPage]);

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    filters?.setState({ startDate: null, endDate: null });
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    onResetPage();
    filters?.setState({
      name: '',
      status: 'all',
      startDate: null,
      endDate: null,
    });
  }, [filters, onResetPage]);

  if (!filters?.state) {
    return null;
  }

  const showStatus = filters.state.status && filters.state.status !== 'all';
  const showDate = Boolean(filters.state.startDate && filters.state.endDate);
  const showKeyword = Boolean(filters.state.name);

  if (!showStatus && !showDate && !showKeyword) {
    return null;
  }

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Status:" isShow={filters.state.status !== 'all'}>
        <Chip
          {...chipProps}
          label={filters.state.status}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock
        label="Date:"
        isShow={Boolean(filters.state.startDate && filters.state.endDate)}
      >
        <Chip
          {...chipProps}
          label={fDateRangeShortLabel(filters.state.startDate, filters.state.endDate)}
          onDelete={handleRemoveDate}
        />
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}

EventOrderTableFiltersResult.propTypes = {
  filters: PropTypes.shape({
    state: PropTypes.shape({
      name: PropTypes.string,
      status: PropTypes.string,
      startDate: PropTypes.oneOfType([PropTypes.object, PropTypes.instanceOf(Date)]),
      endDate: PropTypes.oneOfType([PropTypes.object, PropTypes.instanceOf(Date)]),
    }),
    setState: PropTypes.func,
  }),
  totalResults: PropTypes.number,
  onResetPage: PropTypes.func,
  sx: PropTypes.shape({}),
};
