import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import { USER_ROLES_OPTIONS } from 'src/_mock';
import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export default function UserTableToolbar({
  filters = { name: '', role: [] },
  onFilterName,
  onFilterRole,
  roleOptions = USER_ROLES_OPTIONS,
  currentUserRole,
}) {
  const popover = usePopover();
  const currentUserLevel = CONFIG.roles[currentUserRole]?.level || 0;

  console.log('UserTableToolbar - roleOptions:', roleOptions);
  console.log('UserTableToolbar - currentUserRole:', currentUserRole);
  console.log('UserTableToolbar - currentUserLevel:', currentUserLevel);

  // Afficher tous les rôles pour le filtre, mais désactiver ceux qui ne sont pas accessibles
  const availableRoles = roleOptions.map((role) => ({
    ...role,
    disabled:
      currentUserRole !== 'super_admin' && CONFIG.roles[role.value]?.level > currentUserLevel,
  }));

  console.log('UserTableToolbar - availableRoles:', availableRoles);

  const handleFilterName = useCallback(
    (event) => {
      onFilterName(event.target.value);
    },
    [onFilterName]
  );

  const handleFilterRole = (event) => {
    const {
      target: { value },
    } = event;
    onFilterRole(typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <>
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
        <FormControl
          sx={{
            flexShrink: 0,
            width: { xs: 1, md: 200 },
          }}
        >
          <InputLabel>Rôle</InputLabel>

          <Select
            multiple
            value={filters.role || []}
            onChange={handleFilterRole}
            input={<OutlinedInput label="Rôle" />}
            renderValue={(selected) => {
              console.log('Selected roles:', selected);
              return selected
                .map((value) => {
                  const role = availableRoles.find((option) => option.value === value);
                  console.log('Found role for value:', value, role);
                  return role ? role.label : value;
                })
                .join(', ');
            }}
          >
            {availableRoles.map((option) => {
              console.log('Rendering role option:', option);
              return (
                <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
                  <Checkbox
                    disableRipple
                    size="small"
                    checked={(filters.role || []).includes(option.value)}
                  />
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          value={filters.name || ''}
          onChange={handleFilterName}
          placeholder="Rechercher..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <IconButton onClick={popover.onOpen}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </Stack>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
          >
            <Iconify icon="solar:printer-minimalistic-bold" />
            Print
          </MenuItem>

          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
          >
            <Iconify icon="solar:import-bold" />
            Import
          </MenuItem>

          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
          >
            <Iconify icon="solar:export-bold" />
            Export
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}

UserTableToolbar.propTypes = {
  filters: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.arrayOf(PropTypes.string),
  }),
  onFilterName: PropTypes.func,
  onFilterRole: PropTypes.func,
  roleOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      level: PropTypes.number,
    })
  ),
  currentUserRole: PropTypes.string,
};
