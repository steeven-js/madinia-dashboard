import { useState } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import ListItemText from '@mui/material/ListItemText';

import { useBoolean } from 'src/hooks/use-boolean';
import { deleteUserCompletely } from 'src/hooks/use-users';

import { CONFIG } from 'src/config-global';
import { USER_STATUS_OPTIONS } from 'src/_mock';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { UserQuickEditForm } from './user-quick-edit-form';

// ----------------------------------------------------------------------

// Utiliser les labels définis dans la configuration
const getRoleLabel = (roleName) => CONFIG.roles[roleName]?.label || roleName;

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
  canManage,
  currentUserRole,
}) {
  const { id, firstName, lastName, role, status, email, phoneNumber, avatarUrl } = row;
  const fullName = `${firstName} ${lastName}`;

  const confirm = useBoolean();
  const popover = usePopover();
  const quickEdit = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChangeRole = (event) => {
    onChangeRole(event.target.value);
  };

  const handleChangeStatus = (event) => {
    onChangeStatus(event.target.value);
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      await deleteUserCompletely(id);
      onDeleteRow();
      confirm.onFalse();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setIsDeleting(false);
    }
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

  const getDisplayName = (user) => {
    if (user.displayName) {
      return user.displayName;
    }
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return 'N/A';
  };

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell sx={{ width: 280 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar alt={getDisplayName(row)} src={row.avatarUrl || ''} />
            <ListItemText
              primary={getDisplayName(row)}
              secondary={row.email}
              primaryTypographyProps={{ typography: 'body2' }}
              secondaryTypographyProps={{
                component: 'span',
                color: 'text.disabled',
              }}
            />
          </Stack>
        </TableCell>

        <TableCell sx={{ width: 180 }}>
          <Typography variant="body2" noWrap>
            {row.phoneNumber || 'N/A'}
          </Typography>
        </TableCell>

        <TableCell sx={{ width: 180 }}>
          <Select
            value={role}
            onChange={handleChangeRole}
            disabled={isCurrentUser}
            size="small"
            sx={{ minWidth: 120 }}
            renderValue={(value) => getRoleLabel(value)}
          >
            {roleOptions.map((option) => (
              <MenuItem
                key={option.value}
                value={option.value}
                disabled={
                  currentUserRole !== 'super_admin' && option.level >= CONFIG.roles[role]?.level
                }
              >
                {getRoleLabel(option.value)}
              </MenuItem>
            ))}
          </Select>
        </TableCell>

        <TableCell sx={{ width: 180 }}>
          <Select
            value={status}
            onChange={handleChangeStatus}
            disabled={isCurrentUser}
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
          <IconButton
            color={quickEdit.value ? 'inherit' : 'default'}
            onClick={quickEdit.onTrue}
            disabled={isCurrentUser}
          >
            <Iconify icon="solar:pen-bold" />
          </IconButton>

          <IconButton
            color={popover.open ? 'inherit' : 'default'}
            onClick={popover.onOpen}
            disabled={isCurrentUser}
          >
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
        content="Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action supprimera l'utilisateur de Firebase Auth, de la base de données Firestore et tous les fichiers associés dans Storage. Cette action est irréversible."
        action={
          <LoadingButton
            variant="contained"
            color="error"
            onClick={handleDeleteUser}
            loading={isDeleting}
          >
            Supprimer
          </LoadingButton>
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
  canManage: PropTypes.bool,
  currentUserRole: PropTypes.string,
};
