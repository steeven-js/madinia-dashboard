import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { useBoolean } from 'src/hooks/use-boolean';

import { USER_STATUS_OPTIONS } from 'src/_mock';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { UserQuickEditForm } from './user-quick-edit-form';

// ----------------------------------------------------------------------

export default function UserTableRow({
  row,
  selected,
  onEditRow,
  onSelectRow,
  onDeleteRow,
  roleOptions,
  onChangeRole,
  onChangeStatus,
  isCurrentUser,
}) {
  const { firstName, lastName, role, status, email, phoneNumber, avatarUrl } = row;
  const fullName = `${firstName} ${lastName}`;

  const confirm = useBoolean();
  const popover = usePopover();
  const quickEdit = useBoolean();

  const handleChangeRole = (event) => {
    onChangeRole(event.target.value);
  };

  const handleChangeStatus = (event) => {
    onChangeStatus(event.target.value);
  };

  const getStatusColor = (userStatus) => {
    switch (userStatus) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'banned':
        return 'error';
      case 'rejected':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell sx={{ width: 280 }}>
          <Stack spacing={2} direction="row" alignItems="center">
            <Avatar alt={fullName} src={avatarUrl} />

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link color="inherit" onClick={onEditRow} sx={{ cursor: 'pointer', typography: 'subtitle2' }}>
                {fullName}
              </Link>
              <Box component="span" sx={{ color: 'text.disabled' }}>
                {email}
              </Box>
            </Stack>
          </Stack>
        </TableCell>

        <TableCell sx={{ width: 180 }}>
          <ListItemText
            primary={phoneNumber}
            primaryTypographyProps={{ typography: 'body2', noWrap: true }}
          />
        </TableCell>

        <TableCell sx={{ width: 180 }}>
          <Select
            value={role}
            onChange={handleChangeRole}
            disabled={isCurrentUser}
            size="small"
            sx={{ minWidth: 120 }}
          >
            {roleOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </TableCell>

        <TableCell sx={{ width: 180 }}>
          <Select
            value={status}
            onChange={handleChangeStatus}
            size="small"
            sx={{ minWidth: 120 }}
            renderValue={(value) => (
              <Label
                variant="soft"
                color={getStatusColor(value)}
                sx={{ textTransform: 'capitalize' }}
              >
                {value}
              </Label>
            )}
          >
            {USER_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Label
                  variant="soft"
                  color={getStatusColor(option.value)}
                  sx={{ textTransform: 'capitalize', mx: 1 }}
                >
                  {option.label}
                </Label>
              </MenuItem>
            ))}
          </Select>
        </TableCell>

        <TableCell align="right" sx={{ width: 100, px: 1 }}>
          <IconButton color={quickEdit.value ? 'inherit' : 'default'} onClick={quickEdit.onTrue}>
            <Iconify icon="solar:pen-bold" />
          </IconButton>

          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <UserQuickEditForm currentUser={row} open={quickEdit.value} onClose={quickEdit.onFalse} />

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
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

          <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Modifier
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Supprimer"
        content="Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Supprimer
          </Button>
        }
      />
    </>
  );
}

UserTableRow.propTypes = {
  row: PropTypes.shape({
    id: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    phoneNumber: PropTypes.string,
    role: PropTypes.string,
    status: PropTypes.string,
    avatarUrl: PropTypes.string,
  }),
  selected: PropTypes.bool,
  onEditRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  onDeleteRow: PropTypes.func,
  roleOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  onChangeRole: PropTypes.func,
  onChangeStatus: PropTypes.func,
  isCurrentUser: PropTypes.bool,
};
