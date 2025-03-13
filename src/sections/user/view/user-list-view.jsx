import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';
import { updateUserRole, updateUserStatus } from 'src/hooks/use-users';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';
import { USER_STATUS_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { RoleBasedGuard } from 'src/auth/guard';

import UserTableRow from '../user-table-row';
import UserTableToolbar from '../user-table-toolbar';
import { UserTableFiltersResult } from '../user-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...USER_STATUS_OPTIONS];

// Fonction helper pour obtenir le label du rôle
const getRoleLabel = (roleName) => CONFIG.roles[roleName]?.label || roleName;

const ROLE_OPTIONS = Object.entries(CONFIG.roles)
  .sort((a, b) => b[1].level - a[1].level)
  .map(([value, role]) => ({
    value,
    label: role.label, // Utiliser le label défini dans la configuration
    level: role.level,
  }));

console.log('CONFIG.roles:', CONFIG.roles);
console.log('ROLE_OPTIONS:', ROLE_OPTIONS);

const TABLE_HEAD = [
  { id: 'name', label: 'Utilisateur', align: 'left', width: 280 },
  { id: 'phoneNumber', label: 'Téléphone', align: 'left', width: 180 },
  { id: 'role', label: 'Rôle', align: 'left', width: 180 },
  { id: 'status', label: 'Statut', align: 'left', width: 180 },
  { id: 'actions', label: '', align: 'right', width: 100 },
];

// ----------------------------------------------------------------------

export function UserListView({ users, currentAuthUser }) {
  const table = useTable();

  const router = useRouter();

  const confirm = useBoolean();

  console.log('currentAuthUser:', currentAuthUser);

  const currentUserLevel = CONFIG.roles[currentAuthUser?.role]?.level || 0;
  console.log('currentUserLevel:', currentUserLevel);

  const manageableRoles = ROLE_OPTIONS.filter((role) => {
    if (currentAuthUser?.role === 'super_admin') return true;
    return role.level < currentUserLevel;
  });

  console.log('manageableRoles:', manageableRoles);

  const canManageUsers = currentUserLevel >= CONFIG.roles.admin.level;

  const [tableData, setTableData] = useState(users);

  const filters = useSetState({ name: '', role: [], status: 'all' });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.name || filters.state.role.length > 0 || filters.state.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    (id) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      toast.success('Delete success!');

      setTableData(deleteRow);

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

    toast.success('Delete success!');

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.user.edit(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  const handleChangeRole = useCallback(
    async (userId, newRole) => {
      const targetUser = tableData.find((user) => user.id === userId);
      const targetRoleLevel = CONFIG.roles[newRole]?.level || 0;

      // Super admin peut attribuer n'importe quel rôle
      if (currentAuthUser?.role !== 'super_admin') {
        // Pour les autres, vérifier le niveau
        if (targetRoleLevel >= currentUserLevel) {
          toast.error("Vous n'avez pas les permissions nécessaires pour attribuer ce rôle");
          return;
        }
      }

      try {
        await updateUserRole(userId, newRole);
        setTableData((prevData) =>
          prevData.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  role: newRole,
                  roleLevel: CONFIG.roles[newRole].level,
                  permissions: CONFIG.roles[newRole].permissions,
                }
              : user
          )
        );
        toast.success('Rôle mis à jour avec succès');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle:', error);
        toast.error('Une erreur est survenue lors de la mise à jour du rôle');
      }
    },
    [tableData, currentUserLevel, currentAuthUser?.role]
  );

  const handleChangeStatus = useCallback(async (userId, newStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      // Mettre à jour les données locales
      setTableData((prevData) =>
        prevData.map((user) => (user.id === userId ? { ...user, status: newStatus } : user))
      );
      toast.success('Statut mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Une erreur est survenue lors de la mise à jour du statut');
    }
  }, []);

  const handleFilterName = useCallback(
    (value) => {
      filters.setState({ name: value });
    },
    [filters]
  );

  const handleFilterRole = useCallback(
    (value) => {
      filters.setState({ role: value });
    },
    [filters]
  );

  const handleResetFilters = useCallback(() => {
    filters.setState({ name: '', role: [], status: 'all' });
  }, [filters]);

  const handleSelectRow = useCallback(
    (id) => {
      table.onSelectRow(id);
    },
    [table]
  );

  const handleSelectAllRows = useCallback(() => {
    table.onSelectAllRows(
      true,
      dataFiltered.map((row) => row.id)
    );
  }, [table, dataFiltered]);

  const canManageUser = useCallback(
    (user) => {
      // Super admin peut tout gérer
      if (currentAuthUser?.role === 'super_admin') return true;

      const userRoleLevel = CONFIG.roles[user.role]?.level || 0;
      return userRoleLevel < currentUserLevel;
    },
    [currentUserLevel, currentAuthUser?.role]
  );

  return (
    <>
      <DashboardContent>
        <RoleBasedGuard
          hasContent
          currentRole={currentAuthUser?.role}
          acceptRoles={Object.keys(CONFIG.roles).filter(
            (role) => CONFIG.roles[role].level >= CONFIG.roles.admin.level
          )}
          sx={{ py: 10 }}
        >
          <CustomBreadcrumbs
            heading="List"
            links={[
              { name: 'Dashboard', href: paths.dashboard.root },
              { name: 'User', href: paths.dashboard.user.root },
              { name: 'List' },
            ]}
            action={
              <Button
                component={RouterLink}
                href={paths.dashboard.user.new}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                Nouvel utilisateur
              </Button>
            }
            sx={{ mb: { xs: 3, md: 5 } }}
          />
          <Card>
            <Tabs
              value={filters.state.status}
              onChange={handleFilterStatus}
              sx={{
                px: 2.5,
                boxShadow: (theme) =>
                  `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }}
            >
              {STATUS_OPTIONS.map((tab) => (
                <Tab
                  key={tab.value}
                  iconPosition="end"
                  value={tab.value}
                  label={tab.label}
                  icon={
                    <Label
                      variant={
                        ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                        'soft'
                      }
                      color={
                        (tab.value === 'active' && 'success') ||
                        (tab.value === 'pending' && 'warning') ||
                        (tab.value === 'banned' && 'error') ||
                        'default'
                      }
                    >
                      {['active', 'pending', 'banned', 'rejected'].includes(tab.value)
                        ? tableData.filter((user) => user.status === tab.value).length
                        : tableData.length}
                    </Label>
                  }
                />
              ))}
            </Tabs>

            <UserTableToolbar
              filters={filters}
              onResetPage={table.onResetPage}
              onFilterName={handleFilterName}
              onFilterRole={handleFilterRole}
              onFilterStatus={handleFilterStatus}
              roleOptions={ROLE_OPTIONS}
              currentUserRole={currentAuthUser?.role}
              onResetFilters={handleResetFilters}
            />

            {canReset && (
              <UserTableFiltersResult
                filters={filters}
                totalResults={dataFiltered.length}
                onResetPage={table.onResetPage}
                onResetFilters={handleResetFilters}
                sx={{ p: 2.5, pt: 0 }}
              />
            )}

            <Box sx={{ position: 'relative' }}>
              <TableSelectedAction
                dense={table.dense}
                numSelected={table.selected.length}
                rowCount={dataFiltered.length}
                onSelectAllRows={handleSelectAllRows}
                action={
                  <Tooltip title="Delete">
                    <IconButton color="primary" onClick={confirm.onTrue}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                }
              />

              <Scrollbar>
                <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                  <TableHeadCustom
                    order={table.order}
                    orderBy={table.orderBy}
                    headLabel={TABLE_HEAD}
                    rowCount={dataFiltered.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    onSelectAllRows={handleSelectAllRows}
                  />

                  <TableBody>
                    {dataFiltered
                      .slice(
                        table.page * table.rowsPerPage,
                        table.page * table.rowsPerPage + table.rowsPerPage
                      )
                      .map((row) => (
                        <UserTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => handleSelectRow(row.id)}
                          onDeleteRow={() => handleDeleteRow(row.id)}
                          onEditRow={() => handleEditRow(row.id)}
                          roleOptions={manageableRoles}
                          onChangeRole={(newRole) => handleChangeRole(row.id, newRole)}
                          onChangeStatus={(newStatus) => handleChangeStatus(row.id, newStatus)}
                          isCurrentUser={currentAuthUser?.id === row.id}
                          canManage={canManageUser(row)}
                          currentUserRole={currentAuthUser?.role}
                        />
                      ))}

                    <TableEmptyRows
                      height={table.dense ? 56 : 56 + 20}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                    />

                    <TableNoData notFound={notFound} />
                  </TableBody>
                </Table>
              </Scrollbar>
            </Box>

            <TablePaginationCustom
              page={table.page}
              dense={table.dense}
              count={dataFiltered.length}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              onChangeDense={table.onChangeDense}
              onRowsPerPageChange={table.onChangeRowsPerPage}
            />
          </Card>
        </RoleBasedGuard>
      </DashboardContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}

function applyFilter({ inputData, comparator, filters }) {
  const { name, status, role } = filters;

  // Create stable sort array
  const stabilizedThis = inputData.map((el, index) => [el, index]);

  // Sort based on comparator and maintain original order for equal items
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    return order !== 0 ? order : a[1] - b[1];
  });

  // Apply filters sequentially
  return stabilizedThis
    .map((el) => el[0])
    .filter((user) => {
      // Name filter
      if (name && !user.displayName.toLowerCase().includes(name.toLowerCase())) {
        return false;
      }

      // Status filter
      if (status !== 'all' && user.status !== status) {
        return false;
      }

      // Role filter
      if (role?.length && !role.includes(user.role)) {
        return false;
      }

      return true;
    });
}

UserListView.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      email: PropTypes.string,
      phoneNumber: PropTypes.string,
      role: PropTypes.string,
      status: PropTypes.string,
      avatarUrl: PropTypes.string,
    })
  ),
  currentAuthUser: PropTypes.shape({
    id: PropTypes.string,
    role: PropTypes.string,
    email: PropTypes.string,
  }),
};
