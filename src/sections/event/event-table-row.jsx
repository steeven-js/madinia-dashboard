import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency } from 'src/utils/format-number';
import { fEuroDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function EventTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow }) {
  const confirm = useBoolean();
  const popover = usePopover();

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Stack spacing={2} direction="row" alignItems="center">
            <Avatar
              alt={row.title}
              src={row.image}
              variant="rounded"
              sx={{ width: 64, height: 64 }}
            />

            <Stack spacing={0.5}>
              <Link
                color="inherit"
                onClick={onEditRow}
                sx={{ cursor: 'pointer', typography: 'subtitle2' }}
              >
                {row.title.length > 30 ? `${row.title.slice(0, 30)}...` : row.title}
              </Link>
            </Stack>
          </Stack>
        </TableCell>

        <TableCell>{fEuroDateTime(row.date)}</TableCell>

        <TableCell>{row.location}</TableCell>

        <TableCell>
          {row.participants.current}/{row.participants.max}
        </TableCell>

        <TableCell>{fCurrency(row.price)}</TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'current' && 'success') ||
              (row.status === 'pending' && 'warning') ||
              (row.status === 'past' && 'warning') ||
              (row.status === 'draft' && 'default') ||
              (row.status === 'cancelled' && 'error') ||
              'default'
            }
          >
            {row.status === 'current' && 'En cours'}
            {row.status === 'pending' && 'Programmé'}
            {row.status === 'past' && 'Terminé'}
            {row.status === 'draft' && 'Brouillon'}
            {row.status === 'cancelled' && 'Annulé'}
          </Label>
        </TableCell>

        <TableCell>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuList>
          <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Modifier
          </MenuItem>

          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Supprimer
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Supprimer"
        content="Êtes-vous sûr de vouloir supprimer cet événement ?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Supprimer
          </Button>
        }
      />
    </>
  );
}
