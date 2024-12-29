import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

export function EventOrderTableRow({ row, selected, onSelectRow, onViewRow, onDeleteRow }) {
  const { orderNumber, customerName, customerEmail, eventTitle, createdAt, status, totalAmount } =
    row;

  const quickEdit = useBoolean();
  const router = useRouter();

  const handleViewRow = () => {
    router.push(paths.dashboard.eventOrder.details(row.id));
  };

  return (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onClick={onSelectRow} />
      </TableCell>

      <TableCell>
        <Link color="inherit" onClick={handleViewRow} underline="always" sx={{ cursor: 'pointer' }}>
          {orderNumber}
        </Link>
      </TableCell>

      <TableCell>
        <Stack spacing={2} direction="row" alignItems="center">
          <Stack
            sx={{
              typography: 'body2',
              flex: '1 1 auto',
              alignItems: 'flex-start',
            }}
          >
            <Box component="span">{customerName}</Box>
            <Box component="span" sx={{ color: 'text.disabled' }}>
              {customerEmail}
            </Box>
          </Stack>
        </Stack>
      </TableCell>

      <TableCell>{eventTitle}</TableCell>

      <TableCell>{fDate(createdAt)}</TableCell>

      <TableCell>{fCurrency(totalAmount)}</TableCell>

      <TableCell>
        <Label
          variant="soft"
          color={
            (status === 'paid' && 'success') || (status === 'unpaid' && 'warning') || 'default'
          }
        >
          {status}
        </Label>
      </TableCell>

      <TableCell align="right" sx={{ px: 1 }}>
        <IconButton color={quickEdit.value ? 'inherit' : 'default'} onClick={onDeleteRow}>
          <Iconify icon="solar:trash-bin-trash-bold" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

EventOrderTableRow.propTypes = {
  row: PropTypes.shape({
    orderNumber: PropTypes.string,
    customerName: PropTypes.string,
    customerEmail: PropTypes.string,
    eventTitle: PropTypes.string,
    createdAt: PropTypes.string,
    status: PropTypes.string,
    totalAmount: PropTypes.number,
  }),
  selected: PropTypes.bool,
  onSelectRow: PropTypes.func,
  onViewRow: PropTypes.func,
  onDeleteRow: PropTypes.func,
};
